import * as Stage from "stage-js";

import { Middleware } from "polymatic";

import { type MainContext } from "./Main";

export class Loader extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
  }

  handleActivate = async () => {
    const cell = Stage.canvas();
    cell.setSize(10, 10);
    cell.setDrawer(function () {
      const ratio = this.getDevicePixelRatio();
      const ctx = this.getContext();
      this.setSize(10, 10, ratio);
      ctx.scale(ratio, ratio);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 10, 10);
    });

    await Stage.atlas({
      textures: {
        "cell": cell,
      },
    });

    this.context.stage = Stage.mount();

    this.emit("stage-ready");
  };
}
