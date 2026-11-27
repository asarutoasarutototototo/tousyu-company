#!/usr/bin/env python3
"""Assemble the single-file artifact (page body only) and a local test page (with skeleton)."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda f: open(os.path.join(here, f), encoding='utf-8').read()

JS = ['img_data.js', 'img_mina.js', 'data.js', 'data_ext.js', 'engine.js', 'gfx_char.js', 'gfx_img.js', 'gfx_enemy.js', 'gfx_bg.js', 'gfx_motion.js', 'gfx_imgmot.js', 'gfx_battle.js', 'gfx_btl_draw.js', 'sfx.js',
      'state.js', 'ui_battle.js', 'ui_screens.js', 'ui_extra.js', 'ui_tower.js', 'ui_more.js', 'ui_more2.js', 'ui_fx.js', 'main.js']
css = rd('style.css')
js = '\n'.join(rd(f).replace("'use strict';", '', 1) if i else rd(f) for i, f in enumerate(JS))
js = "'use strict';\n" + js.replace("'use strict';", '')

body = '''<div id="app">
<canvas id="bgc" aria-hidden="true"></canvas>
<div class="veil"></div>
<div id="topbar" hidden></div>
<div id="scr" class="scr"></div>
<div id="bwrap" hidden></div>
<div id="modal" hidden></div>
<div id="dialog" hidden></div>
<div id="toast" aria-live="polite"></div>
</div>
<noscript>このゲームにはJavaScriptが必要です。</noscript>'''

head = '''<title>灯守カンパニー</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="灯守を率いて夜の街を明かす、コイン勝負のターン制バトルRPG">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Oswald:wght@400;600&family=Zen+Kaku+Gothic+New:wght@400;700;900&display=swap">
'''
page = head + '<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + js + '\n</script>\n'
out = os.path.join(here, 'lampwarden.html')
open(out, 'w', encoding='utf-8').write(page)

# local test page with a stand-in skeleton (what the Artifact tool adds at publish)
skel = '''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>''' + page.replace('<title>灯守カンパニー</title>', '<title>灯守カンパニー</title>') + '</body></html>'
open(os.path.join(here, 'test_full.html'), 'w', encoding='utf-8').write(skel)
print('size', len(page.encode('utf-8')) // 1024, 'KB')
