"""Write src/game/config.ts from the math.

Run after the math changes, from web-sdk:
    python3 apps/kilara-keno/scripts/sync_math_config.py && pnpm --filter kilara-keno format

Reads, from math-sdk/games/kilara_keno:
- game_config.py: the board, pick sizes and Kilau numbers per level, draws, the ladder and every pay
  table (the same object the books were made with);
- library/publish_files: each mode's cost (index.json), and its exact RTP and top prize, worked
  out from its lookup table (the weights the RGS draws with), not from the nominal 96.7% target.
So costs, pay tables, RTP and max win can never drift from the books the game plays.
"""

import csv
import json
import os
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
MATH_SDK = os.path.join(WORKSPACE, "math-sdk")
GAME = os.path.join(MATH_SDK, "games", "kilara_keno")
PUBLISH = os.path.join(GAME, "library", "publish_files")
TARGET = os.path.join(HERE, "..", "src", "game", "config.ts")

sys.path[:0] = [MATH_SDK, GAME]
from game_config import GameConfig  # noqa: E402

math = GameConfig()
index = json.load(open(os.path.join(PUBLISH, "index.json"), encoding="UTF-8"))

bet_modes = {}
for entry in index["modes"]:
    name = entry["name"]
    level, picks, draws, kilau = math.mode_parts(name)
    total_weight = 0
    total_pay = 0
    top = 0
    with open(os.path.join(PUBLISH, entry["weights"]), encoding="UTF-8") as f:
        for _, weight, pay in csv.reader(f):
            total_weight += int(weight)
            total_pay += int(weight) * int(pay)
            top = max(top, int(pay))
    rtp = Fraction(total_pay, total_weight * 100) / Fraction(entry["cost"]).limit_denominator()
    bet_modes[name] = {
        "level": level,
        "picks": picks,
        "draws": draws,
        # numbers the player did not pick that are marked before the draw
        "kilau": kilau,
        "cost": entry["cost"],
        # the exact return of the published lookup table, to 6 decimals
        "rtp": round(float(rtp), 6),
        "maxWin": top / 100,
        # index = number of hits, in multiples of the base bet, before the streak multiplier
        "payTable": math.pay_tables[level][picks],
    }

ladder = [math.streak_multiplier[step] for step in range(1, math.top_streak + 1)]
config = {
    "gameID": math.game_id,
    "boardNumbers": math.board_numbers,
    "pickSizes": sorted({picks for sizes in math.level_picks.values() for picks in sizes}),
    "levels": math.levels,
    # levels above 1x: armed through a confirmation, a miss lowers the run by one
    "premiumLevels": [level for level in math.levels if math.level_cost[level] > 1],
    "levelPicks": math.level_picks,
    "levelKilau": math.level_kilau,
    "levelDraws": math.level_draws,
    "levelCost": math.level_cost,
    # multiplier for streak level 1, 2, ... top; every level above the top pays the top
    "ladder": ladder,
    "wincap": math.wincap,
    "betModes": bet_modes,
}

header = (
    "// The game's config, from the math: written by scripts/sync_math_config.py from\n"
    "// math-sdk/games/kilara_keno (game_config.py and library/publish_files). Do not edit by hand.\n"
)
with open(TARGET, "w", encoding="UTF-8") as f:
    f.write(header + "export default " + json.dumps(config, indent="\t") + " as const;\n")
print(f"wrote {os.path.relpath(TARGET, WORKSPACE)}")
for name, mode in bet_modes.items():
    print(f"  {name}: cost {mode['cost']}x, RTP {mode['rtp'] * 100:.3f}%, max win {mode['maxWin']}x")
