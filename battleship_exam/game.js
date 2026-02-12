/**
 * Battleship Exam — Client
 * Uses api.php for game state, scoreboard (JSON), and difficulty.
 */
(function () {
  'use strict';

  const GRID_SIZE = 10;
  const SHIP_SPECS = [
    { name: '1×4', length: 4 },
    { name: '1×3', length: 3 },
    { name: '1×2', length: 2 },
  ];

  const API_BASE = 'api.php';
  let serverState = null;
  let placementIndex = 0;
  let placementVertical = false;
  let localShips = [];

  const yourGridEl = document.getElementById('your-grid');
  const enemyGridEl = document.getElementById('enemy-grid');
  const statusEl = document.getElementById('status');
  const yourShipsCountEl = document.getElementById('your-ships-count');
  const enemyShipsCountEl = document.getElementById('enemy-ships-count');
  const newGameBtn = document.getElementById('new-game');
  const restartGameBtn = document.getElementById('restart-game');
  const explosionEl = document.getElementById('hit-explosion');
  const placementControlsEl = document.getElementById('placement-controls');
  const placementShipLabel = document.getElementById('placement-ship-label');
  const placementActionsEl = document.getElementById('placement-actions');
  const startBattleBtn = document.getElementById('start-battle');
  const rearrangeBtn = document.getElementById('rearrange');
  const orientH = document.getElementById('orient-h');
  const orientV = document.getElementById('orient-v');
  const playerNameEl = document.getElementById('player-name');
  const difficultyEl = document.getElementById('difficulty');
  const scoreboardListEl = document.getElementById('scoreboard-list');

  let audioCtx = null;

  function playHitSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const ctx = audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
      osc.type = 'square';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }

  function key(r, c) {
    return r + ',' + c;
  }

  async function apiGet(endpoint) {
    const res = await fetch(API_BASE + '?endpoint=' + encodeURIComponent(endpoint));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  }

  async function apiPost(endpoint, body) {
    const res = await fetch(API_BASE + '?endpoint=' + encodeURIComponent(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  }

  async function loadScoreboard() {
    try {
      const data = await apiGet('scoreboard');
      const list = data.scoreboard || [];
      scoreboardListEl.innerHTML = '';
      if (list.length === 0) {
        scoreboardListEl.innerHTML = '<li class="scoreboard-empty">No records yet.</li>';
      } else {
        list.forEach(function (entry) {
          const li = document.createElement('li');
          li.textContent = (entry.name || 'Player') + ': ' + (entry.wins || 0) + ' W / ' + (entry.losses || 0) + ' L';
          scoreboardListEl.appendChild(li);
        });
      }
    } catch (_) {
      scoreboardListEl.innerHTML = '<li class="scoreboard-empty">Scoreboard unavailable.</li>';
    }
  }

  function canPlaceAt(r, c, length, vertical, occupied) {
    for (let i = 0; i < length; i++) {
      const nr = vertical ? r + i : r;
      const nc = vertical ? c : c + i;
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false;
      if (occupied.has(key(nr, nc))) return false;
    }
    return true;
  }

  function buildShipAt(r, c, spec, vertical) {
    const cells = [];
    for (let i = 0; i < spec.length; i++) {
      cells.push({ row: vertical ? r + i : r, col: vertical ? c : c + i });
    }
    return { name: spec.name, length: spec.length, cells: cells };
  }

  function updatePlacementUI() {
    if (placementIndex < SHIP_SPECS.length) {
      placementShipLabel.textContent = SHIP_SPECS[placementIndex].name;
      placementActionsEl.classList.add('hidden');
    } else {
      placementActionsEl.classList.remove('hidden');
    }
  }

  function syncUI(data) {
    serverState = data;
    const state = data.state;
    const placementPhase = state === 'SETUP';

    if (difficultyEl) {
      const d = data.difficulty || 'medium';
      if (d !== difficultyEl.value) difficultyEl.value = d;
      difficultyEl.disabled = !placementPhase;
    }

    if (placementPhase) {
      placementControlsEl.classList.remove('hidden');
      restartGameBtn.style.display = 'none';
      yourShipsCountEl.textContent = localShips.length;
    } else {
      placementControlsEl.classList.add('hidden');
      if (state === 'PLAYER_TURN' || state === 'COMPUTER_TURN' || state === 'GAME_OVER') {
        restartGameBtn.style.display = 'inline-block';
      }
      yourShipsCountEl.textContent = data.yourShipsLeft ?? 3;
    }
    enemyShipsCountEl.textContent = data.enemyShipsLeft ?? 3;

    if (state === 'GAME_OVER') {
      statusEl.textContent = data.winner === 'player'
        ? 'VICTORY — ENEMY FLEET DESTROYED'
        : 'DEFEAT — FLEET DESTROYED';
    } else if (state === 'PLAYER_TURN') {
      statusEl.textContent = 'YOUR TURN — SELECT TARGET ON ENEMY GRID';
    } else if (state === 'COMPUTER_TURN') {
      statusEl.textContent = 'ENEMY TURN — INCOMING...';
      // Run pending computer turn(s) so we don’t stay stuck
      apiPost('game_run_computer', {}).then(function (next) {
        syncUI(next);
        if (next.state === 'GAME_OVER' && next.winner === 'computer') {
          const playerName = (playerNameEl && playerNameEl.value.trim()) ? playerNameEl.value.trim() : 'Player';
          apiPost('scoreboard', { playerName: playerName, result: 'loss' }).then(loadScoreboard).catch(function () {});
        }
      }).catch(function () {});
    } else if (placementPhase) {
      statusEl.textContent = 'PLACE YOUR SHIPS — CLICK GRID BELOW';
    }

    const yourShips = placementPhase ? localShips : (data.yourShips || []);
    const shipCells = new Set();
    yourShips.forEach(function (s) {
      s.cells.forEach(function (c) { shipCells.add(key(c.row, c.col)); });
    });
    const yourHits = new Set(data.yourHits || []);
    const yourMisses = new Set(data.yourMisses || []);
    const enemyHits = new Set(data.enemyHits || []);
    const enemyMisses = new Set(data.enemyMisses || []);

    yourGridEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (shipCells.has(key(r, c))) cell.classList.add('ship');
        if (yourHits.has(key(r, c))) cell.classList.add('hit');
        if (yourMisses.has(key(r, c))) cell.classList.add('miss');
        yourGridEl.appendChild(cell);
      }
    }

    if (placementPhase) {
      yourGridEl.classList.add('clickable');
      yourGridEl.querySelectorAll('.cell').forEach(function (el) {
        el.addEventListener('click', onYourGridClickPlace);
      });
    } else {
      yourGridEl.classList.remove('clickable');
    }

    enemyGridEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        if (enemyHits.has(key(r, c))) cell.classList.add('hit');
        if (enemyMisses.has(key(r, c))) cell.classList.add('miss');
        enemyGridEl.appendChild(cell);
      }
    }
    if (state === 'PLAYER_TURN') {
      enemyGridEl.querySelectorAll('.cell:not(.hit):not(.miss)').forEach(function (el) {
        el.addEventListener('click', onEnemyCellClick);
      });
    }
  }

  function onYourGridClickPlace(e) {
    const cell = e.target.closest('.cell');
    if (!cell || placementIndex >= SHIP_SPECS.length) return;
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    const spec = SHIP_SPECS[placementIndex];
    const occupied = new Set(localShips.flatMap(function (s) {
      return s.cells.map(function (c) { return key(c.row, c.col); });
    }));
    if (!canPlaceAt(row, col, spec.length, placementVertical, occupied)) return;
    localShips.push(buildShipAt(row, col, spec, placementVertical));
    placementIndex++;
    updatePlacementUI();
    syncUI({ ...serverState, yourShips: localShips, state: 'SETUP' });
  }

  async function startBattle() {
    if (localShips.length !== 3) return;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    try {
      const data = await apiPost('game_place', { ships: localShips });
      syncUI(data);
    } catch (err) {
      statusEl.textContent = 'Placement rejected: ' + (err.message || 'try again');
    }
  }

  function rearrange() {
    localShips = [];
    placementIndex = 0;
    placementShipLabel.textContent = SHIP_SPECS[0].name;
    placementActionsEl.classList.add('hidden');
    syncUI({
      state: 'SETUP',
      winner: null,
      yourShips: [],
      yourHits: [],
      yourMisses: [],
      enemyHits: [],
      enemyMisses: [],
      yourShipsLeft: 0,
      enemyShipsLeft: 3,
      difficulty: difficultyEl ? difficultyEl.value : 'medium',
    });
  }

  async function onEnemyCellClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    const prevEnemyHits = new Set(serverState.enemyHits || []);
    try {
      const data = await apiPost('game_fire', { row: row, col: col });
      const newHit = (data.enemyHits || []).some(function (k) { return !prevEnemyHits.has(k); });
      if (newHit) {
        playHitSound();
        explosionEl.classList.remove('flash');
        void explosionEl.offsetWidth;
        explosionEl.classList.add('flash');
        setTimeout(function () { explosionEl.classList.remove('flash'); }, 400);
      }
      syncUI(data);
      if (data.state === 'GAME_OVER') {
        const playerName = (playerNameEl && playerNameEl.value.trim()) ? playerNameEl.value.trim() : 'Player';
        const result = data.winner === 'player' ? 'win' : 'loss';
        try {
          await apiPost('scoreboard', { playerName: playerName, result: result });
          loadScoreboard();
        } catch (_) {}
      }
    } catch (err) {
      statusEl.textContent = (err.message || 'Fire failed') + ' — try again';
    }
  }

  async function loadGame() {
    try {
      let data = await apiGet('game');
      // If server was left mid–computer-turn, run computer turn(s) now so it’s the player’s turn
      if (data.state === 'COMPUTER_TURN') {
        try {
          data = await apiPost('game_run_computer', {});
        } catch (_) {
          data = await apiGet('game');
        }
      }
      if (data.state === 'SETUP') {
        localShips = Array.isArray(data.yourShips) ? data.yourShips : [];
        placementIndex = localShips.length;
        placementShipLabel.textContent = SHIP_SPECS[Math.min(placementIndex, 2)].name;
        updatePlacementUI();
      } else {
        localShips = Array.isArray(data.yourShips) ? data.yourShips : [];
      }
      syncUI(data);
      loadScoreboard();
    } catch (_) {
      statusEl.textContent = 'Cannot reach server. Use XAMPP and open index.php.';
      restartGameBtn.style.display = 'none';
      loadScoreboard();
    }
  }

  async function newGame() {
    const difficulty = difficultyEl ? difficultyEl.value : 'medium';
    try {
      const data = await apiPost('game_new', { difficulty: difficulty });
      localShips = [];
      placementIndex = 0;
      placementShipLabel.textContent = SHIP_SPECS[0].name;
      placementActionsEl.classList.add('hidden');
      orientH.classList.add('active');
      orientV.classList.remove('active');
      syncUI(data);
    } catch (err) {
      statusEl.textContent = err.message || 'New game failed';
    }
  }

  async function restartGame() {
    try {
      const data = await apiPost('game_restart', {});
      syncUI(data);
    } catch (err) {
      statusEl.textContent = err.message || 'Restart failed';
    }
  }

  orientH.addEventListener('click', function () {
    placementVertical = false;
    orientH.classList.add('active');
    orientV.classList.remove('active');
  });
  orientV.addEventListener('click', function () {
    placementVertical = true;
    orientV.classList.add('active');
    orientH.classList.remove('active');
  });
  startBattleBtn.addEventListener('click', startBattle);
  rearrangeBtn.addEventListener('click', rearrange);
  newGameBtn.addEventListener('click', newGame);
  restartGameBtn.addEventListener('click', restartGame);

  restartGameBtn.style.display = 'none';
  loadGame();
})();
