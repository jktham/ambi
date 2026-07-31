import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets, MeshPath, ShaderPath, TexturePath } from "../assets";

export class DebugReloadScene extends Scene {
	phong = new PhongUniforms();

	index = 0;

	constructor() {
		super();

		this.name = "dbg_reload";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(0, 10, 0);

		this.preload = {
			shaders: ["world/skybox.frag.wgsl", "world/base.frag.wgsl", "world/rainbow.frag.wgsl"],
			textures: ["default.png", "house.jpg", "materials/brick.jpg", "error.png"],
			meshes: ["quad.obj", "cube.obj", "monke.obj", "icosphere.obj"],
		};
	}
	
	async init(assets: Assets) {
		let obj = new Object();
		obj.tags = ["reload"];
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 1.0);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		this.objects.push(obj);

		// skybox
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 100);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

		// floor
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		
	}

	async interact(time: number, player: Player, assets: Assets) {
		this.index++;
		let meshes: MeshPath[] = ["cube.obj", "monke.obj", "icosphere.obj"];
		let textures: TexturePath[] = ["default.png", "house.jpg", "materials/brick.jpg", "error.png"];
		let shaders: ShaderPath[] = ["world/base.frag.wgsl", "world/rainbow.frag.wgsl"];

		for (let obj of this.getObjects("reload")) {
			obj.mesh = await assets.loadMesh(meshes[this.index % meshes.length]);
			obj.textures[0] = await assets.loadTexture(textures[this.index % textures.length]);
			obj.fragShader = await assets.loadShader(shaders[this.index % shaders.length]);
			obj.reload = true;
		}
	}
}