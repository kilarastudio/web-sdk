#!/usr/bin/env python3
"""Screenshots of every menu at several screen sizes.

  menus.py OUTDIR --base https://HOST:PORT --game GAME_ID [--only NAME] [--sizes a,b]

Opens a session of the game at each size (phone, small phone, phone on its side, the Stake mini
player, desktop, tablet), opens each menu through the HUD's own buttons, and saves a screenshot
as OUTDIR/<size>-<menu>.png. The game must be served with the dev RGS proxy (same host for the
game and /api/rgs).
"""
import argparse, sys
from playwright.sync_api import sync_playwright

from browser import launch

p = argparse.ArgumentParser(); p.add_argument('out'); p.add_argument('--base', required=True); p.add_argument('--game', required=True); p.add_argument('--only'); p.add_argument('--sizes')
a = p.parse_args()
SIZES = {'phone': (412, 915, 'mobile'), 'small': (360, 640, 'mobile'), 'land': (844, 390, 'mobile'), 'mini': (400, 225, 'desktop'),
         'desktop': (1200, 675, 'desktop'), 'tablet': (820, 1180, 'mobile')}
MENUS = {'paytable': ['MENU', 'PAYTABLE'], 'info': ['MENU', 'INFO'], 'settings': ['MENU', 'SETTINGS'],
         'auto': ['AUTO SPIN'], 'bonus': ['BUY BONUS'], 'confirm': ['BUY BONUS', '@BUY']}
with sync_playwright() as pw:
    b = launch(pw)
    for name, (w, h, device) in SIZES.items():
        if a.sizes and name not in a.sizes.split(','): continue
        c = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, ignore_https_errors=True)
        page = c.new_page(); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)[:200]))
        host = a.base.split('://', 1)[-1]
        page.goto(f'{a.base}/?sessionID=menus-{name}&rgs_url={host}/api/rgs/{a.game}&lang=en&currency=USD&device={device}')
        page.wait_for_timeout(8000); page.mouse.click(w / 2, h * 0.75); page.wait_for_timeout(3500)
        for menu, path in MENUS.items():
            if a.only and menu != a.only: continue
            try:
                for label in path:
                    if label.startswith('@'):
                        page.locator('.bonus-scene .card').nth(2).click(timeout=4000)
                    else:
                        page.get_by_role('button', name=label, exact=True).first.click(timeout=4000)
                    page.wait_for_timeout(800)
                page.screenshot(path=f'{a.out}/{name}-{menu}.png')
            except Exception as e:
                print(name, menu, 'FAILED', str(e)[:160], file=sys.stderr)
            for _ in range(3):
                page.keyboard.press('Escape'); page.wait_for_timeout(250)
            # the HUD's own menu stays open behind a menu it opened: close it too
            backdrop = page.locator('.ui-menu-backdrop')
            if backdrop.count():
                backdrop.first.click(position={'x': w - 5, 'y': 5}); page.wait_for_timeout(300)
        for e in errors[:5]: print(name, 'ERR', e, file=sys.stderr)
        c.close()
    b.close()
