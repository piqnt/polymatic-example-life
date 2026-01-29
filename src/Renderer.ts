import * as Stage from "stage-js";

import { Binder, Driver, Memo, Middleware } from "polymatic";

import { type MainContext } from "./Main";
import { type Cell } from "./GameOfLife";

export class Renderer extends Middleware<MainContext> {
  board: Stage.Component;
  pointerDown = false;

  constructor() {
    super();
    this.on("stage-ready", this.handleStageReady);
    this.on("frame-render", this.handleFrameUpdate);
  }

  handleStageReady = () => {
    const stage = this.context.stage;
    stage.viewbox(this.context.columns * 10 + 20, this.context.rows * 10 + 20);
    stage.background("#222");

    this.board = Stage.component();
    this.board.appendTo(stage);
    this.board.pin({
      width: this.context.columns * 10,
      height: this.context.rows * 10,
      handle: 0.5,
      align: 0.5,
    });

    this.board.on(Stage.POINTER_DOWN, this.handlePointerDown);
    this.board.on(Stage.POINTER_UP, this.handlePointerUp);
    this.board.on(Stage.POINTER_MOVE, this.handlePointerMove);
    this.board.on(Stage.POINTER_CANCEL, this.handlePointerUp);
  };

  handleFrameUpdate = () => {
    this.binder.data(this.context.cells);
  };

  handlePointerDown = (event: { x: number; y: number }) => {
    this.context.paused = true;
    this.pointerDown = true;

    this.toggleCellAt(event.x, event.y);
  };

  handlePointerUp = () => {
    this.pointerDown = false;
    this.context.paused = false;
  };

  handlePointerMove = (event: { x: number; y: number }) => {
    if (this.pointerDown) {
      this.toggleCellAt(event.x, event.y);
    }
  };

  toggleCellAt = (x: number, y: number) => {
    const i = Math.floor(x / 10);
    const j = Math.floor(y / 10);

    if (i >= 0 && i < this.context.columns && j >= 0 && j < this.context.rows) {
      // Find the cell at this position
      const cell = this.context.cells.find((c) => c.i === i && c.j === j);
      if (cell) {
        this.emit("user-cell-toggle", cell);
      }
    }
  };

  driver = Driver.create<Cell, CellComponent>({
    filter: (cell) => true,
    enter: (cell) => {
      const component = new CellComponent();
      component.appendTo(this.board);
      component.pin({
        offsetX: cell.i * 10,
        offsetY: cell.j * 10,
      });
      return component;
    },
    update: (cell, component) => {
      component.setState(cell.alive);
    },
    exit: (cell, component) => {
      component.remove();
    },
  });

  binder = Binder.create<Cell>({
    key: (obj) => obj.j + "," + obj.i,
    drivers: [this.driver],
  });
}

class CellComponent extends Stage.Sprite {
  stateMemo = Memo.init();

  constructor() {
    super();
    this.texture("cell");
  }

  setState(alive: boolean) {
    if (this.stateMemo.update(alive)) {
      this.tween(200)
        .ease("exp-out")
        .alpha(alive ? 1 : 0.1);
    }
  }
}
