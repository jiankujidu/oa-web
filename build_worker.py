#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 public/ 下的前端静态资源内联进 Cloudflare Worker 脚本，
生成 dist/worker.js：前端由 CF 边缘节点直接返回（不再依赖 GitHub Pages），
OA 业务接口仍反代到 oa.upingbio.cn。同源 => 浏览器不拦、登录可用、且更快。

体积控制（CF 免费版脚本上限 1MB）：
1) HTML 内联 <script src>/<link> 后，被内联的源文件不再单独存入 ASSETS（消除双份）；
2) 全部资产 gzip 后 base64 存储，Worker 端 DecompressionStream 解压（每隔离解压一次并缓存）。
3) 大体积文档库（docx 预览/转换 ~1.4MB）不内联，/vendor/* 由 Worker 代理到 GitHub Pages。

用法: python build_worker.py
依赖: Python 3（仅标准库）
"""
import os, base64, json, gzip, subprocess, datetime, re

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


def _inline_html(txt, files, inlined):
    def css_sub(m):
        key = "/" + m.group(1).lstrip("/")
        raw = files.get(key)
        if raw is None:
            return m.group(0)
        inlined.add(key)
        return "<style>\n" + raw.decode("utf-8", "replace") + "\n</style>"

    def js_sub(m):
        key = "/" + m.group(1).lstrip("/")
        raw = files.get(key)
        if raw is None:
            return m.group(0)
        inlined.add(key)
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
    inlined = set()  # 已被内联进某个 HTML 的源文件（不再单独存储，消除双份）
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
            txt = _inline_html(txt, files, inlined)
            raw = txt.encode("utf-8")
        assets[rel] = {"b": base64.b64encode(gzip.compress(raw, 9)).decode("ascii"), "t": ct}

    # 剔除被内联的源文件（HTML 里已无引用，浏览器不会再单独请求）
    for key in inlined:
        assets.pop(key, None)
    return assets


def build():
    assets = collect()
    assets_json = json.dumps(assets, ensure_ascii=False, separators=(",", ":"))

    worker = r"""
// 优品OA 网页版 · 单一 Worker（自带前端资源 + API 全反代）
// 由 build_worker.py 自动生成：前端资源 gzip 后内联在 ASSETS 中（CF 免费版 1MB 脚本上限），
// 请求时 DecompressionStream 解压（每隔离解压一次并缓存），CF 边缘就近返回，不再依赖 GitHub Pages。
const OA_ORIGIN = 'https://oa.upingbio.cn';
// 大体积文档库（docx 预览/转换，~1.4MB）不内联 Worker，
// 由 Worker 代理到 GitHub Pages（jiankujidu.github.io/oa-web/pages/vendor/*），CF→GitHub 服务端取数；
// 前端 ensureLib 失败还会回退 jsdelivr CDN。
const VENDOR_ORIGIN = 'https://jiankujidu.github.io';

// 前端资源表（path -> {b: base64(gzip), t: content-type}），构建时内联
const ASSETS = __ASSETS__;
const DECOMP_CACHE = new Map();

// API 路径白名单（与 App api.js 的一级路径 1:1 对齐：home/oa/customer/note/message/product/api
// + finance（财务9页）/article（问答知识）/contract（合同）；漏一个整个模块就被 SPA 兜底成登录页）
const API_RE = /^\/(home|oa|customer|note|message|product|api|file|admin|upload|attachment|public|finance|article|contract|captcha\.html|index\.php)/i;
function isApi(p) { return API_RE.test(p); }

function b64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// gzip 解压（每隔离首次解压后缓存）
async function getBytes(key) {
  if (DECOMP_CACHE.has(key)) return DECOMP_CACHE.get(key);
  const a = ASSETS[key];
  const gz = b64ToBytes(a.b);
  const rs = new Response(gz).body.pipeThrough(new DecompressionStream('gzip'));
  const buf = await new Response(rs).arrayBuffer();
  DECOMP_CACHE.set(key, buf);
  return buf;
}

async function serveAsset(pathname) {
  let key = pathname;
  // / → 主界面壳：其内联启动脚本会把未登录用户自动跳 login.html（已登录直达，少一次跳转）
  if (key === '/' || key === '') key = '/index.html';
  if (key === '/git') key = '/git.html';   // /git -> 源码仓库/部署信息页
  let a = ASSETS[key];
  if (!a && key.endsWith('/')) a = ASSETS[key + 'index.html'];
  if (!a) {
    // SPA 兜底：未知非接口路径回登录页
    a = ASSETS['/login.html'];
    key = '/login.html';
  }
  const bytes = await getBytes(key);
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': a.t + '; charset=utf-8',
      // HTML 不缓存：保证发版后浏览器立即拿到新版（CSS/JS 已内联进 HTML，无需担心配套资源版本）
      'cache-control': (a.t === 'text/html') ? 'no-cache' : 'public, max-age=600'
    }
  });
}

// /fileproxy → OSS 附件代理：原站后端签发的附件 URL 指向内网专用域名
// （static.upingbio.com 公网 DNS 不存在；OSS -internal endpoint 仅阿里云内网可达），
// 浏览器从公网打开必然 AccessDenied。OSS V1 签名只签 Bucket+Object+Expires，不含 host，
// 服务端把 host 换成公网 endpoint 后签名依然有效，由 CF Worker 服务端取文件流式回给浏览器。
const OSS_PUBLIC_HOST = 'upingbio.oss-cn-hangzhou.aliyuncs.com';
function ossPublicUrl(u) {
  return u
    .replace(/^https?:\/\/static\.upingbio\.com(?::\d+)?/i, 'https://' + OSS_PUBLIC_HOST)
    .replace(/^https?:\/\/upingbio\.oss-cn-hangzhou-internal\.aliyuncs\.com(?::\d+)?/i, 'https://' + OSS_PUBLIC_HOST)
    .replace(/^http:\/\/upingbio\.oss-cn-hangzhou\.aliyuncs\.com(?::\d+)?/i, 'https://' + OSS_PUBLIC_HOST);
}
// API JSON 里出现的内网附件 URL → /fileproxy?u=<encodeURIComponent(原URL)>（兼容 JSON 里 \/ 转义）
const OSS_URL_RE = /https?:(?:\\\/\\\/|\/\/)(?:static\.upingbio\.com|upingbio\.oss-cn-hang(?:zhou(-internal))?\.aliyuncs\.com)(?::\d+)?(?:\\\/|\/|[^"'\\\s<>)]|\\\.)+/gi;
function rewriteOssUrls(text) {
  return text.replace(OSS_URL_RE, function (m) {
    return '/fileproxy?u=' + encodeURIComponent(m.split('\\/').join('/'));
  });
}
async function proxyFile(request, url) {
  const raw = url.searchParams.get('u');
  if (!raw) return new Response('fileproxy: missing u', { status: 400 });
  let target;
  try { target = new URL(ossPublicUrl(raw)); } catch (e) { return new Response('fileproxy: bad u', { status: 400 }); }
  if (!/(^|\.)aliyuncs\.com$/i.test(target.hostname) || target.protocol !== 'https:') {
    return new Response('fileproxy: host not allowed', { status: 403 });
  }
  const hdr = new Headers();
  const range = request.headers.get('range');
  if (range) hdr.set('range', range);   // PDF 预览器会发 Range 请求，透传
  let resp;
  try { resp = await fetch(target.toString(), { method: 'GET', headers: hdr, redirect: 'follow' }); }
  catch (e) { return new Response('文件代理失败: ' + e.message, { status: 502 }); }
  const rh = new Headers();
  for (const h of ['content-type', 'content-length', 'content-disposition', 'accept-ranges', 'content-range', 'etag', 'last-modified']) {
    const v = resp.headers.get(h);
    if (v) rh.set(h, v);
  }
  if (!rh.has('content-type')) rh.set('content-type', 'application/octet-stream');
  rh.set('access-control-allow-origin', request.headers.get('origin') || '*');
  rh.set('cache-control', 'private, max-age=300');
  return new Response(resp.body, { status: resp.status, headers: rh });
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
  // JSON 响应里的附件 URL 若指向内网 OSS 域名，重写为 /fileproxy 代理地址
  const ct0 = rh.get('content-type') || '';
  if (/json/i.test(ct0)) {
    let text = await resp.text();
    if (text.indexOf('upingbio') !== -1) text = rewriteOssUrls(text);
    rh.delete('content-length');
    return new Response(text, { status: resp.status, headers: rh });
  }
  return new Response(resp.body, { status: resp.status, headers: rh });
}

// /vendor/* → GitHub Pages（pages/ 目录即站点根，故 URL 为 /oa-web/vendor/*）：服务端转发，浏览器无跨域、无额外 DNS
async function proxyVendor(request, url) {
  const target = VENDOR_ORIGIN + '/oa-web' + url.pathname + url.search;
  const hdr = new Headers(request.headers);
  hdr.delete('host');
  hdr.delete('origin');
  hdr.delete('referer');
  let resp;
  try {
    resp = await fetch(target, { method: 'GET', headers: hdr });
  } catch (e) {
    return new Response('vendor 代理失败: ' + e.message, { status: 502 });
  }
  const rh = new Headers(resp.headers);
  rh.set('Access-Control-Allow-Origin', '*');
  // 文档库内容稳定：长缓存（文件名不变即内容不变）
  rh.set('cache-control', 'public, max-age=86400');
  return new Response(resp.body, { status: resp.status, headers: rh });
}

async function handle(request) {
  const url = new URL(request.url);
  const p = decodeURIComponent(url.pathname);
  if (p === '/fileproxy') return proxyFile(request, url);   // 必须在 isApi 之前（/fileproxy 会被 ^/file 白名单误吃）
  if (p.startsWith('/vendor/')) return proxyVendor(request, url);
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
