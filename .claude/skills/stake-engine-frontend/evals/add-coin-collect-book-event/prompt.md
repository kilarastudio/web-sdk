---
tags: [skill-creator]
max_turns: 60
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Tim math baru menambahkan book event baru untuk mode BONUS di game lines. Setelah setiap reveal di free spin bisa muncul event seperti ini:

```json
{ "index": 7, "type": "collectCoins", "coins": [{ "reel": 1, "row": 2, "value": 250 }, { "reel": 3, "row": 0, "value": 500 }], "totalCoinWin": 750 }
```

`value` dan `totalCoinWin` itu dalam satuan book seperti amount di setTotalWin. Total koin akumulatif sampai bonus selesai dan harus tampil di layar. Tolong implementasikan di frontend apps/lines.
