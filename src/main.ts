import { Renderer } from "./renderer";

const canvas = document.getElementById("GLCanvas") as HTMLCanvasElement

const render = new Renderer(canvas)
render.init()
