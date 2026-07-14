import { Scene } from "../scene";
import { Object } from "../object";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { CameraMode } from "../player";

export class DebugPixelScene extends Scene {
	name = "dbg_pixel";
	cameraMode: CameraMode = "static";

	resolution = new Vec2(96, 54);
	
	init() {
		this.entities = [];

		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0, -1), new Vec3(Math.PI/2.0, 0, 0), 2);
		obj.mesh = "quad.obj";
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/px_frame.frag.wgsl";
		this.entities.push(obj);
	}
}
