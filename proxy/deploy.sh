#!/usr/bin/env bash
# 部署 worker-all.js 到 Cloudflare Worker（需 CF_API_TOKEN 环境变量，不落盘）
# 用法:  CF_API_TOKEN=xxxx bash deploy.sh
set -euo pipefail
TOKEN="${CF_API_TOKEN:-}"
[ -z "$TOKEN" ] && { echo "缺少 CF_API_TOKEN 环境变量"; echo "用法: CF_API_TOKEN=xxxx bash deploy.sh"; exit 1; }

SCRIPT="oa-web"
DIR="$(cd "$(dirname "$0")" && pwd)"
CODE="$DIR/worker-all.js"

echo ">>> 获取 account_id"
ACCT=$(curl -s --retry 3 --retry-delay 2 -H "Authorization: Bearer $TOKEN" "https://api.cloudflare.com/client/v4/accounts" || true)
ACCOUNT_ID=$(printf '%s' "$ACCT" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let j=JSON.parse(s);console.log((j.success&&j.result[0])?j.result[0].id:'')}catch(e){console.log('')}})")
if [ -z "$ACCOUNT_ID" ]; then echo "获取 account_id 失败，响应: ${ACCT:0:200}"; exit 1; fi
if [ -z "$ACCOUNT_ID" ]; then echo "获取 account_id 失败: $ACCT"; exit 1; fi
echo "account_id=$ACCOUNT_ID"

echo ">>> 上传 Worker 脚本: $SCRIPT"
RESP=$(curl -s --retry 3 --retry-delay 2 -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$SCRIPT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary "@$CODE" || true)
echo "$RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let j=JSON.parse(s);console.log(j.success?'上传成功 ✓':'上传失败: '+(j.errors&&j.errors[0]&&j.errors[0].message))}catch(e){console.log('响应解析失败: '+s)}})"

echo ">>> 查看 workers.dev 子域状态"
SET=$(curl -s --retry 3 --retry-delay 2 -H "Authorization: Bearer $TOKEN" "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/domains/settings" || true)
echo "$SET" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let j=JSON.parse(s);let r=j.result||{};console.log('子域:', r.subdomain? r.subdomain+'.workers.dev':'未分配', '| 状态:', r.status||'?')}catch(e){console.log('解析失败')}})"

echo ""
echo "部署完成。访问: https://$SCRIPT.workers.dev"
echo "若提示子域未启用，请到 dash.cloudflare.com → Workers → 右上角「启用 workers.dev 子域」点一下即可。"
