from flask import Flask, render_template, request, jsonify
import math
import copy
import os

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ai_move', methods=['POST'])
def ai_move():
    data = request.get_json()
    grid = data['grid']
    depth = data.get('depth', 3)
    ai_color = data.get('aiColor', 'white')  # Nhận màu AI từ client
    move = best_move(grid, ai_color, depth)
    return jsonify({'move': move})

# --- GAME LOGIC ---

SIZE = 8
DIRECTIONS = [
    (1, 0), (-1, 0), (0, 1), (0, -1),
    (1, 1), (1, -1), (-1, 1), (-1, -1)
]

# Trọng số vị trí cho AI đánh giá
WEIGHTS = [
    [50, -5, 10, 5, 5, 10, -5, 50],
    [-5, -10, 1, 1, 1, 1, -10, -5],
    [10, 1, 5, 2, 2, 5, 1, 10],
    [5, 1, 2, 1, 1, 2, 1, 5],
    [5, 1, 2, 1, 1, 2, 1, 5],
    [10, 1, 5, 2, 2, 5, 1, 10],
    [-5, -10, 1, 1, 1, 1, -10, -5],
    [50, -5, 10, 5, 5, 10, -5, 50]
]

def find_flips(grid, x, y, color):
    if grid[y][x]:
        return []
    flips = []
    for dx, dy in DIRECTIONS:
        nx, ny = x + dx, y + dy
        temp = []
        while 0 <= nx < SIZE and 0 <= ny < SIZE:
            p = grid[ny][nx]
            if not p or p == 'blocked':
                break
            if p == color:
                if temp:
                    flips += temp
                break
            temp.append((nx, ny))
            nx += dx
            ny += dy
    return flips

def valid_moves(grid, color):
    moves = []
    for y in range(SIZE):
        for x in range(SIZE):
            if not grid[y][x] and find_flips(grid, x, y, color):
                moves.append((x, y))
    return moves

def apply_move(grid, x, y, color):
    new_grid = copy.deepcopy(grid)
    flips = find_flips(new_grid, x, y, color)
    if not flips:
        return new_grid
    new_grid[y][x] = color
    for fx, fy in flips:
        new_grid[fy][fx] = color
    return new_grid

def score(grid):
    """Score thông minh cho AI: dựa trên vị trí và block."""
    total = 0
    for y in range(SIZE):
        for x in range(SIZE):
            cell = grid[y][x]
            weight = WEIGHTS[y][x]
            if cell == 'white':
                total += weight
            elif cell == 'black':
                total -= weight
            # ô blocked = 0
    return total

def best_move(grid, color, depth):
    moves = valid_moves(grid, color)
    if not moves:
        return None
    best_val = -math.inf if color == 'white' else math.inf
    best = None
    for (x, y) in moves:
        new_grid = apply_move(grid, x, y, color)
        val = minimax(new_grid, depth - 1, False, color, -math.inf, math.inf)
        if color == 'white':
            if val > best_val:
                best_val = val
                best = (x, y)
        else:  # AI màu đen
            if val < best_val:
                best_val = val
                best = (x, y)
    return best

def minimax(grid, depth, maximizing, color, alpha, beta):
    opp = 'black' if color == 'white' else 'white'

    if depth == 0:
        return score(grid)

    moves = valid_moves(grid, color if maximizing else opp)
    if not moves:
        return score(grid)

    if maximizing:
        value = -math.inf
        for (x, y) in moves:
            new_grid = apply_move(grid, x, y, color)
            value = max(value, minimax(new_grid, depth - 1, False, color, alpha, beta))
            alpha = max(alpha, value)
            if alpha >= beta:
                break
        return value
    else:
        value = math.inf
        for (x, y) in moves:
            new_grid = apply_move(grid, x, y, opp)
            value = min(value, minimax(new_grid, depth - 1, True, color, alpha, beta))
            beta = min(beta, value)
            if alpha >= beta:
                break
        return value

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 81))
    app.run(host='0.0.0.0', port=port)