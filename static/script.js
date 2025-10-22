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
let currentBoard = 'default';
let lastAIMove = null; 
let history = []; 
let currentStyle = 'normal'; // normal = trắng–đen, reversed = đen–trắng

const BOARD_CONFIGS = {
  default: [],
  board1: ['A1','A2','A7','A8','B1','B2','B7','B8','G1','G2','G7','G8','H1','H2','H7','H8'],
  board2: ['B2','G2','B7','G7'],
  board3: ['A1','A2','A7','A8','B1','B8','G1','G8','H1','H2','H7','H8']
};

// --- Khởi tạo bàn cờ ---
function initGrid(boardName=currentBoard, style=currentStyle) {
  currentBoard = boardName;
  grid = Array(SIZE).fill().map(() => Array(SIZE).fill(null));
  history = [];

  // Đặt quân theo style
  if(style === 'normal') {
    grid[3][3] = 'white'; grid[4][4] = 'white';
    grid[3][4] = 'black'; grid[4][3] = 'black';
  } else {
    grid[3][3] = 'black'; grid[4][4] = 'black';
    grid[3][4] = 'white'; grid[4][3] = 'white';
  }

  // Block các ô
  const blocked = BOARD_CONFIGS[boardName];
  for(let label of blocked){
    const row = label.charCodeAt(0)-65;
    const col = parseInt(label[1])-1;
    grid[row][col] = 'blocked';
  }

  currentTurn = humanFirst ? playerColor : aiColor;
  lastAIMove = null;

  renderBoard();
  updateScore();
  highlightMoves();

  if (currentTurn === aiColor) aiPlay();
  renderThumbs();
}

