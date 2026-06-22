import { Scene } from "../scene";
import { Entity } from "../entity";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { CameraMode } from "../player";

export class DebugPixelsScene extends Scene {
	name = "dbg_pxls";
	cameraMode: CameraMode = "static";

	resolution = new Vec2(96, 54);
	
	init() {
		this.entities = [];

		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, 0, -1), new Vec3(Math.PI/2.0, 0, 0), 2);
		obj.mesh = "quad.obj";
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/test_pixels.frag.wgsl";
		this.entities.push(obj);
	}
}
