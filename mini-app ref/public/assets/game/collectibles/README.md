# In-game collectibles (Stage 0.5)

Mid-run pickup items that accumulate across runs as **монеты Annet** and
unlock fox skins. Rendered by `mini-app/src/game/engine/CollectibleManager.ts`.
Until the real sprite is added, the manager falls back to a procedural
golden coin with an "A" monogram drawn via canvas, so gameplay keeps working.

Expected files (transparent WebP):

| File | Render size (W×H) | Purpose |
| --- | --- | --- |
| `coin.webp` | 34×40 | Annet coin - gold disc with a fox silhouette / "A" monogram |

Design notes:
- Gold body (`#d58a2a` → `#f2b451` gradient), warm rim light, slight inner
  bevel to read at small sizes.
- Transparent background. The sprite bobs vertically during gameplay and
  sits either in the low band (collect while running/crouching) or in a
  higher band (collect by jumping).
- Keep the silhouette readable at 34×40 against both dark (desert) and
  light (snow) backdrops.

The legacy `certificate.webp` from the previous mechanic is no longer
referenced from code; you can delete it when convenient.
