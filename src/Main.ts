import { type Application, type Container } from "pixi.js";

import { Middleware } from "polymatic";
import { FrameLoop } from "./FrameLoop";
import { PixiManager } from "./PixiManager";
import { Cell, Simulation } from "./Simulation";
import { Renderer } from "./Renderer";
import { Editor } from "./Editor";

export interface MainContext {
  pixi?: Application;
  scene?: Container;
  grid?: Cell[][];
  paused?: boolean;
  columns?: number;
  rows?: number;
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new FrameLoop());
    this.use(new PixiManager());
    this.use(new Simulation());
    this.use(new Editor());
    this.use(new Renderer());
  }
}
