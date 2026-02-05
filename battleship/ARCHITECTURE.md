# Battleship V2+ — Architecture Snapshot

## Architecture (after iterations)

```
  [Browser Client]                    [Node.js Server]
  - UI (grids, placement, buttons)   - Game state (single game)
  - Placement UI state (local)       - Persisted to game-state.json
  - Fetches state from server       - Validates all actions
  - Sends: place, fire, new, restart - State machine: SETUP → PLAYER_TURN ↔ COMPUTER_TURN → GAME_OVER
         │                                    │
         └────────── GET/POST /api/game ───────┘
```

---

### Client responsibilities

- **UI:** Render both grids (your fleet, enemy waters), placement controls (H/V, place ship, Start Battle, Rearrange), status bar, ship counts, **New Game** and **Restart Battle** buttons.
- **Placement (SETUP):** Collect three ship placements locally; on “Start Battle” send `POST /api/game/place` with `{ ships }`. “Rearrange” clears local placement only (no server call).
- **Display state:** After any API response, re-render from server state (yourShips, yourHits, yourMisses, enemyHits, enemyMisses, state, winner). Client never holds authoritative game state; it only caches the latest response.
- **Actions:** “New Game” → `POST /api/game/new`. “Restart Battle” → `POST /api/game/restart`. Fire → `POST /api/game/fire` with `{ row, col }`.
- **Audio:** Hit sound (Web Audio API) when a fire response indicates a new hit.

---

### Server responsibilities

- **Game state:** Single in-memory game object (`state`, `winner`, `yourShips`, `enemyShips`, `yourHits`, `yourMisses`, `enemyHits`, `enemyMisses`). Client never receives `enemyShips`.
- **State machine:** Exactly four states — `SETUP`, `PLAYER_TURN`, `COMPUTER_TURN`, `GAME_OVER`. Every endpoint checks current state and rejects invalid transitions (e.g. fire only in `PLAYER_TURN`).
- **Validation:** Placement validated (3 ships, lengths 4/3/2, no overlap, in bounds). Fire validated (in bounds, not already fired). Restart only when ships already placed.
- **AI:** Hunt/target with memory: when the computer hits, it queues adjacent cells and prefers shooting from that queue until a miss or ship sunk; queue is cleared when a ship is sunk and on new game/restart. When state becomes `COMPUTER_TURN`, server runs computer shot(s) until a miss or game over; response includes final state.
- **Persistence:** After every state change, write full game to `game-state.json`. On startup, load from file if present so the game survives server restart.
- **Static files:** Serves `index.html`, `styles.css`, `game.js` from the same origin so the client can use relative `/api` URLs.

---

### Where game state lives

- **Authoritative:** On the server, in memory and in `game-state.json`. One game per server process.
- **Client:** Only the latest snapshot from the last API response; used purely for rendering. No refresh or reload is used to “fix” state.

---

### How state transitions occur

| Trigger              | Allowed state(s) | New state / effect |
|----------------------|-----------------|--------------------|
| POST /api/game/new   | any             | SETUP, new enemy ships, clear ships and shots |
| POST /api/game/place | SETUP           | PLAYER_TURN (ships saved, validated) |
| POST /api/game/fire  | PLAYER_TURN     | Hit → stay PLAYER_TURN; Miss → COMPUTER_TURN (then server runs AI until miss or GAME_OVER) |
| Server (AI)          | COMPUTER_TURN   | Hit → stay COMPUTER_TURN; Miss → PLAYER_TURN; all ships sunk → GAME_OVER |
| POST /api/game/restart | (ships placed) | PLAYER_TURN, same boards, shots cleared |
| GET /api/game        | any             | No transition; returns current state for display / reload |

All transitions are enforced on the server; invalid requests return 400 and do not change state.
