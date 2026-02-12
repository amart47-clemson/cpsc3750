<?php
/**
 * Battleship Exam — API
 * Game state (JSON: game-state.json), Scoreboard (JSON: scoreboard.json), Difficulty (in game state).
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

const GRID_SIZE = 10;
const SHIP_SPECS = [
    ['name' => '1×4', 'length' => 4],
    ['name' => '1×3', 'length' => 3],
    ['name' => '1×2', 'length' => 2],
];

const STATE_SETUP = 'SETUP';
const STATE_PLAYER_TURN = 'PLAYER_TURN';
const STATE_COMPUTER_TURN = 'COMPUTER_TURN';
const STATE_GAME_OVER = 'GAME_OVER';

$BASE_DIR = __DIR__;
// Use system temp dir so state saves even when htdocs isn’t writable by Apache (e.g. XAMPP)
$DATA_PREFIX = sys_get_temp_dir() . '/battleship_exam_' . md5(__DIR__);
$STATE_FILE = $DATA_PREFIX . '_game-state.json';
$SCOREBOARD_FILE = $DATA_PREFIX . '_scoreboard.json';

function cellKey($r, $c) {
    return $r . ',' . $c;
}

function placeShipRandom(&$grid, $spec) {
    $vertical = (mt_rand(0, 1) === 1);
    $maxRow = $vertical ? GRID_SIZE - $spec['length'] : GRID_SIZE - 1;
    $maxCol = $vertical ? GRID_SIZE - 1 : GRID_SIZE - $spec['length'];
    if ($maxRow < 0 || $maxCol < 0) return null;
    $occupied = [];
    foreach ($grid as $s) {
        foreach ($s['cells'] as $cell) {
            $occupied[cellKey($cell['row'], $cell['col'])] = true;
        }
    }
    for ($attempt = 0; $attempt < 200; $attempt++) {
        $r = (int)floor(mt_rand(0, $maxRow));
        $c = (int)floor(mt_rand(0, $maxCol));
        $cells = [];
        for ($i = 0; $i < $spec['length']; $i++) {
            $nr = $vertical ? $r + $i : $r;
            $nc = $vertical ? $c : $c + $i;
            $cells[] = ['row' => $nr, 'col' => $nc];
        }
        $ok = true;
        foreach ($cells as $cell) {
            if (isset($occupied[cellKey($cell['row'], $cell['col'])])) {
                $ok = false;
                break;
            }
        }
        if ($ok) {
            foreach ($cells as $cell) {
                $occupied[cellKey($cell['row'], $cell['col'])] = true;
            }
            return ['name' => $spec['name'], 'length' => $spec['length'], 'cells' => $cells];
        }
    }
    return null;
}

function placeEnemyShips() {
    $enemy = [];
    foreach (SHIP_SPECS as $spec) {
        $s = null;
        while (($s = placeShipRandom($enemy, $spec)) === null) {}
        $enemy[] = $s;
    }
    return $enemy;
}

function countShipsLeft($ships, $hitsSet) {
    $left = 0;
    foreach ($ships as $ship) {
        $sunk = true;
        foreach ($ship['cells'] as $cell) {
            if (!isset($hitsSet[cellKey($cell['row'], $cell['col'])])) {
                $sunk = false;
                break;
            }
        }
        if (!$sunk) $left++;
    }
    return $left;
}

function validatePlacement($ships) {
    if (!is_array($ships) || count($ships) !== 3) {
        return ['ok' => false, 'message' => 'Must place exactly 3 ships'];
    }
    $lengths = array_map(function ($s) { return $s['length']; }, $ships);
    sort($lengths);
    if ($lengths[0] !== 2 || $lengths[1] !== 3 || $lengths[2] !== 4) {
        return ['ok' => false, 'message' => 'Ships must be length 4, 3, and 2'];
    }
    $occupied = [];
    foreach ($ships as $ship) {
        if (!isset($ship['cells']) || !is_array($ship['cells'])) {
            return ['ok' => false, 'message' => 'Invalid ship cells'];
        }
        foreach ($ship['cells'] as $cell) {
            $r = (int)$cell['row'];
            $c = (int)$cell['col'];
            if ($r < 0 || $r >= GRID_SIZE || $c < 0 || $c >= GRID_SIZE) {
                return ['ok' => false, 'message' => 'Ship out of bounds'];
            }
            $k = cellKey($r, $c);
            if (isset($occupied[$k])) return ['ok' => false, 'message' => 'Ships overlap'];
            $occupied[$k] = true;
        }
    }
    return ['ok' => true];
}

function loadState($path) {
    global $STATE_FILE;
    if (!file_exists($STATE_FILE)) return null;
    $raw = @file_get_contents($STATE_FILE);
    if ($raw === false) return null;
    $data = @json_decode($raw, true);
    if (!is_array($data)) return null;
    $data['yourShips'] = isset($data['yourShips']) && is_array($data['yourShips']) ? $data['yourShips'] : [];
    $data['enemyShips'] = isset($data['enemyShips']) && is_array($data['enemyShips']) ? $data['enemyShips'] : [];
    $data['yourHits'] = isset($data['yourHits']) && is_array($data['yourHits']) ? $data['yourHits'] : [];
    $data['yourMisses'] = isset($data['yourMisses']) && is_array($data['yourMisses']) ? $data['yourMisses'] : [];
    $data['enemyHits'] = isset($data['enemyHits']) && is_array($data['enemyHits']) ? $data['enemyHits'] : [];
    $data['enemyMisses'] = isset($data['enemyMisses']) && is_array($data['enemyMisses']) ? $data['enemyMisses'] : [];
    if (!isset($data['aiTargetQueue']) || !is_array($data['aiTargetQueue'])) $data['aiTargetQueue'] = [];
    if (empty($data['difficulty'])) $data['difficulty'] = 'medium';
    return $data;
}

function saveState($game) {
    global $STATE_FILE;
    $_SESSION['game'] = $game;
    @file_put_contents($STATE_FILE, json_encode($game, JSON_PRETTY_PRINT), LOCK_EX);
}

function clientState($game) {
    $yourHits = isset($game['yourHits']) && is_array($game['yourHits']) ? $game['yourHits'] : [];
    $enemyHits = isset($game['enemyHits']) && is_array($game['enemyHits']) ? $game['enemyHits'] : [];
    $yourShips = isset($game['yourShips']) && is_array($game['yourShips']) ? $game['yourShips'] : [];
    $enemyShips = isset($game['enemyShips']) && is_array($game['enemyShips']) ? $game['enemyShips'] : [];
    $yourHitsSet = $yourHits ? array_flip($yourHits) : [];
    $enemyHitsSet = $enemyHits ? array_flip($enemyHits) : [];
    return [
        'state' => $game['state'],
        'winner' => $game['winner'] ?? null,
        'yourShips' => $yourShips,
        'yourHits' => $yourHits,
        'yourMisses' => isset($game['yourMisses']) && is_array($game['yourMisses']) ? $game['yourMisses'] : [],
        'enemyHits' => $enemyHits,
        'enemyMisses' => isset($game['enemyMisses']) && is_array($game['enemyMisses']) ? $game['enemyMisses'] : [],
        'yourShipsLeft' => countShipsLeft($yourShips, $yourHitsSet),
        'enemyShipsLeft' => countShipsLeft($enemyShips, $enemyHitsSet),
        'difficulty' => $game['difficulty'] ?? 'medium',
    ];
}

function addNeighborsToTargetQueue(&$game, $r, $c) {
    $fired = array_flip(array_merge($game['yourHits'], $game['yourMisses']));
    $inQueue = array_flip($game['aiTargetQueue']);
    $neighbors = [[$r - 1, $c], [$r + 1, $c], [$r, $c - 1], [$r, $c + 1]];
    foreach ($neighbors as $n) {
        $nr = $n[0]; $nc = $n[1];
        if ($nr < 0 || $nr >= GRID_SIZE || $nc < 0 || $nc >= GRID_SIZE) continue;
        $k = cellKey($nr, $nc);
        if (isset($fired[$k]) || isset($inQueue[$k])) continue;
        $game['aiTargetQueue'][] = $k;
        $inQueue[$k] = true;
    }
}

function anyShipSunk($game) {
    $hitsSet = array_flip($game['yourHits']);
    foreach ($game['yourShips'] as $ship) {
        $allHit = true;
        foreach ($ship['cells'] as $cell) {
            if (!isset($hitsSet[cellKey($cell['row'], $cell['col'])])) {
                $allHit = false;
                break;
            }
        }
        if ($allHit) return true;
    }
    return false;
}

function runComputerTurn(&$game) {
    $difficulty = $game['difficulty'] ?? 'medium';
    $firedSet = array_flip(array_merge($game['yourHits'], $game['yourMisses']));
    $r = null; $c = null; $k = null;

    if ($difficulty !== 'easy' && !empty($game['aiTargetQueue'])) {
        while (!empty($game['aiTargetQueue'])) {
            $k = array_shift($game['aiTargetQueue']);
            if (!isset($firedSet[$k])) {
                $parts = explode(',', $k);
                $r = (int)$parts[0];
                $c = (int)$parts[1];
                break;
            }
        }
    }

    if ($r === null) {
        $possible = [];
        for ($ri = 0; $ri < GRID_SIZE; $ri++) {
            for ($ci = 0; $ci < GRID_SIZE; $ci++) {
                $ki = cellKey($ri, $ci);
                if (!isset($firedSet[$ki])) $possible[] = ['r' => $ri, 'c' => $ci];
            }
        }
        if (empty($possible)) return;
        $cell = $possible[array_rand($possible)];
        $r = $cell['r'];
        $c = $cell['c'];
        $k = cellKey($r, $c);
    }

    $hit = false;
    foreach ($game['yourShips'] as $ship) {
        foreach ($ship['cells'] as $cell) {
            if ($cell['row'] === $r && $cell['col'] === $c) {
                $hit = true;
                break 2;
            }
        }
    }

    if ($hit) {
        $game['yourHits'][] = $k;
        $yourHitsSet = array_flip($game['yourHits']);
        if (countShipsLeft($game['yourShips'], $yourHitsSet) === 0) {
            $game['state'] = STATE_GAME_OVER;
            $game['winner'] = 'computer';
            $game['aiTargetQueue'] = [];
        } else {
            if ($difficulty !== 'easy') addNeighborsToTargetQueue($game, $r, $c);
            if (anyShipSunk($game)) $game['aiTargetQueue'] = [];
            $game['state'] = STATE_COMPUTER_TURN;
        }
    } else {
        $game['yourMisses'][] = $k;
        $game['state'] = STATE_PLAYER_TURN;
    }
}

// ----- Scoreboard (persistent JSON + session backup) -----
function loadScoreboard() {
    global $SCOREBOARD_FILE;
    if (!empty($_SESSION['scoreboard']) && is_array($_SESSION['scoreboard'])) {
        return $_SESSION['scoreboard'];
    }
    if (!file_exists($SCOREBOARD_FILE)) return [];
    $raw = @file_get_contents($SCOREBOARD_FILE);
    if ($raw === false) return [];
    $data = @json_decode($raw, true);
    $data = is_array($data) ? $data : [];
    $_SESSION['scoreboard'] = $data;
    return $data;
}

function saveScoreboard($entries) {
    global $SCOREBOARD_FILE;
    $_SESSION['scoreboard'] = $entries;
    @file_put_contents($SCOREBOARD_FILE, json_encode($entries, JSON_PRETTY_PRINT), LOCK_EX);
}

function recordScoreboardResult($playerName, $result) {
    $name = trim($playerName) ?: 'Player';
    $entries = loadScoreboard();
    $found = false;
    foreach ($entries as &$e) {
        if ($e['name'] === $name) {
            $e['wins'] = (int)($e['wins'] ?? 0) + ($result === 'win' ? 1 : 0);
            $e['losses'] = (int)($e['losses'] ?? 0) + ($result === 'loss' ? 1 : 0);
            $found = true;
            break;
        }
    }
    if (!$found) {
        $entries[] = [
            'name' => $name,
            'wins' => $result === 'win' ? 1 : 0,
            'losses' => $result === 'loss' ? 1 : 0,
        ];
    }
    saveScoreboard($entries);
}

// ----- Routing -----
$endpoint = $_GET['endpoint'] ?? $_POST['endpoint'] ?? '';

// Prefer session so state persists even when JSON file can't be written (XAMPP permissions)
$game = null;
if (!empty($_SESSION['game']) && is_array($_SESSION['game'])) {
    $game = $_SESSION['game'];
    $game['yourShips'] = isset($game['yourShips']) && is_array($game['yourShips']) ? $game['yourShips'] : [];
    $game['enemyShips'] = isset($game['enemyShips']) && is_array($game['enemyShips']) ? $game['enemyShips'] : [];
    $game['yourHits'] = isset($game['yourHits']) && is_array($game['yourHits']) ? $game['yourHits'] : [];
    $game['yourMisses'] = isset($game['yourMisses']) && is_array($game['yourMisses']) ? $game['yourMisses'] : [];
    $game['enemyHits'] = isset($game['enemyHits']) && is_array($game['enemyHits']) ? $game['enemyHits'] : [];
    $game['enemyMisses'] = isset($game['enemyMisses']) && is_array($game['enemyMisses']) ? $game['enemyMisses'] : [];
    if (!isset($game['aiTargetQueue']) || !is_array($game['aiTargetQueue'])) $game['aiTargetQueue'] = [];
    if (empty($game['difficulty'])) $game['difficulty'] = 'medium';
}
if ($game === null) {
    $game = loadState($STATE_FILE);
}

if ($endpoint === 'scoreboard') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(['scoreboard' => loadScoreboard()]);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = $input['playerName'] ?? $input['player_name'] ?? 'Player';
        $result = $input['result'] ?? '';
        if ($result === 'win' || $result === 'loss') {
            recordScoreboardResult($name, $result);
        }
        echo json_encode(['ok' => true, 'scoreboard' => loadScoreboard()]);
        exit;
    }
}

if ($game === null) {
    $game = [
        'state' => STATE_SETUP,
        'winner' => null,
        'yourShips' => [],
        'enemyShips' => placeEnemyShips(),
        'yourHits' => [],
        'yourMisses' => [],
        'enemyHits' => [],
        'enemyMisses' => [],
        'aiTargetQueue' => [],
        'difficulty' => 'medium',
    ];
    saveState($game);
}
if ($game['state'] === STATE_SETUP && empty($game['enemyShips'])) {
    $game['enemyShips'] = placeEnemyShips();
    saveState($game);
}
$_SESSION['game'] = $game;

if ($endpoint === 'game') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        echo json_encode(clientState($game));
        exit;
    }
}

if ($endpoint === 'game_new' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $difficulty = $input['difficulty'] ?? 'medium';
    if (!in_array($difficulty, ['easy', 'medium', 'hard'], true)) $difficulty = 'medium';
    $game = [
        'state' => STATE_SETUP,
        'winner' => null,
        'yourShips' => [],
        'enemyShips' => placeEnemyShips(),
        'yourHits' => [],
        'yourMisses' => [],
        'enemyHits' => [],
        'enemyMisses' => [],
        'aiTargetQueue' => [],
        'difficulty' => $difficulty,
    ];
    saveState($game);
    echo json_encode(clientState($game));
    exit;
}

if ($endpoint === 'game_restart' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (count($game['yourShips']) !== 3 || empty($game['enemyShips'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot restart: place ships and start a game first']);
        exit;
    }
    $game['state'] = STATE_PLAYER_TURN;
    $game['winner'] = null;
    $game['yourHits'] = [];
    $game['yourMisses'] = [];
    $game['enemyHits'] = [];
    $game['enemyMisses'] = [];
    $game['aiTargetQueue'] = [];
    saveState($game);
    echo json_encode(clientState($game));
    exit;
}

if ($endpoint === 'game_place' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($game['state'] !== STATE_SETUP) {
        http_response_code(400);
        echo json_encode(['error' => 'Placement only allowed in SETUP']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $ships = $input['ships'] ?? [];
    $validation = validatePlacement($ships);
    if (!$validation['ok']) {
        http_response_code(400);
        echo json_encode(['error' => $validation['message']]);
        exit;
    }
    $game['yourShips'] = $ships;
    $game['state'] = STATE_PLAYER_TURN;
    saveState($game);
    echo json_encode(clientState($game));
    exit;
}

// Run any pending computer turn(s) — e.g. after page load if state was left as COMPUTER_TURN
if ($endpoint === 'game_run_computer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    while ($game['state'] === STATE_COMPUTER_TURN) {
        runComputerTurn($game);
        saveState($game);
    }
    echo json_encode(clientState($game));
    exit;
}

if ($endpoint === 'game_fire' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // If server was stuck in COMPUTER_TURN (e.g. save failed), run computer turn(s) now then accept fire
    while ($game['state'] === STATE_COMPUTER_TURN) {
        runComputerTurn($game);
        saveState($game);
    }
    if ($game['state'] !== STATE_PLAYER_TURN) {
        http_response_code(400);
        echo json_encode(['error' => 'Fire only allowed on your turn']);
        exit;
    }
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $r = isset($input['row']) ? (int)$input['row'] : -1;
    $c = isset($input['col']) ? (int)$input['col'] : -1;
    if ($r < 0 || $r >= GRID_SIZE || $c < 0 || $c >= GRID_SIZE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid cell']);
        exit;
    }
    $k = cellKey($r, $c);
    if (in_array($k, $game['enemyHits']) || in_array($k, $game['enemyMisses'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Already fired at this cell']);
        exit;
    }

    $hit = false;
    foreach ($game['enemyShips'] as $ship) {
        foreach ($ship['cells'] as $cell) {
            if ($cell['row'] === $r && $cell['col'] === $c) {
                $hit = true;
                break 2;
            }
        }
    }

    if ($hit) {
        $game['enemyHits'][] = $k;
        $enemyHitsSet = array_flip($game['enemyHits']);
        if (countShipsLeft($game['enemyShips'], $enemyHitsSet) === 0) {
            $game['state'] = STATE_GAME_OVER;
            $game['winner'] = 'player';
            saveState($game);
            echo json_encode(clientState($game));
            exit;
        }
        $game['state'] = STATE_PLAYER_TURN;
        saveState($game);
        echo json_encode(clientState($game));
        exit;
    }

    $game['enemyMisses'][] = $k;
    $game['state'] = STATE_COMPUTER_TURN;

    while ($game['state'] === STATE_COMPUTER_TURN) {
        runComputerTurn($game);
        saveState($game);
    }

    echo json_encode(clientState($game));
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown endpoint or method']);
