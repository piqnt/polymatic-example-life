import * as Stage from "stage-js";

import { Middleware } from "polymatic";
import { FrameLoop } from "./FrameLoop";
import { Loader } from "./Loader";
import { Cell, GameOfLife } from "./GameOfLife";
import { Renderer } from "./Renderer";

export interface MainContext {
  stage?: Stage.Root;
  cells?: Cell[];
  paused?: boolean;
  columns?: number;
  rows?: number;
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new Loader());
    this.use(new GameOfLife());
    this.use(new Renderer());
  }
}
