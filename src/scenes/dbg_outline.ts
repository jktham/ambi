import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms, PostOutlineUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";

export class DebugOutlineScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_outline";
		this.resolution = new Vec2(1920, 1080);
		this.spawnPos = new Vec3(0, 0, 5);

		this.postShader = "post/outline.frag.wgsl";
		let postUniforms = new PostOutlineUniforms();
		postUniforms.scale[0] = 2;
		postUniforms.scale[1] = 1;
		postUniforms.scale[2] = 2;
		postUniforms.scale[3] = 8;
		postUniforms.mode[0] = 1;
		postUniforms.mode[1] = 1;
		postUniforms.color[1] = new Vec4(1, 0, 0, 1);
		postUniforms.color[2] = new Vec4(0, 1, 0, 1);
		postUniforms.color[3] = new Vec4(0, 0, 1, 1);
		this.postUniforms = postUniforms;
	}
	
	init() {
		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 1;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 2;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(3, 0, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 3;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["rotate"];
		obj.model = Mat4.trs(new Vec3(0, 3, 0), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 0.0);
		obj.mask = 4;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightPos = new Vec3(20*Math.cos(time/2), 60, 20*Math.sin(time/2));
		this.phong.light.pos = lightPos;
		for (let obj of this.objects) {
			obj.changed = true;
		}
		
		for (let obj of this.getObjects("rotate")) {
			obj.model = Mat4.rotateIntrinsic(new Vec3(0, 1, 0).mul(deltaTime)).mul(obj.model);
			obj.changed = true;
		}

	}
}