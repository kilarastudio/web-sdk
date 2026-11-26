"""Write src/game/config.ts from the math's own frontend config.

Run after the math changes:  python3 apps/vault-job/scripts/sync_math_config.py

Reads math-sdk/games/vault_job/library/configs/config_fe_vault_job.json (written by the
math run), so mode costs, RTP, max win, the paytable and the padding reels can never drift from
the books the game plays.
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
SOURCE = os.path.join(WORKSPACE, "math-sdk", "games", "vault_job", "library", "configs", "config_fe_vault_job.json")
TARGET = os.path.join(HERE, "..", "src", "game", "config.ts")
# W is no symbol on the board: the math names a line made of crew alone "W" (it pays as H1).
ORDER = ["H1", "H2", "H3", "H4", "L1", "L2", "L3", "L4", "WD", "WC", "WM", "WH", "S", "W"]

with open(SOURCE, encoding="UTF-8") as f:
    config = json.load(f)

symbols = {}
for entry in config["symbols"]:
    symbols.update(entry)
symbols.setdefault("S", {"paytable": None, "special_properties": ["scatter"]})
config["symbols"] = {name: symbols[name] for name in ORDER}

header = (
    "// The game's config, from the math: written by scripts/sync_math_config.py from\n"
    "// math-sdk/games/vault_job/library/configs/config_fe_vault_job.json. Do not edit by hand.\n"
)
with open(TARGET, "w", encoding="UTF-8") as f:
    f.write(header + "export default " + json.dumps(config, indent="\t") + ";\n")
print(f"wrote {os.path.relpath(TARGET, WORKSPACE)}")
