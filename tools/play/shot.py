#!/usr/bin/env python3
"""Headless screenshots of a page, for checking the game and its Storybook stories.

  uv run --no-project --with playwright python shot.py URL OUT.png [--size 1200x675]
      [--wait MS] [--frames N --every MS] [--click X,Y]... [--press KEY]... [--reduced] [--errors]

--frames writes OUT-0.png, OUT-1.png ... taken every --every ms after --wait.
--click and --press run after --wait, in order, each followed by a short pause.
"""
import argparse
import sys

from playwright.sync_api import sync_playwright

from browser import launch

parser = argparse.ArgumentParser()
parser.add_argument('url')
parser.add_argument('out')
parser.add_argument('--size', default='1200x675')
parser.add_argument('--wait', type=int, default=3000)
parser.add_argument('--frames', type=int, default=1)
parser.add_argument('--every', type=int, default=100)
parser.add_argument('--click', action='append', default=[])
parser.add_argument('--press', action='append', default=[])
parser.add_argument('--after', type=int, default=300)
parser.add_argument('--reduced', action='store_true')
parser.add_argument('--errors', action='store_true')
parser.add_argument('--until', help='keep going until the page shows this text')
parser.add_argument('--timeout', type=int, default=120000)
parser.add_argument('--spam', help='a key to press twice a second while waiting for --until')
args = parser.parse_args()

width, height = (int(v) for v in args.size.split('x'))
with sync_playwright() as p:
    browser = launch(p)
    context = browser.new_context(
        viewport={'width': width, 'height': height},
        reduced_motion='reduce' if args.reduced else 'no-preference',
        ignore_https_errors=True,
    )
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)[:300]))
    page.on('console', lambda m: errors.append(m.text[:300]) if m.type == 'error' else None)
    page.goto(args.url)
    page.wait_for_timeout(args.wait)
    for click in args.click:
        x, y = (float(v) for v in click.split(','))
        page.mouse.click(x, y)
        page.wait_for_timeout(args.after)
    for key in args.press:
        page.keyboard.press(key)
        page.wait_for_timeout(args.after)
    if args.until:
        waited = 0
        while waited < args.timeout and args.until not in page.inner_text('body'):
            if args.spam:
                page.keyboard.press(args.spam)
            page.wait_for_timeout(500)
            waited += 500
        print('until:', 'found' if args.until in page.inner_text('body') else 'NOT FOUND', f'after {waited} ms', file=sys.stderr)
    if args.frames == 1:
        page.screenshot(path=args.out)
    else:
        stem = args.out.rsplit('.', 1)[0]
        for index in range(args.frames):
            page.screenshot(path=f'{stem}-{index}.png')
            page.wait_for_timeout(args.every)
    if args.errors:
        for error in errors[:20]:
            print('ERR', error, file=sys.stderr)
    browser.close()
