# -*- coding: utf-8 -*-
"""把 port_appjs.py 的 V3_HOME 块替换为 v5 双版本首页（桌面仪表盘 / 手机原生）。"""
import io, re

py = io.open('port_appjs.py', encoding='utf-8').read()

start = py.index("# ===== v3 首页仪表盘")
end = py.index("\n'''", start) + len("\n'''")

NEW = open('v5_home.txt', encoding='utf-8').read() if False else None

# 新块直接从下方 V5_HOME 常量文件读
V5 = io.open('v5_home_block.py', encoding='utf-8').read()

py = py[:start] + V5.rstrip('\n') + py[end:]
io.open('port_appjs.py', 'w', encoding='utf-8').write(py)
print('V3_HOME -> V5_HOME 替换完成')
