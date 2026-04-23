# Fox skin assets (Stage 0.5в)

The fox has three skins that unlock as players collect 🪙 Annet coins
during runs. Skin data is declared in `mini-app/src/game/engine/constants.ts`
under `SKINS`. Rendering is in `mini-app/src/game/engine/Fox.ts`
(`setActiveSkin`, `renderSkinOverlay`).

## Skin tiers

| Key | Label | Unlock at | Rendering strategy |
| --- | --- | --- | --- |
| `fox_default` | Обычная лиса | 0 🪙 | Stock fox sprite set (no filter, no overlay). |
| `fox_spy` | Лис-шпион | 20 🪙 | Preferred: dedicated `fox-spy-*.webp` frame set (black outfit). Fallback: stock sprites with canvas filter `brightness(0.25) saturate(0.3) contrast(1.35)` + `hood.webp` overlay at head. |
| `fox_fire` | Огненный лис | 60 🪙 | Stock sprites with canvas filter (warm tint + subtle glow) + programmatic ember particles emitted from the tail every ~60 ms. No extra sprites needed. |

## Expected files (transparent WebP)

### Hood overlay (fox_spy fallback)
| File | Render size (W×H) | Notes |
| --- | --- | --- |
| `hood.webp` | 40×34 | Dark hood sitting on top of the fox's head. Drawn in the same rotated/translated context as the fox (facing right). |

Overlay position: `offsetX ≈ 0`, `offsetY ≈ -10` (sits on the fox's head).

### Optional: full spy sprite set
If you want a proper spy character instead of the filter fallback, add
black-clothed versions of every fox animation frame to
`mini-app/public/assets/game/`:

```
fox-spy-idle.webp
fox-spy-run-1.webp … fox-spy-run-6.webp
fox-spy-jump-up.webp
fox-spy-jump-peak.webp
fox-spy-jump-down.webp
fox-spy-land.webp
fox-spy-crouch-1.webp
fox-spy-crouch-2.webp
fox-spy-hurt-1.webp
fox-spy-hurt-2.webp
```

Paths are listed in `SPY_FOX_ANIMATIONS` in
`mini-app/src/game/engine/constants.ts`. The engine auto-falls back to the
filter+hood approach if any frame is missing, so you can ship `hood.webp`
first and add the full set later without code changes.

## Legacy

`hat.webp`, `glasses.webp`, `scarf.webp` from the previous
"3 cosmetic accessories" mechanic are no longer referenced from code.
Delete them when convenient.
