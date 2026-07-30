import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms, PostDitherUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugDitherScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_dither";
		this.resolution = new Vec2(320, 180);
		this.spawnPos = new Vec3(0, 0, 5);

		this.postUniforms = new PostDitherUniforms();

		this.preload = {
			shaders: ["post/dither.frag.wgsl", "world/phong.frag.wgsl"],
			textures: ["noise/blue_0.png", "default.png"],
			meshes: ["monke.obj", "cube.obj", "quad.obj"],
		};
	}
	
	async init(assets: Assets) {
		this.postShader = await assets.loadShader("post/dither.frag.wgsl");
		this.postTextures = [await assets.loadTexture("noise/blue_0.png")];

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

	}
}