# @battlepad/mobile

The Battlepad Expo app (React Native + expo-router). Currently a **dex browser** that proves the
data + engine pipeline: it lists every Pokémon legal in Champions Regulations M-A/M-B and shows a
detail screen with types, base stats, abilities, **Mega forms** (stats/types/ability), weaknesses,
and the full move list — all from `@battlepad/core` + `@battlepad/data`.

## Run it

From the repo root, install once:

```bash
npm install
```

Then start the dev server:

```bash
cd apps/mobile
npx expo start
```

- **On your phone:** install **Expo Go**, then scan the QR code (iOS: Camera app; Android: Expo Go
  → Scan). Phone and computer must share Wi‑Fi, or use `npx expo start --tunnel`.
- **iOS Simulator** (macOS + Xcode): press `i`. **Android emulator** (Android Studio): press `a`.

Everything the current build uses is supported in **Expo Go** — no custom dev build required yet.

## Verify a production bundle (no device needed)

```bash
npx expo export -p ios   # or: -p android / -p web
```

This runs Metro and fails loudly on any import/resolution error.

## Structure

```
app/
  _layout.tsx          # Stack navigator + theme
  index.tsx            # Dex list (search by name / dex #)
  pokemon/[slug].tsx   # Detail: stats, types, abilities, Megas, weaknesses, moves
src/
  catalog.ts           # Species list derived from the dataset
  components.tsx        # TypeBadge, StatBar, TypeRow
  theme.ts             # Colors + type colors
```

Metro is configured for the monorepo (`metro.config.js`) so the `@battlepad/*` workspace packages
resolve without extra setup.
