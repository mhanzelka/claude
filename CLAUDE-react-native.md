# CLAUDE.md

_Last updated: 2026-09-19_

An [Expo](https://expo.dev) / React Native app. The repo-root `CLAUDE.md` (general coding rules, git)
still applies, and where a web app shares this repo its own `CLAUDE.md` covers the shared TypeScript
and React Query patterns.

## Preferred Technologies

- **Language** — TypeScript (`strict`)
- **Framework** — Expo (managed workflow) + React Native
- **New Architecture** — on (Fabric + TurboModules), the Expo SDK default. Verify any third-party native module is New-Arch compatible; prefer an `expo-*` / in-SDK module, which always is.
- **Routing** — Expo Router (file-based)
- **Server state** — TanStack Query (`useQuery`, `useInfiniteQuery`, `useMutation`), persisted to AsyncStorage
- **Styling** — `StyleSheet.create` + design tokens. No Tailwind / NativeWind
- **Secure storage** — `expo-secure-store` for the auth token (Keychain / Keystore). AsyncStorage is unencrypted — never put the token there.
- **Local storage** — `@react-native-async-storage/async-storage` (non-sensitive only)
- **Animation** — `react-native-reanimated` (worklets live in the separate `react-native-worklets` package; match the installed major), `react-native-gesture-handler`
- **Images** — `expo-image` through a thin app wrapper, never the bare RN `<Image>`
- **HTTP** — one shared, configured API client
- **Builds** — EAS (`eas.json`)

When you need a new capability, prefer an Expo-maintained `expo-*` module or a package already in the
Expo SDK before reaching for a third-party native lib — it keeps the managed workflow intact and
avoids a custom dev-client rebuild.

## Project structure

```
src/
  app/                      # Expo Router routes
    _layout.tsx             #   root providers (fonts, QueryClient, Auth, SafeArea)
    index.tsx               #   the first screen
  api/                      # HTTP client wiring
    api.ts                  #   the configured client instance
    baseUrl.ts              #   user-selectable backend (prod / staging / custom)
    token.ts                #   Bearer token (memory + SecureStore)
  lib/                      # app-wide infra (queryClient, useIsOffline, …)
  <app>/                    # the app itself
    components/
      <screen>/             #   components grouped by screen/domain
      ui/                   #   shared, presentational primitives (Button, Sheet, …)
    feature/<name>/         # feature modules — see below
    hooks/                  #   cross-feature hooks
    lib/                    #   pure utilities + design tokens
    icons/                  #   SVG icon set
    types/                  #   shared domain types
```

### Feature module structure

Mirrors the web app. Each feature owns its data layer:

```
feature/<name>/
  api/        # one file per API call (getItems.ts, createItem.ts, …)
  hooks/      # React Query hooks (useItemsQuery.ts, …)
  lib/        # pure helpers with no React dependency
```

Some features also keep a Context when state is truly app-global. Feature names are lowercase single
words. **Components** for a feature or screen live under `components/<screen>/`, not inside `feature/`.

## Styling

- Style with `StyleSheet.create`, placed at the **bottom** of the file. Reach for inline style objects only for values computed from props or state.
- **Never hard-code colors, fonts, shadows, or the corner radius.** Pull them from a tokens module: a color and radius palette, a font-family per weight (RN doesn't synthesize weights reliably, so each weight is its own registered family), and structured shadow props including Android `elevation`.
- Respect device safe areas with `useSafeAreaInsets()`.

## Platform traps worth writing down

- **Blur on Android needs a target.** A `BlurView` only blurs when given a `blurTarget` (a ref to a target view wrapping the content to blur) plus the Android blur method; without it it silently degrades to a plain translucent layer. iOS needs neither and ignores both. Keep the BlurView OUTSIDE the target view, or it blurs its own children.
- **Sheets with a text input must adapt to the keyboard** — use a keyboard-height hook; never assume the window resizes (edge-to-edge Android doesn't, iOS never did).
- **Pad, don't lift: the sheet's background must run UNDER the keyboard.** The iPhone keyboard has rounded top corners, so a card lifted with `bottom: kb` shows the backdrop through them. Keep the card anchored at the screen bottom and grow `paddingBottom` by the keyboard height instead.
- **One native view per list item is what costs a screen its frame rate.** A view is moved by the main thread on every frame whatever it shows; hundreds of them on a map or a canvas cost single-digit fps. Draw what doesn't animate into images and hand them to one native layer, and keep a real view only for what animates or loads.

## API calls

**One file per operation, named after the action.** Never put two calls in one file; never call the
HTTP client directly inside a component or hook.

```ts
// feature/items/api/getItems.ts
import { api } from '@/api/api'
import type { Item } from '../../../types/types'

export type ItemsResponse = { items: Item[] }

export const getItems = (): Promise<ItemsResponse> => api.get<ItemsResponse>('items')
```

- **Don't send empty strings for optional reference fields.** Omit or send `null` — never `""`. Build string payloads with `value || null` (not `value ?? null`). Applies to **strings and ids only** — never `||`-coerce numbers or booleans (`0` / `false` are valid).
- Auth is **Bearer-only** — cookie handling on RN is inconsistent. Never store the token anywhere but the token module (memory + SecureStore).
- Keep the backend user-selectable in one module; don't hard-code a host in a feature.

## React Query

All server state goes through `useQuery` / `useInfiniteQuery` / `useMutation` — no direct client
calls in components. Hooks live in `feature/<name>/hooks/`.

```ts
{
  queries: {
    staleTime: 30_000,
    gcTime: PERSIST_MAX_AGE_MS,                     // outlives the persister
    throwOnError: (error) => isServerError(error),
    retry: (count, error) => isServerError(error) && count < 3,
  },
}
```

4xx errors don't throw and aren't retried — handle them locally. 5xx throw and retry.

**Offline-first.** The cache is persisted to AsyncStorage, so a cold start — even offline — restores
the last session. Two RN-specific bridges must stay wired in the root layout:

- `onlineManager` ← `@react-native-community/netinfo` (RN has no `navigator.onLine`)
- `focusManager` ← `AppState` (RN has no window-focus event)

**Query key convention:** a two-element array, `[resourceString, filtersObject]`. Put filters in the
hook, not the component.

**Realtime patches, not refetches.** When a socket frame carries the whole changed object, patch it
into the cache with `setQueryData` rather than invalidating: at scale, invalidating is recipients ×
events full refetches on every online client. A patch also stamps `dataUpdatedAt`, so it keeps the
entry fresh instead of spending a request.

## Coding conventions

### Naming
- Folders — `components/<screen>/`, `feature/<name>/` (lowercase)
- Files — camelCase (`useItemsQuery.ts`, `getItems.ts`)
- Components — PascalCase (`ItemRow.tsx`)
- One component or module per file. No exceptions.

### Functions
- Declare **all** functions — including components — with `const`. Never use `function` declarations. (`app/` route default exports are the one exception Expo Router requires.)

### Props types
- Every component with more than one prop has a named type `<ComponentName>Props` defined immediately above the component.

  ```ts
  type ItemRowProps = { item: Item; onPress: () => void }
  export const ItemRow = ({ item, onPress }: ItemRowProps) => …
  ```

### Multi-parameter functions
- Non-component functions with more than one parameter group their params into a typed object.

### Imports
- Use the `@/*` path alias for cross-module imports. Relative imports are fine within a feature.

## Accessibility & UI states

- `accessibilityLabel` / `accessibilityRole` on every touchable; accessible sheets and modals; honor reduced motion via Reanimated's `useReducedMotion()`.
- Every query-backed view handles loading / empty / error (spinner, placeholder, retry). Surface a local 4xx to the user; don't render assuming `data` exists.

## Native config

- App-level config (name, scheme, icons, permissions, bundle IDs, background modes) lives in `app.json`. Background modes and location permissions required by a feature must not be removed.
- Bump the version in `app.json` for releases; a persisted query cache is usually busted by version.

## Checks before pushing

- `npm run typecheck` — `tsc --noEmit` (strict)
- `npm run lint` — `expo lint`

When adding tests, use **Jest** with `jest-expo` + **React Native Testing Library** (the
Expo-recommended setup), co-located next to the unit under test. Test pure logic in `lib/` and hook
behaviour first; avoid brittle full-render snapshot tests.
