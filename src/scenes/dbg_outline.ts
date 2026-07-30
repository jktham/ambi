import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms, PostOutlineUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugOutlineScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_outline";
		this.resolution = new Vec2(1920, 1080);
		this.spawnPos = new Vec3(0, 0, 5);

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

		this.preload = {
			shaders: ["post/outline.frag.wgsl", "world/phong.frag.wgsl"],
			textures: ["default.png"],
			meshes: ["monke.obj", "cube.obj", "quad.obj"],
		};
	}
	
	async init(assets: Assets) {
		this.postShader = await assets.loadShader("post/outline.frag.wgsl");

		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 1;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 2;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(3, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.mask = 3;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["rotate"];
		obj.model = Mat4.transform(new Vec3(0, 3, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.5, 0.5, 0.5, 0.0);
		obj.mask = 4;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.5, 0.5, 0.5, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
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