import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugErrorScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_error";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(0, 10, 0);

		this.preload = {
			shaders: ["world/phong.frag.wgsl", "world/skybox.frag.wgsl", "world/err_shader.frag.glsl" as any],
			textures: ["test.png", "err_texture.png"],
			meshes: ["cube.obj", "err_mesh.obj", "quad.obj"],
			colliders: ["err_collider.obj"],
			fonts: [],
		};
	}
	
	async init(assets: Assets) {
		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-9, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("$framebuffer")]; // unintercepted
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-6, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("err_texture.png")]; // does not exist
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("err_mesh.obj"); // does not exist
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-3, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh(":err_dynamic"); // does not exist
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(3, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(6, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.collider = await assets.loadCollider("err_collider.obj"); // does not exist
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(9, 0, 0), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/err_shader.frag.glsl" as any); // invalid type, does not exist
		obj.fragUniforms = this.phong;
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {

	}
}