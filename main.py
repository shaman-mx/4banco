from flask import Flask, render_template, request, jsonify
import copy
import os

app = Flask(__name__)

SIZE = 8
DIRECTIONS = [
    (1, 0), (-1, 0), (0, 1), (0, -1),
    (1, 1), (1, -1), (-1, 1), (-1, -1)
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ai_move', methods=['POST'])
def ai_move():
    data = request.get_json()
    grid = data['grid']
    depth = data.get('depth', 3)
    ai_color = data.get('aiColor', 'white')  # lấy màu AI từ client
    move = best_move(grid, ai_color, depth)
    return jsonify({'move': move})

def find_flips(grid, x, y, color):
    if grid[y][x]:
        return []
    flips = []
    for dx, dy in DIRECTIONS:
        nx, ny = x + dx, y + dy
        temp = []
        while 0 <= nx < SIZE and 0 <= ny < SIZE:
            p = grid[ny][nx]
            if not p:
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
            flips = find_flips(grid, x, y, color)
            if flips:
                moves.append({'x': x, 'y': y, 'flips': flips})
    return moves

def apply_move(grid, x, y, color, flips):
    new_grid = copy.deepcopy(grid)
    new_grid[y][x] = color
    for fx, fy in flips:
        new_grid[fy][fx] = color
    return new_grid

def score_grid(grid, color):
    return sum(row.count(color) for row in grid)

def opposite(color):
    return 'black' if color == 'white' else 'white'

def minimax(grid, color, depth, maximizing):
    moves = valid_moves(grid, color)
    if depth == 0 or not moves:
        return score_grid(grid, color) - score_grid(grid, opposite(color)), None

    best_move = None
    if maximizing:
        max_eval = -float('inf')
        for m in moves:
            new_grid = apply_move(grid, m['x'], m['y'], color, m['flips'])
            eval_score, _ = minimax(new_grid, opposite(color), depth-1, False)
            if eval_score > max_eval:
                max_eval = eval_score
                best_move = (m['x'], m['y'])
        return max_eval, best_move
    else:
        min_eval = float('inf')
        for m in moves:
            new_grid = apply_move(grid, m['x'], m['y'], color, m['flips'])
            eval_score, _ = minimax(new_grid, opposite(color), depth-1, True)
            if eval_score < min_eval:
                min_eval = eval_score
                best_move = (m['x'], m['y'])
        return min_eval, best_move

def best_move(grid, color, depth=3):
    _, move = minimax(grid, color, depth, True)
    return move

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)