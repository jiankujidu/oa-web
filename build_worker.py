#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 public/ 下的前端静态资源内联进 Cloudflare Worker 脚本，
生成 dist/worker.js：前端由 CF 边缘节点直接返回（不再依赖 GitHub Pages），
OA 业务接口仍反代到 oa.upingbio.cn。同源 => 浏览器不拦、登录可用、且更快。

用法: python build_worker.py
依赖: Python 3（仅标准库）
"""
import os, base64, json, subprocess, datetime, re

ROOT = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(ROOT, "public")
OUT_DIR = os.path.join(ROOT, "dist")
OUT = os.path.join(OUT_DIR, "worker.js")


def _git(args, default=""):
    try:
        return subprocess.check_output(
            ["git"] + args, cwd=ROOT, stderr=subprocess.DEVNULL
        ).decode("utf-8", "replace").strip()
    except Exception:
        return default


def _repo_web_url():
    # 从 remote 里稳健提取 owner/repo，无论它是 SSH/https 还是被工具改写过的畸形格式
    url = _git(["remote", "get-url", "origin"], "")
    m = re.search(r"github\.com[:/]([\w.-]+/[\w.-]+?)(?:\.git)?/?$", url)
    if m:
        return "https://github.com/" + m.group(1)
    return "https://github.com/jiankujidu/oa-web"


COMMIT = _git(["rev-parse", "HEAD"], "unknown")
REPO_URL = _repo_web_url()
BUILD_TIME = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

CT = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}

INJECT = '<script>window.OA_BASE=location.origin;</script>'  # 同域：前端 API 请求发回本 Worker

# HTML 内联：把 <link stylesheet> / <script src> 替换为内联内容。
# 国内访问 CF 边缘时多资源串行加载易挂起（表现为启动屏卡死/验证码空白）；内联后每页只发一次请求。
INL_CSS_RE = re.compile(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>')
INL_JS_RE = re.compile(r'<script\s+src="([^"]+)"\s*>\s*</script>')


def _inline_html(txt, files):
    def css_sub(m):
        key = "/" + m.group(1).lstrip("/")
        raw = files.get(key)
        if raw is None:
            return m.group(0)
        return "<style>\n" + raw.decode("utf-8", "replace") + "\n</style>"

    def js_sub(m):
        key = "/" + m.group(1).lstrip("/")
        raw = files.get(key)
        if raw is None:
            return m.group(0)
        code = raw.decode("utf-8", "replace").replace("</script", "<\\/script")
        return "<script>\n" + code + "\n</script>"

    txt = INL_CSS_RE.sub(css_sub, txt)
    txt = INL_JS_RE.sub(js_sub, txt)
    return txt


def collect():
    # 第一遍：读入全部文件
    files = {}
    for dirpath, _, names in os.walk(PUB):
        for f in names:
            full = os.path.join(dirpath, f)
            rel = os.path.relpath(full, PUB).replace(os.sep, "/")
            if not rel.startswith("/"):
                rel = "/" + rel
            with open(full, "rb") as fh:
                files[rel] = fh.read()

    # 第二遍：处理 HTML（同域注入 + git 信息 + 内联 CSS/JS）
    assets = {}
    for rel, raw in files.items():
        ext = os.path.splitext(rel)[1].lower()
        ct = CT.get(ext, "application/octet-stream")
        if ext == ".html":
            txt = raw.decode("utf-8", "replace")
            if "</head>" in txt:
                txt = txt.replace("</head>", INJECT + "</head>", 1)
            else:
                txt = txt.replace("</html>", INJECT + "</html>", 1)
            # 注入 git/构建信息占位符（仅 git.html 用到，其他页面无占位符则无副作用）
            txt = (txt.replace("__COMMIT__", COMMIT)
                      .replace("__REPO_URL__", REPO_URL)
                      .replace("__BUILD_TIME__", BUILD_TIME))
            txt = _inline_html(txt, files)
            raw = txt.encode("utf-8")
        assets[rel] = {"b": base64.b64encode(raw).decode("ascii"), "t": ct}
    return assets


def build():
    assets = collect()
    assets_json = json.dumps(assets, ensure_ascii=False, separators=(",", ":"))

    worker = r"""
// 优品OA 网页版 · 单一 Worker（自带前端资源 + API 全反代）
// 由 build_worker.py 自动生成：前端资源内联在 ASSETS 中，CF 边缘就近返回，不再依赖 GitHub Pages。
const OA_ORIGIN = 'https://oa.upingbio.cn';

// 前端资源表（path -> {b: base64, t: content-type}），构建时内联
const ASSETS = __ASSETS__;

const API_RE = /^\/(home|oa|customer|note|message|product|api|file|admin|upload|attachment|public|captcha\.html|index\.php)/i;
function isApi(p) { return API_RE.test(p); }

function b64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function serveAsset(pathname) {
  let key = pathname;
  if (key === '/' || key === '') key = '/login.html';
  if (key === '/git') key = '/git.html';   // /git -> 源码仓库/部署信息页
  let a = ASSETS[key];
  if (!a && key.endsWith('/')) a = ASSETS[key + 'index.html'];
  if (!a) {
    // SPA 兜底：未知非接口路径回登录页
    a = ASSETS['/login.html'];
    key = '/login.html';
  }
  const bytes = b64ToBytes(a.b);
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': a.t + '; charset=utf-8',
      // HTML 不缓存：保证发版后浏览器立即拿到新版（CSS/JS 已内联进 HTML，无需担心配套资源版本）
      'cache-control': (a.t === 'text/html') ? 'no-cache' : 'public, max-age=600'
    }
  });
}

async function proxyApi(request, url) {
  const target = OA_ORIGIN + url.pathname + url.search;
  const hdr = new Headers(request.headers);
  hdr.delete('host');
  hdr.delete('origin');
  hdr.delete('referer');
  const init = { method: request.method, headers: hdr };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }
  let resp;
  try {
    resp = await fetch(target, init);
  } catch (e) {
    return new Response('OA 接口代理失败: ' + e.message, { status: 502 });
  }
  const rh = new Headers(resp.headers);
  const sc = (typeof resp.headers.getSetCookie === 'function')
    ? resp.headers.getSetCookie()
    : (rh.get('set-cookie') ? [rh.get('set-cookie')] : []);
  rh.delete('set-cookie');
  for (const c of sc) rh.append('set-cookie', c.replace(/;\s*Domain=[^;]+/i, ''));
  rh.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
  rh.set('Access-Control-Allow-Credentials', 'true');
  rh.set('Access-Control-Allow-Headers', 'content-type,x-requested-with,authorization');
  rh.set('Access-Control-Expose-Headers', '*');
  return new Response(resp.body, { status: resp.status, headers: rh });
}

async function handle(request) {
  const url = new URL(request.url);
  const p = decodeURIComponent(url.pathname);
  if (isApi(p)) return proxyApi(request, url);
  return serveAsset(p);
}

addEventListener('fetch', function (event) {
  event.respondWith(handle(event.request));
});
""".replace("__ASSETS__", assets_json)

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(worker)
    print("生成 %s  (资源 %d 个, 脚本 %.1f KB)" % (OUT, len(assets), len(worker) / 1024))


if __name__ == "__main__":
    build()