// --- Vẽ bàn cờ ---
function renderBoard() {
  boardEl.innerHTML = '';
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if (grid[y][x] === 'black' || grid[y][x] === 'white') cell.classList.add(grid[y][x]);
      if (grid[y][x] === 'blocked') cell.classList.add('blocked');
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
      if (grid[y][x] !== null) continue;
      let flips = [];
      for (let [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy, temp = [];
        while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
          let p = grid[ny][nx];
          if (!p || p==='blocked') break;
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

// --- Highlight nước đi AI ---
function highlightLastAIMove(){
  if(!lastAIMove) return;
  const [x, y] = lastAIMove;
  const index = y * SIZE + x;
  const cells = boardEl.children;
  for(let cell of cells) cell.classList.remove('ai-last-move');
  cells[index].classList.add('ai-last-move');
}

// --- Áp dụng nước đi ---
function applyMove(x, y, color, flips, isInit=false) {
  if(!isInit){
    history.push({
      grid: grid.map(r => r.slice()), 
      turn: currentTurn,
      lastAIMove: lastAIMove ? [...lastAIMove] : null
    });
  }
  grid[y][x] = color;
  for (let [fx, fy] of flips) grid[fy][fx] = color;
  if(!isInit){
    lastAIMove = color === aiColor ? [x, y] : null;
  }
  renderBoard();
  updateScore();
  highlightMoves();
  if(!isInit) highlightLastAIMove();
}

// --- Người chơi click ---
async function handleMove(x, y) {
  if (currentTurn !== playerColor) return;
  const moves = validMoves(playerColor);
  const move = moves.find(m => m.x === x && m.y === y);
  if (!move) return;

  applyMove(x, y, playerColor, move.flips);
  currentTurn = aiColor;
  highlightMoves();

  if (validMoves(aiColor).length > 0) {
    setTimeout(() => aiPlay(), 100);
  } else {
    currentTurn = playerColor;
    highlightMoves();
    if (validMoves(playerColor).length === 0) gameOver();
  }
}

// --- AI đi ---
async function aiPlay() {
  const moves = validMoves(aiColor);
  if (moves.length === 0) {
    currentTurn = playerColor;
    highlightMoves();
    if (validMoves(playerColor).length === 0) gameOver();
    return;
  }

  const depth = parseInt(depthSelect.value);

  try {
    const res = await fetch("/ai_move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grid, depth, aiColor })
    });

    if (!res.ok) { alert("Server lỗi!"); return; }
    const data = await res.json();
    if (data.status === "error") { alert("AI lỗi: "+data.message); return; }

    const move = data.move;
    if (!move) { currentTurn = playerColor; highlightMoves(); return; }

    const m = moves.find(mv => mv.x === move[0] && mv.y === move[1]);
    if (!m) { currentTurn = playerColor; highlightMoves(); return; }

    applyMove(m.x, m.y, aiColor, m.flips);
    currentTurn = playerColor;
    highlightMoves();

    if (validMoves(playerColor).length === 0) {
      currentTurn = aiColor;
      if (validMoves(aiColor).length === 0) gameOver();
      else setTimeout(() => aiPlay(), 100);
    }
  } catch (err) {
    console.error("Kết nối /ai_move lỗi", err);
    alert("Không kết nối server!");
  }
}

// --- Game kết thúc ---
function gameOver() {
  const white = parseInt(whiteScoreEl.textContent);
  const black = parseInt(blackScoreEl.textContent);
  let msg;
  if (white > black) msg = `Trắng thắng ${white} - ${black}`;
  else if (black > white) msg = `Đen thắng ${black} - ${white}`;
  else msg = `Hòa ${white} - ${black}`;
  alert(msg);
}

// --- Undo ---
document.getElementById("undo").onclick = () => {
  if(history.length === 0) return;

  // Lùi lại 2 bước nếu có đủ, nếu không thì lùi 1 bước
  let steps = Math.min(2, history.length);
  for(let i=0; i<steps; i++){
    const lastState = history.pop();
    grid = lastState.grid.map(r => r.slice());
    currentTurn = lastState.turn;
    lastAIMove = lastState.lastAIMove;
  }

  renderBoard();
  updateScore();
  highlightMoves();
};

// --- Chọn màu cờ ---
const colorToggle = document.getElementById("colorToggle");
colorToggle.classList.add(playerColor);
colorToggle.textContent = playerColor === "black" ? "Đen" : "Trắng";
colorToggle.onclick = () => {
  [playerColor, aiColor] = [aiColor, playerColor];
  colorToggle.className = playerColor;
  colorToggle.textContent = playerColor === "black" ? "Đen" : "Trắng";
  initGrid(currentBoard, currentStyle);
};

// --- Toggle lượt đi trước ---
document.getElementById('toggleFirst').onclick = () => {
  humanFirst = !humanFirst;
  document.getElementById('toggleFirst').textContent =
    humanFirst ? "Người đi trước" : "AI đi trước";
  initGrid(currentBoard, currentStyle);
};

// --- Chơi lại ---
document.getElementById('reset').onclick = () => initGrid(currentBoard, currentStyle);

// --- Toggle style Trắng–Đen / Đen–Trắng ---
const styleToggle = document.getElementById("styleToggle");
styleToggle.textContent = "Đảo màu";
styleToggle.onclick = () => {
  currentStyle = currentStyle === 'normal' ? 'reversed' : 'normal';
  initGrid(currentBoard, currentStyle);
};

// --- Thumbnail ---
function renderThumbs() {
  const thumbs = document.querySelectorAll('.thumb');
  thumbs.forEach(t => {
    const boardName = t.dataset.board;
    const blocked = BOARD_CONFIGS[boardName];
    t.innerHTML = '';
    const size = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size*2; canvas.height = size*2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#107010';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const positions = [[0,0],[1,0],[0,1],[1,1]];
    positions.forEach(([col,row]) => {
      const label = String.fromCharCode(65+row) + (col+1);
      if(blocked.includes(label)){
        ctx.fillStyle = 'rgba(176,48,48,0.7)';
        ctx.fillRect(col*size,row*size,size,size);
      } else {
        if((row===3 && col===3)||(row===4 && col===4)){
          ctx.fillStyle='white';
          ctx.beginPath();
          ctx.arc(col*size+size/2,row*size+size/2,size/2-1,0,2*Math.PI);
          ctx.fill();
        } else if((row===3 && col===4)||(row===4 && col===3)){
          ctx.fillStyle='black';
          ctx.beginPath();
          ctx.arc(col*size+size/2,row*size+size/2,size/2-1,0,2*Math.PI);
          ctx.fill();
        }
      }
    });
    t.appendChild(canvas);
  });
}

document.querySelectorAll('.thumb').forEach(el => {
  el.onclick = () => {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
    initGrid(el.dataset.board, currentStyle);
  };
});

// --- Khởi tạo lần đầu ---
initGrid(currentBoard, currentStyle);