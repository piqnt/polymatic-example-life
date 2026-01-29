import { Runtime } from "polymatic";

import { Main } from "./src/Main";

Runtime.activate(new Main(), {
  columns: screen.width / 40,
  rows: screen.height / 40,
});
