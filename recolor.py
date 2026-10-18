# -*- coding: utf-8 -*-
"""v4 换血：桌面设计系统配色对齐 App 真实体系（#1E6FFF + Arco 中性色阶 + 白底导航）。
处理 style.css（值映射 + 侧栏浅色化 + 启动屏渐变）与 port_appjs.py（应用宫格色）。"""
import io, re, sys

# ---------- 第一趟：值级映射（大写风格） ----------
VALUE_MAP = [
    # 品牌色
    ('#2456E6', '#1E6FFF'), ('#2456e6', '#1e6fff'),
    ('#1B47C4', '#0B57D5'), ('#163A9F', '#0A4AB5'),
    ('#3B6BF5', '#4A9BFF'), ('#3b6bf5', '#4a9bff'),
    ('rgba(36, 86, 230, .12)', 'rgba(30, 111, 255, .12)'),
    ('rgba(36, 86, 230, .45)', 'rgba(30, 111, 255, .25)'),
    ('rgba(36, 86, 230, .18)', 'rgba(30, 111, 255, .18)'),
    ('rgba(22, 93, 255, .1)', 'rgba(30, 111, 255, .1)'),
    # 中性色 → Arco 色阶
    ('#0F172A', '#1F2329'), ('#0f172a', '#1f2329'),
    ('#1E293B', '#333333'), ('#1e293b', '#333333'),
    ('#475569', '#4E5969'), ('#475569'.lower(), '#4e5969'),
    ('#64748B', '#8A919F'), ('#64748b', '#8a919f'),
    ('#94A3B8', '#A9AEB8'), ('#94a3b8', '#a9aeb8'),
    ('#8494AB', '#8A8F99'), ('#8494ab', '#8a8f99'),
    ('#93A4C0', '#8A919F'), ('#93a4c0', '#8a919f'),
    # 面与线
    ('#E2E8F0', '#E8ECF2'), ('#e2e8f0', '#e8ecf2'),
    ('#CBD5E1', '#C9CDD4'), ('#cbd5e1', '#c9cdd4'),
    ('#F1F5F9', '#F5F6F8'), ('#f1f5f9', '#f5f6f8'),
    ('#F8FAFC', '#F7F8FA'), ('#f8fafc', '#f7f8fa'),
    # 状态色
    ('#059669', '#52C41A'), ('#047857', '#3B8F0E'),
    ('#ECFDF5', '#EDF9E6'), ('#A7F3D0', '#C3E6B0'),
    ('#B45309', '#E6A23C'), ('#FFFBEB', '#FDF6EC'), ('#FDE68A', '#F5DAB1'),
    ('#DC2626', '#F53F3F'), ('#FEF2F2', '#FFF1F0'), ('#FECACA', '#FFCCC7'),
    ('#7C3AED', '#722ED1'), ('#F5F3FF', '#F9F0FF'), ('#DDD6FE', '#EFDBFF'),
    # 主色浅底系
    ('#EBF1FE', '#EEF4FF'), ('#C7D7F8', '#DBE6FF'), ('#C9D8F8', '#DBE6FF'),
    ('#BFDBFE', '#DBE6FF'), ('#EFF6FF', '#EEF4FF'),
    # 侧栏深色系 → 浅色（先映射，再由结构修复处理引用）
    ('#0B1220', '#FFFFFF'), ('#0b1220', '#ffffff'),
    ('#16203A', '#F2F3F5'), ('#1B3A8F', '#EEF4FF'), ('#1A2540', '#E8ECF2'),
    ('#26345A', '#E8ECF2'),
    # 遮罩与阴影
    ('rgba(15, 23, 42, .45)', 'rgba(0, 0, 0, .45)'),
    ('rgba(15, 18, 25, .45)', 'rgba(0, 0, 0, .45)'),
    ('rgba(15, 23, 42, .16)', 'rgba(31, 35, 41, .16)'),
    ('rgba(15, 23, 42, .07)', 'rgba(31, 35, 41, .07)'),
    ('rgba(15, 23, 42, .05)', 'rgba(31, 35, 41, .05)'),
    ('rgba(15, 23, 42, .04)', 'rgba(31, 35, 41, .04)'),
    ('rgba(20,24,31,.88)', 'rgba(31,35,41,.88)'),
    ('rgba(29,33,41,.1)', 'rgba(31,35,41,.1)'),
]

