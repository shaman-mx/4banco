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

// Cấu hình các bàn cờ blocked
const BOARD_CONFIGS = {
  default: [],
  board1: ['A1','A2','A7','A8','B1','B2','B7','B8','G1','G2','G7','G8','H1','H2','H7','H8'],
  board2: ['B2','G2','B7','G7'],
  board3: ['A1','A2','A7','A8','B1','B8','G1','G8','H1','H2','H7','H8']
};

// --- Khởi tạo bàn cờ ---
function initGrid(boardName=currentBoard) {
  currentBoard = boardName;
  grid = Array(SIZE).fill().map(() => Array(SIZE).fill(null));

  // Đặt quân mặc định
  grid[3][3] = 'white';
  grid[4][4] = 'white';
  grid[3][4] = 'black';
  grid[4][3] = 'black';

  // Block các ô
  const blocked = BOARD_CONFIGS[boardName];
  for(let label of blocked){
    const row = label.charCodeAt(0)-65;
    const col = parseInt(label[1])-1;
    grid[row][col] = 'blocked';
  }

  currentTurn = humanFirst ? playerColor : aiColor;
  renderBoard();
  updateScore();
  highlightMoves();

  if (currentTurn === aiColor && validMoves(aiColor).length > 0) {
    setTimeout(() => aiPlay(), 100);
  }

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
  currentTurn = aiColor;
  highlightMoves();
  if (validMoves(aiColor).length > 0) {
    setTimeout(() => aiPlay(), 100);
  } else {
    currentTurn = playerColor;
    highlightMoves();
  }
}

// --- AI đi ---
async function aiPlay() {
  const depth = parseInt(depthSelect.value);
  const res = await fetch("/ai_move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grid, depth, aiColor })
  });
  const data = await res.json();
  const move = data.move;
  if (!move) { currentTurn = playerColor; highlightMoves(); return; }
  const moves = validMoves(aiColor);
  const m = moves.find(m => m.x === move[0] && m.y === move[1]);
  if (!m) { currentTurn = playerColor; highlightMoves(); return; }
  applyMove(m.x, m.y, aiColor, m.flips);
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

// --- Thumbnail 2x2 ---
function renderThumbs(){
  const thumbs = document.querySelectorAll('.thumb');
  thumbs.forEach(t=>{
    const boardName = t.dataset.board;
    const blocked = BOARD_CONFIGS[boardName];
    t.innerHTML = '';
    const size = 20; // mỗi ô thumbnail 15px
    const canvas = document.createElement('canvas');
    canvas.width = size*2;
    canvas.height = size*2;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#107010';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const positions = [[0,0],[1,0],[0,1],[1,1]]; // 2x2 góc trên bên trái
    positions.forEach(([col,row])=>{
      const label = String.fromCharCode(65+row) + (col+1);
      if(blocked.includes(label)){
        ctx.fillStyle = '#d9543f';
        ctx.fillRect(col*size,row*size,size,size);
      } else {
        // Vẽ quân mặc định nếu rơi vào vị trí 2x2
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

// --- Chọn bàn cờ bằng thumbnail ---
document.querySelectorAll('.thumb').forEach(el=>{
  el.onclick=()=>{
    document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('selected'));
    el.classList.add('selected');
    initGrid(el.dataset.board);
  }
});
// --- Khởi tạo lần đầu ---
document.addEventListener('DOMContentLoaded', () => {
  // Chọn thumbnail mặc định
  const defaultThumb = document.querySelector('.thumb[data-board="default"]');
  if(defaultThumb) defaultThumb.classList.add('selected');
  
  // Render bàn cờ mặc định
  initGrid('default');
});