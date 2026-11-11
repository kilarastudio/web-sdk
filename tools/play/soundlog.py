#!/usr/bin/env python3
"""Which sounds a stretch of play starts, and when: soundlog.py URL [--size] [--start X,Y] [--text PLAY | --press Space] [--record MS]

Wraps the Web Audio source start that Howler uses, and names each start by its offset in the
game's audio sprite (--sprite).
"""
import argparse, json
from playwright.sync_api import sync_playwright

from browser import launch

p = argparse.ArgumentParser()
p.add_argument('url'); p.add_argument('--sprite', required=True, help="the game's audio sprite JSON, e.g. apps/<game>/static/assets/audio/sounds.json"); p.add_argument('--size', default='412x915'); p.add_argument('--start', default='206,700')
p.add_argument('--text'); p.add_argument('--press'); p.add_argument('--record', type=int, default=8000)
p.add_argument('--spam', type=int, help='press --press again every this many ms'); p.add_argument('--skip-music', action='store_true')
a = p.parse_args()
sprite = json.load(open(a.sprite))['sprite']
HOOK = """
window.__sounds = [];
const start = AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start = function (when, offset, duration) {
  window.__sounds.push([Math.round(performance.now()), Math.round((offset || 0) * 1000)]);
  return start.apply(this, arguments);
};
"""
w, h = (int(v) for v in a.size.split('x'))
with sync_playwright() as pw:
    b = launch(pw)
    c = b.new_context(viewport={'width': w, 'height': h}, ignore_https_errors=True)
    c.add_init_script(HOOK)
    page = c.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)[:200]))
    page.on('console', lambda m: errors.append(m.text[:200]) if m.type in ('error', 'warning') else None)
    page.goto(a.url); page.wait_for_timeout(8000)
    x, y = (float(v) for v in a.start.split(','))
    page.mouse.click(x, y); page.wait_for_timeout(4000)
    t0 = page.evaluate('performance.now()')
    if a.text: page.get_by_text(a.text, exact=True).first.click()
    elif a.press: page.keyboard.press(a.press)
    if a.spam:
        waited = 0
        while waited < a.record:
            page.wait_for_timeout(a.spam); waited += a.spam
            page.keyboard.press(a.press)
    else:
        page.wait_for_timeout(a.record)
    for t, off in page.evaluate('window.__sounds'):
        if t < t0 - 50: continue
        name = min(sprite, key=lambda n: abs(sprite[n][0] - off) if off >= sprite[n][0] - 5 and off <= sprite[n][0] + sprite[n][1] else 1e12)
        if a.skip_music and name.startswith('bgm'): continue
        print(f'{t - t0:7.0f} ms  {name}')
    for e in errors[:10]: print('LOG', e)
    b.close()
