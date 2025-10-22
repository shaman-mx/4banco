# ai_modules/level.py
# Simple mapping from board phase -> default search depth
# You can expand to include MPC params etc.

def game_phase_from_board(board):
    # Input: GridBoard instance
    black, white = board.count()
    total = black + white
    # total discs small -> early; mid; end near full
    if total <= 20:
        return 'early'
    elif total <= 50:
        return 'mid'
    else:
        return 'end'

def depth_for_phase(requested_depth, phase):
    # Clamp / tune by phase. requested_depth from UI (1-7)
    # We allow UI depth but can enforce min for endgame
    if phase == 'early':
        return min(requested_depth, 5)
    elif phase == 'mid':
        return min(requested_depth, 6)
    else:
        # endgame can search deeper, but cap because Python slower
        return max(requested_depth, 3)  # ensure not too shallow for end