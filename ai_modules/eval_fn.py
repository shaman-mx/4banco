# ai_modules/eval_fn.py
# Evaluation combining positional weights, mobility and parity

from .util import WEIGHTS, opponent

def positional_score(board, color):
    s = 0
    for y in range(8):
        for x in range(8):
            c = board.grid[y][x]
            if c == color:
                s += WEIGHTS[y][x]
            elif c == opponent(color):
                s -= WEIGHTS[y][x]
    return s

def mobility_score(board, color):
    my_moves = len(board.legal_moves(color))
    opp_moves = len(board.legal_moves(opponent(color)))
    if my_moves + opp_moves == 0:
        return 0
    return 100 * (my_moves - opp_moves) // (my_moves + opp_moves)

def parity_score(board, color):
    black, white = board.count()
    if color == 'black':
        return black - white
    else:
        return white - black

def evaluate(board, color):
    # composite evaluation, tuned for phases by weighting components
    phase = None
    # Light phase inference: count discs
    black, white = board.count()
    total = black + white
    if total <= 20:
        phase = 'early'
    elif total <= 50:
        phase = 'mid'
    else:
        phase = 'end'

    pos = positional_score(board, color)
    mob = mobility_score(board, color)
    par = parity_score(board, color)

    if phase == 'early':
        return pos * 2 + mob * 10 + par * 1
    elif phase == 'mid':
        return pos * 2 + mob * 12 + par * 2
    else:
        # endgame: parity (disc count) is dominant
        return par * 100 + pos * 1 + mob * 5