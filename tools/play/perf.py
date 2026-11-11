#!/usr/bin/env python3
"""Frame pacing and main-thread cost of a stretch of play, in a headless phone-sized browser.

  uv run --no-project --with playwright python perf.py URL [--size 412x915] [--throttle 4]
      [--start X,Y] [--text PLAY | --press Space] [--record MS] [--shots OUT --every MS]

Opens URL, clicks --start (the welcome screen), then starts play by clicking the button with
--text or pressing --press, and records every animation frame for --record ms: the gaps between
frames, and the time the main thread spent in script and in tasks (CDP Performance metrics).
--throttle slows the CPU by that factor, to stand in for a phone.
"""
import argparse
import json

from playwright.sync_api import sync_playwright

from browser import launch

parser = argparse.ArgumentParser()
parser.add_argument('url')
parser.add_argument('--size', default='412x915')
parser.add_argument('--throttle', type=float, default=4)
parser.add_argument('--start', default='206,700')
parser.add_argument('--text')
parser.add_argument('--press')
parser.add_argument('--record', type=int, default=5000)
parser.add_argument('--shots')
parser.add_argument('--every', type=int, default=50)
parser.add_argument('--clip', help='x,y,w,h in CSS px: capture only this part (faster)')
parser.add_argument('--dpr', type=float, default=2)
args = parser.parse_args()

RECORD = """
() => {
  window.__frames = [];
  let last = performance.now();
  const tick = (now) => { window.__frames.push(now - last); last = now; window.__raf = requestAnimationFrame(tick); };
  window.__raf = requestAnimationFrame(tick);
}
"""

width, height = (int(v) for v in args.size.split('x'))
with sync_playwright() as p:
    browser = launch(p)
    context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=args.dpr, ignore_https_errors=True)
    page = context.new_page()
    cdp = context.new_cdp_session(page)
    cdp.send('Performance.enable')
    page.goto(args.url)
    page.wait_for_timeout(8000)
    x, y = (float(v) for v in args.start.split(','))
    page.mouse.click(x, y)
    page.wait_for_timeout(4000)
    cdp.send('Emulation.setCPUThrottlingRate', {'rate': args.throttle})
    page.wait_for_timeout(500)

    def metrics():
        return {m['name']: m['value'] for m in cdp.send('Performance.getMetrics')['metrics']}

    before = metrics()
    page.evaluate(RECORD)
    if args.text:
        page.get_by_text(args.text, exact=True).first.click()
    elif args.press:
        page.keyboard.press(args.press)
    clip = None
    if args.clip:
        cx, cy, cw, ch = (float(v) for v in args.clip.split(','))
        clip = {'x': cx, 'y': cy, 'width': cw, 'height': ch}
    if args.shots:
        for index in range(args.record // args.every):
            page.screenshot(path=f'{args.shots}-{index:03d}.png', clip=clip)
            page.wait_for_timeout(args.every)
    else:
        page.wait_for_timeout(args.record)
    frames = page.evaluate('() => { cancelAnimationFrame(window.__raf); return window.__frames; }')[1:]
    after = metrics()
    frames.sort()
    count = len(frames)
    print(json.dumps({
        'frames': count,
        'fps': round(count / (sum(frames) / 1000), 1),
        'median_ms': round(frames[count // 2], 1),
        'p95_ms': round(frames[int(count * 0.95)], 1),
        'p99_ms': round(frames[int(count * 0.99)], 1),
        'max_ms': round(frames[-1], 1),
        'over_25ms': sum(1 for f in frames if f > 25),
        'over_50ms': sum(1 for f in frames if f > 50),
        'script_s': round(after['ScriptDuration'] - before['ScriptDuration'], 2),
        'task_s': round(after['TaskDuration'] - before['TaskDuration'], 2),
        'layout_s': round(after['LayoutDuration'] - before['LayoutDuration'], 2),
        'style_s': round(after['RecalcStyleDuration'] - before['RecalcStyleDuration'], 2),
    }))
    browser.close()
