import * as Stage from "stage-js";

import { Middleware } from "polymatic";
import { FrameLoop } from "./FrameLoop";
import { Loader } from "./Loader";
import { Cell, Simulation } from "./Simulation";
import { Renderer } from "./Renderer";
import { Editor } from "./Editor";

export interface MainContext {
  stage?: Stage.Root;
  grid: Cell[][];
  paused?: boolean;
  columns?: number;
  rows?: number;
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new Loader());
    this.use(new Simulation());
    this.use(new Editor());
    this.use(new Renderer());
  }
}