# ---------- port_appjs.py 的映射（应用宫格/统计卡/hreo 字段色） ----------
PORT_MAP_EXTRA = [
    ('#165DFF', '#1E6FFF'), ('#00B42A', '#52C41A'), ('#FF7D00', '#E6A23C'),
    ('#E8F0FF', '#EEF4FF'), ('#E8F7EC', '#EDF9E6'), ('#FFF3E8', '#FDF6EC'),
    ('#F5E8FF', '#F9F0FF'), ('#FFECE8', '#FFF1F0'),
    ('#EBF1FE', '#EEF4FF'), ('#2456E6', '#1E6FFF'),
    ('#1D4ED8', '#1E6FFF'), ('#C2410C', '#D9480F'),
    ('#475569', '#4E5969'), ('#4F46E5', '#1E6FFF'), ('#0284C7', '#1E6FFF'),
    ('#A21CAF', '#722ED1'), ('#E11D48', '#F53F3F'), ('#16A34A', '#52C41A'),
    ('#F1F5F9', '#F7F8FA'), ('#EEF2FF', '#EEF4FF'), ('#F0F9FF', '#EEF4FF'),
    ('#F0FDF4', '#EDF9E6'), ('#FFF1F2', '#FFF1F0'), ('#FDF4FF', '#F9F0FF'),
    ('#FFFBEB', '#FDF6EC'), ('#ECFDF5', '#EDF9E6'), ('#FFF7ED', '#FDF6EC'),
    ('#F8FAFC', '#F7F8FA'),
]

# ---------- 第二趟：侧栏浅色化（选择器级结构修复） ----------
STRUCT_MAP = [
    # 侧栏容器：白底 + App 边框
    ('.sidebar {\n  width: var(--sb-w); flex: none; display: flex; flex-direction: column;\n  background: var(--bg-sidebar); color: var(--tx-on-dark);\n  border-right: 1px solid rgba(255, 255, 255, .04);\n}',
     '.sidebar {\n  width: var(--sb-w); flex: none; display: flex; flex-direction: column;\n  background: var(--bg-sidebar); color: var(--tx-1);\n  border-right: 1px solid var(--bd);\n}'),
    # 侧栏弱文字（组标题/副标题）
    ('.sb-name small { display: block; font-size: 10px; font-weight: 400; color: var(--tx-on-dark-2); letter-spacing: 1.5px; margin-top: -2px; }',
     '.sb-name small { display: block; font-size: 10px; font-weight: 400; color: var(--tx-3); letter-spacing: 1.5px; margin-top: -2px; }'),
    ('.sb-group {\n  display: flex; align-items: center; gap: 8px;\n  padding: 16px 10px 6px; font-size: 11px; font-weight: 500;\n  color: var(--tx-on-dark-2); letter-spacing: 1.5px; user-select: none;\n}',
     '.sb-group {\n  display: flex; align-items: center; gap: 8px;\n  padding: 16px 10px 6px; font-size: 11px; font-weight: 500;\n  color: var(--tx-3); letter-spacing: 1.5px; user-select: none;\n}'),
    ('.sb-group::after { content: \'\'; flex: 1; height: 1px; background: var(--bd-sidebar); }',
     '.sb-group::after { content: \'\'; flex: 1; height: 1px; background: var(--bd); }'),
    # 菜单项
    ('  font-size: 13.5px; color: var(--tx-on-dark); cursor: pointer;\n  transition: background .15s, color .15s;\n}',
     '  font-size: 13.5px; color: var(--tx-1); cursor: pointer;\n  transition: background .15s, color .15s;\n}'),
    ('.sb-item.active { background: var(--bg-sidebar-active); color: #fff; font-weight: 500; }',
     '.sb-item.active { background: var(--bg-sidebar-active); color: var(--c-primary); font-weight: 600; }'),
    ('.sb-item.active::before {\n  content: \'\'; position: absolute; left: -10px; top: 8px; bottom: 8px; width: 3px;\n  border-radius: 0 2px 2px 0; background: #5B8DEF;\n}',
     '.sb-item.active::before {\n  content: \'\'; position: absolute; left: -10px; top: 8px; bottom: 8px; width: 3px;\n  border-radius: 0 2px 2px 0; background: var(--c-primary);\n}'),
    ('.sb-item.active .sbi-icon, .sb-item:hover .sbi-icon { color: #C9D8F8; }\n.sb-item.active .sbi-icon { color: #fff; }',
     '.sb-item.active .sbi-icon, .sb-item:hover .sbi-icon { color: var(--c-primary); }'),
    # logo 阴影（App 同款 .25）
    ('  box-shadow: 0 2px 8px rgba(30, 111, 255, .25), inset 0 1px 0 rgba(255, 255, 255, .25);',
     '  box-shadow: 0 2px 8px rgba(30, 111, 255, .25), inset 0 1px 0 rgba(255, 255, 255, .25);'),
    # 用户卡
    ('.sb-user-name { font-size: 13px; color: var(--tx-on-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
     '.sb-user-name { font-size: 13px; color: var(--tx-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'),
    ('.sb-user-sub { font-size: 11px; color: var(--tx-on-dark-2); }',
     '.sb-user-sub { font-size: 11px; color: var(--tx-3); }'),
    ('.sb-foot { flex: none; border-top: 1px solid var(--bd-sidebar); padding: 8px 10px; }',
     '.sb-foot { flex: none; border-top: 1px solid var(--bd); padding: 8px 10px; }'),
    # 头像渐变 → App 主渐变（与 mine-head 同语言）
    ('  background: linear-gradient(135deg, #4A9BFF, #722ED1); color: #fff;',
     '  background: linear-gradient(135deg, #1E6FFF, #4A9BFF); color: #fff;'),
    # 启动屏 → App 登录页渐变（品牌第一眼）
    ('#boot-splash {\n  position: fixed; inset: 0; z-index: 9999;\n  display: flex; flex-direction: column; align-items: center; justify-content: center;\n  background: #FFFFFF; color: #fff;\n}',
     '#boot-splash {\n  position: fixed; inset: 0; z-index: 9999;\n  display: flex; flex-direction: column; align-items: center; justify-content: center;\n  background: linear-gradient(160deg, #1E6FFF 0%, #4A9BFF 55%, #EAF2FF 100%); color: #fff;\n}'),
    ('.boot-tip { margin-top: 16px; font-size: 12.5px; color: var(--tx-on-dark-2); letter-spacing: 1px; }',
     '.boot-tip { margin-top: 16px; font-size: 12.5px; color: rgba(255, 255, 255, .85); letter-spacing: 1px; }'),
    ('.boot-logo::after {\n  content: \'\'; display: block; width: 28px; height: 3px; border-radius: 2px;\n  background: var(--c-primary); margin: 14px auto 0;\n}',
     '.boot-logo::after {\n  content: \'\'; display: block; width: 28px; height: 3px; border-radius: 2px;\n  background: rgba(255, 255, 255, .9); margin: 14px auto 0;\n}'),
    # ::root 注释更新 + tx-on-dark 语义改为仅深色场景
    ('  --tx-on-dark: #E8ECF2;\n  --tx-on-dark-2: #8A8F99;',
     '  --tx-on-dark: #FFFFFF;\n  --tx-on-dark-2: rgba(255, 255, 255, .78);'),
]

