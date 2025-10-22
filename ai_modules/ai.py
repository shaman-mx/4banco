# ai_modules/ai.py

from .board import GridBoard
from .level import game_phase_from_board, depth_for_phase
from .search import Searcher
import time

def get_best_move_from_grid(js_grid, ai_color, requested_depth=4, time_limit=None):
    """
    js_grid: 2D list (grid[y][x]) with 'black'/'white'/None/'blocked'
    ai_color: 'black' or 'white'
    requested_depth: depth from UI
    time_limit: optional time limit per move in seconds
    returns: [x, y] or None
    """
    board = GridBoard(js_grid)
    phase = game_phase_from_board(board)
    depth = depth_for_phase(requested_depth, phase)
    searcher = Searcher(time_limit=time_limit)
    res = searcher.iterative_deepening(board, ai_color, depth, time_limit)
    if res is None:
        return None
    move, val, used_depth = res
    return [move['x'], move['y']]