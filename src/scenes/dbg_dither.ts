import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms, PostDitherUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { FragShaderPath, TexturePath } from "../assets";

export class DebugDitherScene extends Scene {
	name = "dbg_dither";
	spawnPos = new Vec3(0, 0, 5);

	postShader: FragShaderPath = "post/dither.frag.wgsl";
	resolution = new Vec2(320, 180);
	postTextures: TexturePath[] = ["noise/blue_0.png"];
	postUniforms = new PostDitherUniforms();

	phong = new PhongUniforms();
	
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

	}
}