def apply(text, pairs, fname):
    for old, new in pairs:
        n = text.count(old)
        if n:
            text = text.replace(old, new)
            print('  [%s] %s -> %s (%d 处)' % (fname, old[:44], new[:44], n))
    return text

# ---- style.css ----
css = io.open('public/style.css', encoding='utf-8').read()
css = apply(css, VALUE_MAP, 'css-val')
css = apply(css, STRUCT_MAP, 'css-struct')
# 头部注释
css = css.replace('优品OA 网页版 · 桌面设计系统 v3', '优品OA 网页版 · 桌面设计系统 v4')
css = css.replace('对标 oa.upingbio.com（layui 后台）并超越：\n   - 石板灰中性色阶 + 靛蓝主色，替代 layui 的纯灰+亮蓝',
                  '配色与手机 App 1:1 对齐（主色 #1E6FFF + Arco 中性色阶 + 白底浅色导航），\n   桌面架构对标主流企业系统并超越：')
css = css.replace('布局：深色侧栏(240px) + 白顶栏(52px) + 浅灰内容区(1440px 居中)',
                  '布局：浅色侧栏(232px) + 白顶栏(52px) + 浅灰内容区(1440px 居中)')
io.open('public/style.css', 'w', encoding='utf-8').write(css)
print('style.css 完成')

# ---- port_appjs.py ----
py = io.open('port_appjs.py', encoding='utf-8').read()
py = apply(py, VALUE_MAP, 'py-val')
py = apply(py, PORT_MAP_EXTRA, 'py-extra')
# 侧栏 logo 渐变在 index.html？已确认 index.html 无硬编码色
io.open('port_appjs.py', 'w', encoding='utf-8').write(py)
print('port_appjs.py 完成')
