const SIZE = 8;
let boardEl = document.getElementById('board');
let depthSelect = document.getElementById('depthSelect');
let whiteScoreEl = document.getElementById('whiteScore');
let blackScoreEl = document.getElementById('blackScore');

let playerColor = 'black';
let aiColor = 'white';
let humanFirst = true;
let grid = [];
let currentTurn = 'black';

// --- Khởi tạo bàn cờ ---
function initGrid() {
  grid = Array(SIZE).fill().map(() => Array(SIZE).fill(null));
  grid[3][3] = 'white';
  grid[4][4] = 'white';
  grid[3][4] = 'black';
  grid[4][3] = 'black';

  currentTurn = humanFirst ? playerColor : aiColor;

  renderBoard();
  updateScore();
  highlightMoves();

  // Nếu AI đi trước và có nước đi hợp lệ, gọi AI
  if (currentTurn === aiColor && validMoves(aiColor).length > 0) {
    setTimeout(() => aiPlay(), 100);
  }
}

// --- Vẽ bàn cờ ---
function renderBoard() {
  boardEl.innerHTML = '';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (grid[y][x]) cell.classList.add(grid[y][x]);
      cell.onclick = () => handleMove(x, y);
      boardEl.appendChild(cell);
    }
  }
}

// --- Cập nhật điểm ---
function updateScore() {
  let white = 0, black = 0;
  for (let row of grid) {
    for (let c of row) {
      if (c === 'white') white++;
      if (c === 'black') black++;
    }
  }
  whiteScoreEl.textContent = white;
  blackScoreEl.textContent = black;
}

// --- Tìm nước đi hợp lệ ---
function validMoves(color) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const moves = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (grid[y][x]) continue;
      let flips = [];
      for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, temp = [];
        while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
          let p = grid[ny][nx];
          if (!p) break;
          if (p === color) { if (temp.length) flips.push(...temp); break; }
          temp.push([nx, ny]);
          nx += dx; ny += dy;
        }
      }
      if (flips.length) moves.push({ x, y, flips });
    }
  }
  return moves;
}

// --- Highlight nước đi ---
function highlightMoves() {
  const moves = validMoves(currentTurn);
  const cells = boardEl.children;
  for (let cell of cells) cell.classList.remove('highlight');
  for (let m of moves) {
    const index = m.y * SIZE + m.x;
    cells[index].classList.add('highlight');
  }
}

// --- Áp dụng nước đi ---
function applyMove(x, y, color, flips) {
  grid[y][x] = color;
  for (let [fx, fy] of flips) grid[fy][fx] = color;
  renderBoard();
  updateScore();
  highlightMoves();
}

// --- Người chơi click ---
async function handleMove(x, y) {
  if (currentTurn !== playerColor) return;

  const moves = validMoves(playerColor);
  const move = moves.find(m => m.x === x && m.y === y);
  if (!move) return;

  applyMove(x, y, playerColor, move.flips);

  // Chuyển lượt sang AI
  currentTurn = aiColor;
  highlightMoves();

  // Nếu AI có nước đi, gọi AI
  if (validMoves(aiColor).length > 0) {
    setTimeout(() => aiPlay(), 100);
  } else {
    // Nếu AI ko có nước đi, trả lại lượt cho người
    currentTurn = playerColor;
    highlightMoves();
  }
}

// --- AI đi ---
async function aiPlay() {
  const depth = parseInt(depthSelect.value);

  // Gọi server để lấy nước đi AI (minimax)
  const res = await fetch("/ai_move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grid, depth, aiColor })
  });
  const data = await res.json();
  const move = data.move;

  if (!move) {
    // Nếu AI ko có nước đi, trả lượt cho người
    currentTurn = playerColor;
    highlightMoves();
    return;
  }

  const moves = validMoves(aiColor);
  const m = moves.find(m => m.x === move[0] && m.y === move[1]);
  if (!m) {
    currentTurn = playerColor;
    highlightMoves();
    return;
  }

  applyMove(m.x, m.y, aiColor, m.flips);

  // Trả lượt cho người
  currentTurn = playerColor;
  highlightMoves();
}

// --- Chọn màu cờ ---
document.querySelectorAll('input[name="color"]').forEach(radio => {
  radio.addEventListener('change', e => {
    playerColor = e.target.value;
    aiColor = playerColor === 'black' ? 'white' : 'black';
    initGrid();
  });
});

// --- Toggle lượt đi trước ---
document.getElementById('toggleFirst').onclick = () => {
  humanFirst = !humanFirst;
  document.getElementById('toggleFirst').textContent =
    humanFirst ? "Người đi trước" : "AI đi trước";
  initGrid();
};

// --- Chơi lại ---
document.getElementById('reset').onclick = () => initGrid();

// --- Khởi tạo lần đầu ---
initGrid();