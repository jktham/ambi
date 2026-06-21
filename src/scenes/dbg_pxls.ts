import { Scene } from "../scene";
import { Entity } from "../entity";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class DebugPixelsScene extends Scene {
	name = "dbg_pxls";

	resolution = new Vec2(96, 54);
	
	init() {
		this.entities = [];

		let obj = new Entity();
		obj.model = Mat4.trs(new Vec3(0, 0, -1.5), new Vec3(), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/test_pixels.frag.wgsl";
		this.entities.push(obj);
	}
}
