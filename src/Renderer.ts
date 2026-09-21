import { Container, Sprite, Texture, type FederatedPointerEvent } from "pixi.js";

import { Binder, Driver, Memo, Middleware } from "polymatic";
import { Easing, TransitionManager, type TransitionSelection } from "@piqnt/transition";

import { type MainContext } from "./Main";
import { type Cell } from "./Simulation";
import { type FrameLoopEvent } from "./FrameLoop";

const CELL_SIZE = 10;
const BOARD_MARGIN = 10;

/**
 * Renderer middleware to visualize the simulation grid and handle user input.
 */
export class Renderer extends Middleware<MainContext> {
  board: Container;
  pointerDown = false;
  transitionManager = new TransitionManager();

  constructor() {
    super();
    this.on("pixi-ready", this.handlePixiReady);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-render", this.handleFrameRender);
  }

  handlePixiReady = () => {
    const pixi = this.context.pixi;
    const scene = this.context.scene;

    // board is centered on the scene origin
    this.board = new Container();
    this.board.position.set((-this.context.columns * CELL_SIZE) / 2, (-this.context.rows * CELL_SIZE) / 2);
    scene.addChild(this.board);

    // receive pointer events anywhere on the screen, not just on cells
    pixi.stage.eventMode = "static";
    pixi.stage.hitArea = pixi.screen;
    pixi.stage.on("pointerdown", this.handlePointerDown);
    pixi.stage.on("pointermove", this.handlePointerMove);
    pixi.stage.on("pointerup", this.handlePointerUp);
    pixi.stage.on("pointerupoutside", this.handlePointerUp);

    pixi.renderer.on("resize", this.handleViewport);
    this.handleViewport();
  };

  handleDeactivate = () => {
    this.context.pixi?.renderer.off("resize", this.handleViewport);
  };

  /**
   * Fit the board with a margin inside the screen, and center scene origin on the screen.
   */
  handleViewport = () => {
    const pixi = this.context.pixi;
    const scene = this.context.scene;

    const screenWidth = pixi.screen.width;
    const screenHeight = pixi.screen.height;

    const viewboxWidth = this.context.columns * CELL_SIZE + BOARD_MARGIN * 2;
    const viewboxHeight = this.context.rows * CELL_SIZE + BOARD_MARGIN * 2;

    const scale = Math.min(screenWidth / viewboxWidth, screenHeight / viewboxHeight);
    scene.scale.set(scale);
    scene.position.set(screenWidth / 2, screenHeight / 2);
  };

  handleFrameRender = (ev: FrameLoopEvent) => {
    if (!this.board) return;
    this.binder.data(this.context.grid ? this.context.grid.flat() : []);
    this.transitionManager.update(ev.dt);
  };

  cellAt = (e: FederatedPointerEvent) => {
    const point = this.board.toLocal(e.global);
    const i = Math.floor(point.x / CELL_SIZE);
    const j = Math.floor(point.y / CELL_SIZE);
    return this.context.grid[j]?.[i];
  };

  handlePointerDown = (e: FederatedPointerEvent) => {
    this.pointerDown = true;
    this.emit("cell-pointer-down", { cell: this.cellAt(e) });
  };

  handlePointerUp = () => {
    if (this.pointerDown) {
      this.pointerDown = false;
      this.emit("cell-pointer-up");
    }
  };

  handlePointerMove = (e: FederatedPointerEvent) => {
    if (this.pointerDown) {
      this.emit("cell-pointer-move", { cell: this.cellAt(e) });
    }
  };

  driver = Driver.create<Cell, CellComponent>({
    filter: (cell) => true,
    enter: (cell) => {
      const component = new CellComponent();
      component.transition = this.transitionManager.select(component);
      component.position.set(cell.i * CELL_SIZE, cell.j * CELL_SIZE);
      this.board.addChild(component);
      return component;
    },
    update: (cell, component) => {
      component.setState(cell.alive);
    },
    exit: (cell, component) => {
      component.transition.stop();
      component.removeFromParent();
      component.destroy();
    },
  });

  binder = Binder.create<Cell>({
    key: (obj) => obj.j + "," + obj.i,
    drivers: [this.driver],
  });
}

class CellComponent extends Sprite {
  stateMemo = Memo.init();
  // selection of this component in the transition manager
  transition: TransitionSelection<Sprite>;

  constructor() {
    super(Texture.WHITE);
    this.width = CELL_SIZE;
    this.height = CELL_SIZE;
    this.alpha = 0.1;
  }

  setState(alive: boolean) {
    if (this.stateMemo.update(alive)) {
      this.transition
        .tween(200)
        .ease(Easing.expOut)
        .to({ alpha: alive ? 1 : 0.1 });
    }
  }
}
