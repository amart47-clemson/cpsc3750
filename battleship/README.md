# Battleship — Radar Command (CPSC 3750 V2+)

Radar-themed Battleship: place your ships, then play against an AI. Green = hit, red = miss. State and turns are controlled by the server; game persists across server restarts.

---

## Run (Node server required)

```bash
cd battleship
npm install
npm start
```

Then open **http://localhost:3000**

The server serves the game and the API. Do not use a static-only server (e.g. `python3 -m http.server`) for the full V2+ experience; state lives on the Node server.

---

## How to play

- **Placement:** Place 1×4, 1×3, 1×2 (H/V), then **Start Battle**. **Rearrange** clears placement and lets you place again (same game).
- **New Game:** New enemy layout and new placement from scratch.
- **Restart Battle:** Same your ships and same enemy layout; all shots cleared, you go first.
- **Your Fleet / Enemy Waters:** Same as before; opponent ships are hidden. Hit = green, miss = red; hit gives another shot.

---

## What counts as a major iteration (V2+)

A **major iteration** must change **game behavior, rules, or architecture**. Cosmetic-only changes do not count.

**Acceptable (examples):** New Game vs Restart with server-controlled state; computer fires back; player ship placement with server validation; smarter AI; explicit game state machine; persistent storage (JSON or SQLite).

**Already in baseline (do not count as an iteration):** Computer fires back (turn-based logic).

**Not acceptable:** Only changing colors or layout; renaming variables; adding alerts or console output.

---

## Two iterations + Advanced (optional)

### Iteration 1 — Server-controlled state; New Game vs Restart

- Game state lives on the server (Node.js + Express). Client uses `GET /api/game` and `POST /api/game/new`, `POST /api/game/restart`, `POST /api/game/place`, `POST /api/game/fire`.
- **New Game:** New enemy ships and clear player ships; back to placement (SETUP).
- **Restart Battle:** Same your ships and same enemy ships; clear all shots; back to your turn. No browser refresh; state comes from the server.

### Iteration 2 — Explicit game state machine

- Four formal states: **SETUP**, **PLAYER_TURN**, **COMPUTER_TURN**, **GAME_OVER**.
- All transitions enforced on the server: place only in SETUP; fire only in PLAYER_TURN; computer moves only in COMPUTER_TURN. Invalid requests return 400 and do not change state.

### Iteration 3 (Advanced) — Persistent storage

- Game state is written to **game-state.json** after every change.
- On server startup, state is loaded from that file if it exists. The game survives server restart (same boards and shots).

### Advanced AI — Hunt/target + memory

- **Hunt mode:** When the computer has no “target” cells queued, it picks a random unfired cell.
- **Target mode:** When the computer gets a hit, it adds the four adjacent cells (up, down, left, right) to a **target queue** and remembers them. On subsequent turns it shoots from this queue (cells next to known hits) until it misses or sinks the ship.
- **Memory:** The target queue is part of game state and is persisted; after a ship is sunk, the queue is cleared so the AI goes back to hunt mode for the next ship.

---

## Known limitations

- **Single game per server:** Only one game in memory (and in the JSON file). No multi-session or game IDs.
- **AI:** Uses hunt/target with memory (target queue); single game per server, no multi-session.
- **Single player only:** No multiplayer.
- **Audio:** Hit sound may be blocked until the user has interacted with the page (browser policy).

---

## Submission checklist (V2+)

- [x] Two meaningful iterations completed (server state + state machine)
- [x] Clear client vs server separation
- [x] Explicit game state handling (state machine on server)
- [x] Architecture snapshot included → [ARCHITECTURE.md](ARCHITECTURE.md)
- [x] AI prompt log included → [AI_PROMPT_LOG.md](AI_PROMPT_LOG.md)
- [ ] GitHub link to FINAL version
- [ ] 1–2 minute Loom demo video
- [x] No browser refresh hacks for state
