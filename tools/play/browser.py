"""The headless browser the play tools drive.

Playwright's own Chromium is used when it is installed. Where only a cached headless shell
exists (no `playwright install`), the newest one under the Playwright cache is used; set
KILARA_CHROME to point at a specific binary. The GPU backend defaults to Metal on a Mac (frames
are then paced like a real device) and to SwiftShader elsewhere; set KILARA_GL to override.
"""
import glob
import os
import platform


def executable():
    path = os.environ.get('KILARA_CHROME')
    if path:
        return path
    found = sorted(glob.glob(os.path.expanduser(
        '~/Library/Caches/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell')))
    found += sorted(glob.glob(os.path.expanduser(
        '~/.cache/ms-playwright/chromium_headless_shell-*/*/headless_shell')))
    return found[-1] if found else None


def launch(playwright):
    gl = os.environ.get('KILARA_GL', 'metal' if platform.system() == 'Darwin' else 'swiftshader')
    return playwright.chromium.launch(
        executable_path=executable(),
        args=['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', f'--use-angle={gl}',
              '--enable-unsafe-swiftshader'],
    )
