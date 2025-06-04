import { Renderer } from "./renderer";

const canvas = document.getElementById("canvas") as HTMLCanvasElement

const render = new Renderer(canvas)
render.init()
