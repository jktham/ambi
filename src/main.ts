import { Engine } from "./engine";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const engine = new Engine(canvas);
await engine.run();
