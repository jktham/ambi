import { Engine } from "./engine";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const params = new URLSearchParams(window.location.search);

const engine = new Engine(canvas);
engine.run(params.get("scene") || "pier");
