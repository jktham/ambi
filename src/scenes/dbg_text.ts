import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";
import { generateTextMesh } from "../parse";

export class DebugTextScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_text";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(0, 10, 0);

		this.preload = {
			shaders: ["world/phong.frag.wgsl", "world/skybox.frag.wgsl"],
			textures: ["default.png", "fonts/arial.png", "fonts/arial_outline.png", "fonts/noto_outline.png"],
			meshes: ["quad_v.obj", "cube.obj", "quad.obj", ":abc.obj"],
			fonts: ["arial.fnt", "arial_outline.fnt", "noto_outline.fnt"],
		};
	}
	
	async init(assets: Assets) {
		let arial = await assets.loadFont("arial.fnt");
		let text1 = generateTextMesh(":text1.obj", arial, "abc\ndef-_ Y,X,\n+!?<>:)\nXYZ", 1, "left");

		let arial_outline = await assets.loadFont("arial_outline.fnt");
		let text2 = generateTextMesh(":text2.obj", arial_outline, "abc\ndef-_ Y,X,\n+!?<>:)\nXYZ", 1, "center");

		let noto_outline = await assets.loadFont("noto_outline.fnt");
		let text3 = generateTextMesh(":text3.obj", noto_outline, "abc\ndef-_ Y,X,\n+!?<>:)\nXYZ", 1, "right");

		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-7.5, 0, -5), new Vec3(), 2);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.uv_scale = 0.25;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-9.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = text1;
		obj.textures = [await assets.loadTexture("default.png")];
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-9.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("gimbal.obj");
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-2.5, 0, -5), new Vec3(), 2);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.uv_scale = 0.25;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-4.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = text1;
		obj.textures = [await assets.loadTexture("fonts/arial.png")];
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-4.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("gimbal.obj");
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(2.5, 0, -5), new Vec3(), 2);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.uv_scale = 0.25;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(2.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = text2;
		obj.textures = [await assets.loadTexture("fonts/arial_outline.png")];
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(2.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("gimbal.obj");
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(7.5, 0, -5), new Vec3(), 2);
		obj.mesh = await assets.loadMesh("quad_v.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.uv_scale = 0.25;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(9.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = text3;
		obj.textures = [await assets.loadTexture("fonts/noto_outline.png")];
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(9.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("gimbal.obj");
		this.objects.push(obj);
		
		
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("default.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

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
}