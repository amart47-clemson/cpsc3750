# AI Prompt Log — Battleship V2+

Short log of intentional AI usage (5–10 prompts). For each: **prompt**, **why you asked**, **what you accepted or rejected**.

---

## 1. Initial game request

**Prompt (summary):** Create a Battleship game with radar-themed UI, an opponent, show hits and misses, show ships being hit, green = hit / red = miss, run on localhost.

**Why:** To get a working baseline game with a clear theme and core rules in one shot.

**Accepted:** Full implementation (HTML, CSS, JS), radar theme, two grids, AI opponent, hit/miss styling, local server instructions. **Rejected:** Nothing; used as delivered.

---

## 2. Port conflict

**Prompt (summary):** [Shared terminal error] OSError: Address already in use (port 8080).

**Why:** Server wouldn’t start; needed a fix.

**Accepted:** Suggestion to use a different port (e.g. 8000) or kill the process on 8080. **Rejected:** Nothing.

---

## 3. Rule and ship set changes

**Prompt (summary):** Use only 1×2, 1×3, 1×4 ships; let me move/place my ships wherever I want before the round; and when someone hits a correct spot they go again until they miss.

**Why:** Match desired rules and add a placement phase.

**Accepted:** New ship set (three ships only), placement phase with H/V and grid clicks, “Start Battle” and “Rearrange,” and hit = extra turn for both player and AI. **Rejected:** Nothing.

---

## 4. Show ships on the board

**Prompt (summary):** Show the ships (on the board).

**Why:** Wanted ships visible so the board state is clear.

**Accepted:** Showing your ships on your grid and enemy ships on the enemy grid (so both fleets were visible). **Rejected:** Nothing at first.

---

## 5. Hide opponent’s ships

**Prompt (summary):** Don’t let me see my opponent’s ships or where they are placed; fix that.

**Why:** Classic Battleship: enemy positions should be hidden until hit.

**Accepted:** Enemy grid no longer shows ship positions; only hits (green) and misses (red) after firing. **Rejected:** The previous “show enemy ships” behavior.

---

## 6. Hit sound effect

**Prompt (summary):** Add a sound effect when a ship is hit.

**Why:** Wanted clearer feedback on hits.

**Accepted:** Web Audio API hit sound on any ship hit (yours or enemy’s), with context resume on “Start Battle” so it works after user interaction. **Rejected:** Nothing.

---


## 7. Submission and README requirements

**Prompt (summary):** Architecture snapshot (client/server, state, transitions), AI prompt log (5–10 prompts with prompt/why/accepted or rejected), submission checklist, and README with two iterations and known limitations.

**Why:** To produce the required docs and checklist for submission.

**Accepted:** Creation of ARCHITECTURE.md, AI_PROMPT_LOG.md, and README updates. **Rejected:** Nothing.

---

## 8. Implement two iterations + advanced (server, state machine, persistence)

**Prompt (summary):** Implement whatever is needed for the two required major iterations and the optional advanced iteration: server-controlled state with New Game vs Restart, explicit game state machine (SETUP, PLAYER_TURN, COMPUTER_TURN, GAME_OVER) enforced on the server, and persistent storage (JSON) so the game survives server restart.

**Why:** To satisfy the V2+ assignment (two iterations) and the advanced option (persistence) for extra credit.

**Accepted:** Node.js + Express server with GET/POST /api/game, new, restart, place, fire; four-state machine with validation; save/load to game-state.json; client refactored to use API only, with New Game and Restart Battle buttons; ARCHITECTURE.md and README.md updated. **Rejected:** Nothing.

---

## 9. Advanced AI (hunt/target + memory)

**Prompt (summary):** Add the Advanced AI with hunt/target behavior and memory of hits.

**Why:** To implement the optional advanced iteration (hunt/target + memory) for a stronger opponent.

**Accepted:** Server now maintains an `aiTargetQueue` of cells adjacent to hits; when the computer hits, it adds the four neighbors (in bounds, not yet fired) to the queue and prefers shooting from the queue on later turns; when a ship is sunk the queue is cleared (hunt mode for the next ship); queue is persisted in game-state.json and reset on new game/restart. **Rejected:** Nothing.

---

