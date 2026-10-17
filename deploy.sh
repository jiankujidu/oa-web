#!/usr/bin/env bash
# 构建并把"自带前端资源"的 Worker 部署到 Cloudflare（需 CF_API_TOKEN 环境变量，不落盘）
# 同时会重新构建 dist/worker.js（前端资源内联，不再依赖 GitHub Pages，更快）。
# 用法:  CF_API_TOKEN=xxxx bash deploy.sh
set -euo pipefail
TOKEN="${CF_API_TOKEN:-}"
[ -z "$TOKEN" ] && { echo "缺少 CF_API_TOKEN 环境变量"; echo "用法: CF_API_TOKEN=xxxx bash deploy.sh"; exit 1; }

DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="oa-web"

echo ">>> 构建 dist/worker.js（前端资源内联）"
( cd "$DIR" && python3 build_worker.py ) || { echo "构建失败"; exit 1; }
CODE="$DIR/dist/worker.js"

echo ">>> 获取 account_id"
ACCT=$(curl -s --retry 3 --retry-delay 2 -H "Authorization: Bearer $TOKEN" "https://api.cloudflare.com/client/v4/accounts" || true)
ACCOUNT_ID=$(printf '%s' "$ACCT" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let j=JSON.parse(s);console.log((j.success&&j.result[0])?j.result[0].id:'')}catch(e){console.log('')}})")
[ -z "$ACCOUNT_ID" ] && { echo "获取 account_id 失败，响应: ${ACCT:0:200}"; exit 1; }
echo "account_id=$ACCOUNT_ID"

echo ">>> 上传 Worker 脚本: $SCRIPT"
RESP=$(curl -s --retry 3 --retry-delay 2 -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$SCRIPT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary "@$CODE" || true)
echo "$RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let j=JSON.parse(s);console.log(j.success?'上传成功 ✓':'上传失败: '+(j.errors&&j.errors[0]&&j.errors[0].message))}catch(e){console.log('响应解析失败: '+s)}})"

echo ""
echo "部署完成。访问: https://$SCRIPT.workers.dev  （自定义域名 oa.jk93.qzz.io 已绑定）"
echo "若提示子域未启用，请到 dash.cloudflare.com → Workers → 右上角「启用 workers.dev 子域」点一下即可。"
