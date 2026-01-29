import { Middleware } from "polymatic";
import { MainContext } from "./Main";

export interface Cell {
  i: number;
  j: number;
  alive: boolean;
}

export class GameOfLife extends Middleware<MainContext> {
  grid: boolean[][];
  buffer: boolean[][];

  stepTimeout = 0;
  stepInterval = 100; // ms

  blinkCell: Cell | null = null;
  blinkTimeout = 0;
  blinkInterval = 800; // ms
  blinkDebounce = 200; // ms

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("frame-update", this.handleFrameUpdate);
    this.on("user-cell-toggle", this.handleCellToggle);
  }

  handleActivate = () => {
    this.context.cells = [];
    this.context.paused = false;
    this.initializeGrid();
    this.emit("grid-ready");
  };

  initializeGrid = () => {
    this.grid = [];
    this.buffer = [];
    this.context.cells = [];
    for (let j = 0; j < this.context.rows; j++) {
      this.grid[j] = [];
      this.buffer[j] = [];
      for (let i = 0; i < this.context.columns; i++) {
        const alive = Math.random() > 0.7; // random initial state
        this.grid[j][i] = alive;
        this.context.cells.push({ i: i, j: j, alive });
      }
    }
  };

  handleFrameUpdate = ({ dt }: { dt: number }) => {
    if (this.context.paused) {
      // Handle blinking of last toggled cell
      this.blinkTimeout -= dt;
      if (this.blinkTimeout <= 0) {
        this.blinkTimeout = this.blinkInterval;
        this.toggleCell(this.blinkCell);
      }
    } else {
      // Life simulation update
      this.stepTimeout -= dt;
      if (this.stepTimeout <= 0) {
        this.stepTimeout = this.stepInterval;
        this.updateGrid();
      }
    }
  };

  handleCellToggle = (cell: Cell) => {
    const sameCell = this.blinkCell === cell;
    this.blinkCell = cell;
    if (!sameCell) {
      // Reset blink timer
      this.blinkTimeout = this.blinkDebounce;
    }
  };

  toggleCell = (cell: Cell) => {
    if (cell) {
      this.grid[cell.j][cell.i] = !this.grid[cell.j][cell.i];
      cell.alive = this.grid[cell.j][cell.i];
    }
  };

  updateGrid = () => {
    for (let j = 0; j < this.context.rows; j++) {
      for (let i = 0; i < this.context.columns; i++) {
        const neighbors = this.countNeighbors(i, j);
        if (this.grid[j][i]) {
          // was alive, stay alive if 2 or 3 neighbors
          this.buffer[j][i] = neighbors === 2 || neighbors === 3;
        } else {
          // was dead, live if exactly 3 neighbors
          this.buffer[j][i] = neighbors === 3;
        }
      }
    }

    // copy buffer to grid
    for (let j = 0; j < this.context.rows; j++) {
      for (let i = 0; i < this.context.columns; i++) {
        this.grid[j][i] = this.buffer[j][i];
      }
    }

    // update cells
    for (let c = 0; c < this.context.cells.length; c++) {
      const cell = this.context.cells[c];
      cell.alive = this.grid[cell.j][cell.i];
    }
  };

  countNeighbors = (i: number, j: number): number => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = i + dx;
        const ny = j + dy;
        if (nx >= 0 && nx < this.context.columns && ny >= 0 && ny < this.context.rows) {
          if (this.grid[ny][nx]) count++;
        }
      }
    }
    return count;
  };
}
