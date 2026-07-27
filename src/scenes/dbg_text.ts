import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugTextScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_text";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(0, 10, 0);
	}

	async generateAssets(assets: Assets) {
		assets.addDynamicMesh(":text1", await assets.generateTextMesh("arial.fnt", "abc\ndef-_ Y,X,\n+!?<>:)\nXYZ", 1, "left"));
		assets.addDynamicMesh(":text2", await assets.generateTextMesh("arial_outline.fnt", "abc\ndef-_ Y,X,\n+!?<>:)\nXYZ", 1, "center"));
		assets.addDynamicMesh(":text3", await assets.generateTextMesh("noto_outline.fnt", "abc\ndef-_ Y,X,\n+!?<>:)\nXYZ", 1, "right"));
	}
	
	init() {
		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-7.5, 0, -5), new Vec3(), 2);
		obj.mesh = "quad_vertical.obj";
		obj.textures = ["test.png"];
		obj.uv_scale = 0.25;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-9.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = ":text1";
		obj.textures = ["test.png"];
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-2.5, 0, -5), new Vec3(), 2);
		obj.mesh = "quad_vertical.obj";
		obj.textures = ["test.png"];
		obj.uv_scale = 0.25;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-4.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = ":text1";
		obj.textures = ["fonts/arial.png"];
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(2.5, 0, -5), new Vec3(), 2);
		obj.mesh = "quad_vertical.obj";
		obj.textures = ["test.png"];
		obj.uv_scale = 0.25;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(2.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = ":text2";
		obj.textures = ["fonts/arial_outline.png"];
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(7.5, 0, -5), new Vec3(), 2);
		obj.mesh = "quad_vertical.obj";
		obj.textures = ["test.png"];
		obj.uv_scale = 0.25;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(9.5, 2, -4.99), new Vec3(), 1);
		obj.mesh = ":text3";
		obj.textures = ["fonts/noto_outline.png"];
		this.objects.push(obj);
		
		
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {

	}
}