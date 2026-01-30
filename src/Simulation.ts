import { Middleware } from "polymatic";
import { MainContext } from "./Main";

export interface Cell {
  i: number;
  j: number;
  alive: boolean;
  buffer: boolean;
}

/**
 * Simulation middleware to manage the state and evolution of the cellular automaton.
 */
export class Simulation extends Middleware<MainContext> {
  stepTimeout = 0;
  stepInterval = 100; // ms

  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("frame-update", this.handleFrameUpdate);
  }

  handleActivate = () => {
    this.context.paused = false;
    this.initializeGrid();
    this.emit("grid-ready");
  };

  initializeGrid = () => {
    this.context.grid = [];
    for (let j = 0; j < this.context.rows; j++) {
      this.context.grid[j] = [];
      for (let i = 0; i < this.context.columns; i++) {
        const alive = Math.random() > 0.7; // random initial state
        this.context.grid[j][i] = { i, j, alive, buffer: alive };
      }
    }
  };

  handleFrameUpdate = ({ dt }: { dt: number }) => {
    if (this.context.paused) return;
    // Life simulation update
    this.stepTimeout -= dt;
    if (this.stepTimeout <= 0) {
      this.stepTimeout = this.stepInterval;
      this.stepSimulation();
    }
  };

  stepSimulation = () => {
    for (let j = 0; j < this.context.rows; j++) {
      for (let i = 0; i < this.context.columns; i++) {
        const cell = this.context.grid[j][i];
        const neighbors = this.countNeighbors(i, j);
        if (cell.alive) {
          // was alive, stay alive if 2 or 3 neighbors
          cell.buffer = neighbors === 2 || neighbors === 3;
        } else {
          // was dead, live if exactly 3 neighbors
          cell.buffer = neighbors === 3;
        }
      }
    }

    // copy buffer to grid
    for (let j = 0; j < this.context.rows; j++) {
      for (let i = 0; i < this.context.columns; i++) {
        const cell = this.context.grid[j][i];
        cell.alive = cell.buffer;
      }
    }
  };

  countNeighbors = (i: number, j: number): number => {
    let count = 0;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni >= 0 && ni < this.context.columns && nj >= 0 && nj < this.context.rows) {
          if (this.context.grid[nj][ni].alive) count++;
        }
      }
    }
    return count;
  };
}
