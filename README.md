# 优品OA 网页版（电脑版布局 · 功能与 App 1:1）

用优品OA App 源码里的真实接口，做的一套**电脑版布局**的网页版 OA 客户端。
功能与 App 源码（`www/js/app.js` 5316 行）逐模块 1:1 对齐：审批全流程、客户管理、订单审单、平台订单、样本/校展/售后、财务 9 页、消息收发、产品分类收藏夹、附件上传、销售协议 Word 预览等。
`oa.upingbio.cn` 是第三方 OA 服务（不是你的服务器），因此通过**同域反代**（Cloudflare Worker）绕过浏览器跨域限制，登录态（Cookie）可用。

## 功能清单（对齐 App）

- **登录**：算式验证码、记住密码、会话守卫、启动看门狗、失败原因诊断
- **首页**：快捷审批 8 类、办公入口全量（公告/问答/AI/产品/附件/消息/通讯录/工作台/财务/客户业务）、待办
- **审批**：列表（状态筛选）/ 详情（流程节点+审批记录）/ 通过·拒绝·撤回 / 发起审批（8 类动态表单、审批人选择、附件上传）
- **客户**：列表（我的/公海/废弃）/ 详情三 Tab（联系人·商机·跟进）/ 新增客户（含子公司动态行）/ 编辑 / 转公海 / 转移（共享员工选择）
- **订单**：我的订单 / 订单处理（审单全链路：信息修改保存、通过/拒绝/撤回、省市区联动、下一审批人、销售协议 Word 预览/转 PDF、附件打开转发、删除）/ 平台订单（标记）
- **其他业务**：样本、校展（增删）、售后（增删）、产品（分类树多选+筛选+说明书收藏夹：文件夹/预览/打包下载）
- **财务 9 页**：预存款、抵扣券（我申请的/管理专用）、保证金、发票（我申请的/我处理的）、到账（发票/订单）、订单到账处理
- **消息**：收件箱/发件箱/草稿箱/回收站、详情、写消息（收件人多选）、回复、删除、10s 轮询铃铛角标
- **办公**：通讯录、基本资料、修改密码、企业公告、问答知识、工作台（待我审批+最新公告）、AI 问答（外链）
- **销售协议**：服务端实时生成 Word → docx-preview 高保真渲染 / 适应屏宽切换 / 下载 Word / 转 PDF 保存

## 电脑版布局

- **左侧分组导航**：主菜单（首页/审批/客户/我的）+ 办公 + 财务 + 客户与业务，共 30+ 模块直达，当前项高亮联动
- **白底顶栏**：页面标题 + 返回按钮 + 消息铃铛角标 + 退出
- **通栏内容区**：居中 1180px 列宽、宫格 8 列悬浮卡片、表单面板化、列表卡片全宽、弹层居中对话框
- 窄屏（<992px）自动回退手机布局（底部 Tab）

## 源码布局

```
public/                前端（构建时全部内联进 Worker）
  index.html           电脑版主界面壳（侧栏/顶栏/内容容器）
  login.html           登录页（独立页，登录态守卫）
  app.js               主逻辑（由 App 源码 1:1 移植，仅外壳适配）
  doc.js               销售协议 Word 处理（fetch 替代原生桥）
  style.css            样式（App 组件类 + 桌面布局）
  lib/oa.js            API 共享层（~80 个接口，方法名与 App api.js 一致）
  lib/approve_meta.js  审批表单元数据
pages/vendor/          大体积文档库（jszip/docx-preview/mammoth/html2canvas/jspdf），
                       由 GitHub Pages 托管，Worker 对 /vendor/* 服务端代理
port_appjs.py          移植脚本：App app.js → public/app.js（13 个外壳补丁）
stub_test.js           Node DOM 桩验证（导出完整性 + 34 个导航入口实跑 + App.* 引用校验）
worker_test.js         Worker 本地测试（gzip 解压 + 路由 + 反代 + vendor 代理）
build_worker.py        构建：public/ gzip 内联 → dist/worker.js（146KB，CF 免费版 1MB 内）
dist/worker.js         构建产物（自动生成，勿手改）
```

## 构建与部署

推 `main` 即触发 GitHub Actions（`.github/workflows/deploy.yml`）：构建 Worker → PUT 部署到 Cloudflare（account `36dc817a796a8f194ad1631a646d6762`，script `oa-web`）；同时把 `pages/` 部署到 GitHub Pages（承载 `/vendor/*` 文档库 + 旧链接跳转）。

本地：

```bash
python build_worker.py                 # 生成 dist/worker.js
node stub_test.js && node worker_test.js   # 双重验证
CF_API_TOKEN=xxxx bash deploy.sh       # 或手动部署
```

- **线上地址**：https://oa.jk93.qzz.io/ （自定义域名，CF 边缘直接返回前端）

## 体积控制（CF 免费版 1MB 脚本上限）

1. HTML 内联 `<script src>/<link>` 后，被内联的源文件不再单独存入 ASSETS（消除双份，1299KB → 662KB）
2. 全部资产 gzip 后 base64 存储，Worker 端 `DecompressionStream` 解压（每隔离解压一次并缓存）→ 146KB
3. 文档库 ~1.4MB 不入 Worker：`/vendor/*` 由 Worker 代理到 `jiankujidu.github.io/oa-web/pages/vendor/*`，前端 `ensureLib` 失败再回退 jsdelivr CDN

## 接口来源

所有接口路径、字段、验证码逻辑均 1:1 对齐 App 源码 `www/js/api.js`（~80 个接口）与 `www/js/approve_meta.js`：
- 登录 `POST /home/login/login_submit`；验证码 `GET /captcha.html`
- 审批 `/oa/approve/*`；客户 `/customer/index/*|api/*`；订单 `/customer/order/*` + `flow_check(type=5)`
- 平台订单 `/customer/platformorder/*`；校展 `/customer/schoolexhibition/*`；售后 `/customer/aftersalesservice/*`
- 财务 `/finance/*`（9 类）；消息 `/message/index/*`；上传 `POST /api/index/upload`

## 说明

- 账号密码只经过你自己的 Worker，不过任何第三方。
- 网页版无原生桥：文件选择走 `<input type=file>`、分享/打包走浏览器下载、PDF 说明书走新标签页。
