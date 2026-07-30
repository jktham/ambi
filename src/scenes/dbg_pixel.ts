import { Scene } from "../scene";
import { Object } from "../object";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Assets } from "../assets";

export class DebugPixelScene extends Scene {
	constructor() {
		super();

		this.name = "dbg_pixel";
		this.resolution = new Vec2(96, 54);
		this.cameraMode = "static";

		this.preload = {
			shaders: ["world/px_frame.frag.wgsl"],
			meshes: ["quad.obj"],
		};
	}
	
	async init(assets: Assets) {
		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 0, -1), new Vec3(Math.PI/2.0, 0, 0), 2);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/px_frame.frag.wgsl");
		this.objects.push(obj);
	}
}
