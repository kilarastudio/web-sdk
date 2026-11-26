"""Write src/game/config.ts from the math's own frontend config.

Run after the math changes:  python3 apps/floppy-rabbit/scripts/sync_math_config.py

Reads math-sdk/games/floppy_rabbit/library/configs/config_fe_floppy_rabbit.json (written by the
math run), so mode costs, RTP, max win, the paytable and the padding reels can never drift from
the books the game plays.
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
SOURCE = os.path.join(WORKSPACE, "math-sdk", "games", "floppy_rabbit", "library", "configs", "config_fe_floppy_rabbit.json")
TARGET = os.path.join(HERE, "..", "src", "game", "config.ts")
ORDER = ["H1", "H2", "H3", "H4", "L1", "L2", "L3", "S"]

with open(SOURCE, encoding="UTF-8") as f:
    config = json.load(f)

symbols = {}
for entry in config["symbols"]:
    symbols.update(entry)
symbols.setdefault("S", {"paytable": None, "special_properties": ["scatter"]})
config["symbols"] = {name: symbols[name] for name in ORDER}

header = (
    "// The game's config, from the math: written by scripts/sync_math_config.py from\n"
    "// math-sdk/games/floppy_rabbit/library/configs/config_fe_floppy_rabbit.json. Do not edit by hand.\n"
)
with open(TARGET, "w", encoding="UTF-8") as f:
    f.write(header + "export default " + json.dumps(config, indent="\t") + ";\n")
print(f"wrote {os.path.relpath(TARGET, WORKSPACE)}")
