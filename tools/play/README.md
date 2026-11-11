# Play tools

Small Python tools for checking a game the way a player sees it, in a headless browser. They
need nothing from the repo but a running dev server, and run through `uv`:

```sh
uv run --no-project --with playwright python tools/play/shot.py URL OUT.png --size 412x915 --errors
```

| Tool          | What it answers                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shot.py`     | What does this URL look like? One screenshot or a run of frames, after clicks and key presses; `--errors` prints page errors.                                 |
| `perf.py`     | Is it smooth? Frame gaps and main-thread time over a stretch of play, with the CPU slowed (`--throttle 4` stands in for a phone); `--shots` saves the frames. |
| `sheet.py`    | A contact sheet of a frame run, to read motion frame by frame (`--with pillow`).                                                                              |
| `soundlog.py` | Which sounds play, and when? Names every sound a stretch of play starts, from the game's audio sprite.                                                        |
| `menus.py`    | Do the menus fit every screen? Opens each menu at phone, small phone, sideways phone, mini player, desktop and tablet sizes.                                  |
| `pixelize.py` | Locks an image to a palette and a pixel grid (`--with pillow --with numpy`).                                                                                  |

`browser.py` finds the browser: Playwright's own, or the newest cached headless shell
(`KILARA_CHROME` overrides it, `KILARA_GL` the GPU backend).

Why headless: a browser pane that is hidden pauses `requestAnimationFrame`, so animation checked
there looks frozen. These tools keep rendering.

What they cannot tell you: whether motion _feels_ right, or how a sound _sounds_. They prove that
something runs, fits, fires and keeps its frame rate. Say so when reporting.
