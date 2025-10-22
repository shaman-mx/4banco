# ai_modules/search.py
# Minimax with alpha-beta, transposition table (simple), iterative deepening (wrapper)

import math
import time
from .util import opponent
from .eval_fn import evaluate

# Simple transposition table using zobrist-like integer key
# We use Python string of board for key (cheap, but OK). Can be optimized.

def board_key(board):
    # small stringify; faster keys can be bitboard + zobrist
    return tuple(tuple(row) for row in board.grid)

class Searcher:
    def __init__(self, time_limit=None):
        self.tt = {}  # transposition table: key -> (depth, value)
        self.nodes = 0
        self.time_limit = time_limit
        self.start_time = None

    def time_exceeded(self):
        if self.time_limit is None:
            return False
        return (time.time() - self.start_time) > self.time_limit

    def negamax(self, board, color, depth, alpha, beta):
        # Returns value, best_move (dict or None)
        self.nodes += 1
        if self.time_exceeded():
            raise TimeoutError()

        key = board_key(board)
        tt_entry = self.tt.get(key)
        if tt_entry and tt_entry[0] >= depth:
            return tt_entry[1], None

        # Terminal or depth == 0
        moves = board.legal_moves(color)
        if depth == 0 or not moves:
            val = evaluate(board, color)
            self.tt[key] = (depth, val)
            return val, None

        best_val = -math.inf
        best_move = None

        # Move ordering: prefer corners first
        def score_move(m):
            if (m['x'], m['y']) in {(0,0),(0,7),(7,0),(7,7)}:
                return 1000
            return len(m['flips'])
        moves.sort(key=score_move, reverse=True)

        for m in moves:
            nb = board.clone()
            nb.apply_move(m['x'], m['y'], color, m['flips'])
            v, _ = self.negamax(nb, opponent(color), depth-1, -beta, -alpha)
            v = -v
            if v > best_val:
                best_val = v
                best_move = m
            alpha = max(alpha, v)
            if alpha >= beta:
                break

        self.tt[key] = (depth, best_val)
        return best_val, best_move

    def iterative_deepening(self, board, color, max_depth, time_limit=None):
        self.time_limit = time_limit
        self.start_time = time.time()
        best = None
        for d in range(1, max_depth+1):
            try:
                val, move = self.negamax(board, color, d, -math.inf, math.inf)
                if move is not None:
                    best = (move, val, d)
            except TimeoutError:
                break
        return best  # (move, val, depth) or None