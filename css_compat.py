#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSS 兼容层生成器：把 v2 style.css 中「v3 未覆盖的 class」收编到 v3 末尾。
- 仅搬移 app.js/doc.js 实际使用、且 v3 未定义的 class 所在规则块
- 与 v3 已定义 class 冲突的块跳过（避免覆盖 v3 设计）
- 收编块内的旧色值批量替换为 v3 设计令牌
"""
import re, sys

V2 = open('v2_style.css', encoding='utf-8').read()
V3 = open('public/style.css', encoding='utf-8').read()

# app.js/doc.js 实际使用的 class
used = set()
for f in ['public/app.js', 'public/doc.js']:
    code = open(f, encoding='utf-8').read()
    for m in re.finditer(r'class=[\"\x27]([^\"\x27]+)[\"\x27]', code):
        for c in m.group(1).split():
            if re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', c):
                used.add(c)
    for m in re.finditer(r'className\s*=\s*[\"\x27]([a-zA-Z][a-zA-Z0-9 _-]*)[\"\x27]', code):
        for c in m.group(1).split():
            used.add(c)

defined = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', V3))
missing = sorted(c for c in used if c not in defined)
print('缺失 class: %d 个' % len(missing))

# 旧色值 → v3 令牌
COLOR_MAP = [
    ('#165DFF', 'var(--c-primary)'), ('#0E4FD9', 'var(--c-primary-hover)'),
    ('#E8F0FF', 'var(--c-primary-light)'),
    ('#00B42A', 'var(--c-ok)'), ('#E8F7EC', 'var(--c-ok-light)'),
    ('#FF7D00', 'var(--c-warn)'), ('#FFF3E8', 'var(--c-warn-light)'),
    ('#F53F3F', 'var(--c-danger)'), ('#FFECE8', 'var(--c-danger-light)'),
    ('#722ED1', 'var(--c-info)'), ('#F5E8FF', 'var(--c-info-light)'),
    ('#F2F3F5', 'var(--bg-page)'), ('#E5E6EB', 'var(--bd)'),
    ('#C9CDD4', 'var(--bd-strong)'), ('#1D2129', 'var(--tx-1)'),
    ('#4E5969', 'var(--tx-2)'), ('#86909C', 'var(--tx-3)'),
    ('#F7F8FA', 'var(--bg-sub)'), ('#161B26', 'var(--bg-sidebar)'),
    ('#232A3A', 'var(--bg-sidebar-hover)'),
]
def modernize(block):
    for old, new in COLOR_MAP:
        block = block.replace(old, new)
    return block

# 按规则块切分 v2（保留注释头）
body = re.sub(r'/\*.*?\*/', '', V2, flags=re.S)  # 去注释便于切块
blocks = re.findall(r'([^{}]+)\{([^{}]*)\}', body)
adopted, skipped_conflict = [], []
for sel, decl in blocks:
    sel = sel.strip()
    if not sel or sel.startswith('@'):
        continue
    classes = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', sel))
    if not classes:
        continue
    hit = classes & set(missing)
    if not hit:
        continue
    conflict = classes & defined
    if conflict:
        skipped_conflict.append((sel, sorted(conflict)))
        continue
    adopted.append((sel, decl))

print('收编 %d 块，跳过冲突 %d 块' % (len(adopted), len(skipped_conflict)))
for s, c in skipped_conflict[:20]:
    print('  [跳过冲突] %s → %s' % (s[:60], c))

out = []
out.append('\n/* ============================================================\n'
           '   兼容层：深层页面组件（审批表单/销售协议/订单审单/分类树/\n'
           '   收藏夹/附件/自绘对话框等），v2 定义经 v3 设计令牌现代化\n'
           '   ============================================================ */\n')
seen = set()
for sel, decl in adopted:
    key = sel
    if key in seen:
        continue
    seen.add(key)
    decl2 = modernize(decl).strip()
    # 压缩多行空白
    decl2 = re.sub(r'\s*\n\s*', ' ', decl2)
    out.append('%s { %s }' % (re.sub(r'\s*\n\s*', ' ', sel), decl2))

with open('public/style.css', 'a', encoding='utf-8') as fh:
    fh.write('\n'.join(out) + '\n')
print('已追加 %d 条规则到 public/style.css' % len(seen))

# 复验
V3N = open('public/style.css', encoding='utf-8').read()
defined2 = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', V3N))
missing2 = sorted(c for c in used if c not in defined2)
print('复验缺失: %s' % (missing2 if missing2 else '无'))
