# ai_modules/board.py
# Simple board wrapper to convert between JS grid (list of lists) and internal representation.
# Internal representation: 2D list grid[y][x] with values: None, 'black', 'white', 'blocked'

from copy import deepcopy

SIZE = 8

class GridBoard:
    def __init__(self, grid=None):
        if grid is None:
            self.grid = [[None]*SIZE for _ in range(SIZE)]
            # initial Othello position
            self.grid[3][3] = 'white'
            self.grid[4][4] = 'white'
            self.grid[3][4] = 'black'
            self.grid[4][3] = 'black'
        else:
            # deep copy of provided grid (expects JS-like grid)
            self.grid = deepcopy(grid)

    def clone(self):
        return GridBoard(self.grid)

    def in_bounds(self, x, y):
        return 0 <= x < SIZE and 0 <= y < SIZE

    def count(self):
        white = sum(1 for r in self.grid for c in r if c == 'white')
        black = sum(1 for r in self.grid for c in r if c == 'black')
        return black, white

    def is_full(self):
        for row in self.grid:
            for c in row:
                if c is None:
                    return False
        return True

    def to_js_grid(self):
        return deepcopy(self.grid)

    def apply_move(self, x, y, color, flips):
        # flips: list of (x,y)
        self.grid[y][x] = color
        for fx, fy in flips:
            self.grid[fy][fx] = color

    def legal_moves(self, color):
        # returns list of dicts: {'x':x,'y':y,'flips':[(fx,fy),...]}
        dirs = [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]
        moves = []
        for y in range(SIZE):
            for x in range(SIZE):
                if self.grid[y][x] is not None:
                    continue
                flips = []
                for dx, dy in dirs:
                    nx, ny = x + dx, y + dy
                    temp = []
                    while self.in_bounds(nx, ny):
                        p = self.grid[ny][nx]
                        if p is None or p == 'blocked':
                            break
                        if p == color:
                            if temp:
                                flips.extend(temp)
                            break
                        temp.append((nx, ny))
                        nx += dx; ny += dy
                if flips:
                    moves.append({'x': x, 'y': y, 'flips': flips})
        return moves