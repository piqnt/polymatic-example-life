import { Middleware } from "polymatic";
import { MainContext } from "./Main";
import { Cell } from "./Simulation";

/**
 * Editor middleware to handle user interactions for toggling cell states.
 */
export class Editor extends Middleware<MainContext> {
  blinkCell: Cell | null = null;
  blinkTimeout = 0;
  blinkInterval = 800; // ms
  blinkDebounce = 200; // ms

  constructor() {
    super();
    this.on("frame-update", this.handleFrameUpdate);
    this.on("cell-pointer-down", this.handlePointerDown);
    this.on("cell-pointer-up", this.handlePointerUp);
    this.on("cell-pointer-move", this.handlePointerMove);
  }

  handleFrameUpdate = ({ dt }: { dt: number }) => {
    if (!this.context.paused) return;
    // Handle blinking of last toggled cell
    this.blinkTimeout -= dt;
    if (this.blinkTimeout <= 0) {
      this.blinkTimeout = this.blinkInterval;
      this.toggleCell(this.blinkCell);
    }
  };

  handlePointerDown = (e: { cell: Cell }) => {
    this.context.paused = true;
    this.setBlinkCell(e.cell);
  };

  handlePointerMove = (e: { cell: Cell }) => {
    this.setBlinkCell(e.cell);
  };

  handlePointerUp = () => {
    this.context.paused = false;
  };

  setBlinkCell = (cell: Cell) => {
    const sameCell = this.blinkCell === cell;
    this.blinkCell = cell;
    if (!sameCell) {
      // Reset blink timer
      this.blinkTimeout = this.blinkDebounce;
    }
  };

  toggleCell = (cell: Cell) => {
    if (cell) {
      cell.alive = !cell.alive;
    }
  };
}
