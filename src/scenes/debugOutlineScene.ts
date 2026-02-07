import { Scene, WorldObject } from "../scene";
import { PhongUniforms, PostOutlineUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class DebugOutlineScene extends Scene {
	name = "debug_outline";
	spawnPos = new Vec3(0, 0, 5);

	postShader = "post/outline.frag.wgsl";
	resolution = new Vec2(1920, 1080);

	constructor() {
		super();
		let u = new PostOutlineUniforms();
		u.scale[0] = 2;
		u.scale[1] = 1;
		u.scale[2] = 2;
		u.scale[3] = 8;
		u.mode[0] = 1;
		u.mode[1] = 1;
		u.color[1] = new Vec4(1, 0, 0, 1);
		u.color[2] = new Vec4(0, 1, 0, 1);
		u.color[3] = new Vec4(0, 0, 1, 1);
		this.postUniforms = u;
	}
	
	init() {
		this.objects = [];

		let obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 1;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 2;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 3;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.tags = ["rotate"];
		obj.model = Mat4.trs(new Vec3(0, 3, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 0.0);
		obj.mask = 4;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, position: Vec3) {
		let lightPos = new Vec3(20*Math.cos(time/2), 60, 20*Math.sin(time/2));
		for (let obj of this.objects) {
			if ((obj.fragUniforms as PhongUniforms).lightPos) {
				(obj.fragUniforms as PhongUniforms).lightPos = lightPos;
			}
		}
		for (let obj of this.getObjects("rotate")) {
			obj.model = Mat4.rotate(new Vec3(0, 1, 0).mul(deltaTime)).mul(obj.model);
		}

	}
}