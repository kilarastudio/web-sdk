---
type: llm
focus: trace
weight: 1
---

collectCoins is added to BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT and its accumulated total is restored in the createBonusSnapshot handler, so a resumed bonus keeps the total
