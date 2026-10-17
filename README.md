# 优品OA 网页版（响应式）

用优品OA App 源码里的真实接口，做的一套**手机 / 电脑都能访问**的网页版 OA 客户端。
`oa.upingbio.cn` 是第三方 OA 服务（不是你的服务器），所以本方案通过**同域反代**绕过浏览器跨域限制，让你能正常登录并使用。

> 因为 OA 不是你的服务器，无法把文件放进 `oa.upingbio.cn` 同域，因此"跨域"只能靠一个你自己的中转层（Cloudflare Worker）解决。

## 功能
- 登录（算式验证码、记住密码、会话守卫）
- 首页（快捷审批、办公入口、待办、未读铃铛）
- 审批：列表 + 通过/拒绝 + **发起审批**（8 种类型动态表单、选审批人、附件）
- 客户：列表 / 详情 / 联系人（我的、公海、废弃）
- 子页：公告、问答、产品、附件、通讯录、消息、财务等
- 我的：基本资料、修改密码、退出

## 部署方式

### 方案 A：单一 Cloudflare Worker（推荐，最省事）
前端页面 + OA 接口全部收拢到你的 `*.workers.dev` 同域，浏览器不拦，手机电脑打开一个网址就能登录，**无需填任何代理**。

1. 登录 https://dash.cloudflare.com → **Workers & Pages → 创建 Worker**（Hello World 模板）
2. 把 `proxy/worker-all.js` 全部内容粘贴覆盖，点 **Deploy**
3. 得到 `https://<你的子域>.workers.dev` —— 直接打开就是登录页，登录后所有功能可用

> 自定义域名（可选）：在 Worker 设置里绑定你自己的子域（如 `oa.你的域名.com`），并在 Cloudflare DNS 加一条 CNAME 指向 Worker。

### 绑定自定义域名 `oa.jk93.qzz.io` ✅ 已上线

Worker 脚本 `oa-web` 已部署到 Cloudflare 账户 `jiankujidu`。

- **默认地址**：`https://oa-web.jiankujidu.workers.dev/`（手机/电脑打开即登录，无需任何代理）
- **自定义域名**：`https://oa.jk93.qzz.io/` —— 已绑定并验证可用（首页 200、验证码经反代返回 `image/png`）

> 绑定方式：Cloudflare **Worker 自定义域名（Custom Domain）** 接口，它会自动建好橙云 DNS 记录 + 签发证书，比手动加 Route 更干净。

**方式一 · 控制台点几下（无需给我任何凭据）**
1. 打开 https://dash.cloudflare.com → 进入 `oa-web` Worker → 左侧 **Settings → Domains & Routes → Add**
2. 选 **Custom Domain**，填 `oa.jk93.qzz.io` → 确认（自动加橙云 DNS + 证书）
3. 约 1 分钟生效，浏览器打开即登录（Worker 自动把前端 `OA_BASE` 设为同域，接口照常走通）

**方式二 · API 自动绑定（已实测成功 ✅）**
只要 Token 含 `Workers Scripts:Edit` + `Zone:Read`（含 R2 类令牌），即可调用**账户级自定义域名接口**完成绑定，无需 `DNS Edit` / `Workers Routes Edit` 权限：

```bash
# 把 oa-web 挂到自定义域名 oa.jk93.qzz.io（zone_id 用 jk93.qzz.io 的）
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/domains" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"zone_id":"'$ZONE_ID'","hostname":"oa.jk93.qzz.io","service":"oa-web","environment":"production"}'
# 返回 success:true 即绑定完成（自动建 DNS + 证书）
```

### 方案 B：GitHub Pages + 纯代理 Worker（备选）
前端托管在 GitHub Pages，API 经 `proxy/worker.js` 代理。

1. 把本仓库推到 GitHub，开启 **Settings → Pages → GitHub Actions**（已含 `.github/workflows/deploy.yml`）
2. 另建一个 Worker，粘贴 `proxy/worker.js`，得到 `https://<代理子域>.workers.dev/?url=`
3. 打开 `https://<你的>.github.io/oa-web/login.html`，点开底部「代理设置」填入上面的代理地址并刷新

## 接口来源
所有接口路径、字段、验证码逻辑均 1:1 对齐 App 源码 `www/js/api.js` 与 `www/js/approve_meta.js`：
- 登录 `POST /home/login/login_submit`（username / password / captcha，无 token）
- 验证码 `GET /captcha.html?t=<时间戳>`（算式型）
- 审批 `GET /oa/approve/index`、`POST /oa/approve/check`、`POST /oa/approve/add`
- 客户 `GET /customer/index/index`、`/customer/index/view`
- 等 30+ 接口

## 说明
- 账号密码只经过你自己的 Worker，不过任何第三方。
- 仓库默认 public（含接口逻辑）；如需保密可在 GitHub 设为 private（Pages 仍可用）。
