# -*- coding: utf-8 -*-
"""修 loadHomeTodos 里 openOrderDetail 调用的转义引号。"""
import io

py = io.open('port_appjs.py', encoding='utf-8').read()
bad = "'App.openOrderDetail(' + r.id + ','handle')'"
good = "'App.openOrderDetail(' + r.id + ',' + \"'handle'\" + ')'"
if py.count(bad) == 1:
    py = py.replace(bad, good)
    io.open('port_appjs.py', 'w', encoding='utf-8').write(py)
    print('fixed')
else:
    print('pattern count =', py.count(bad))
