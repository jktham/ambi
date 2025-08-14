import { Scene, WorldObject } from "../scene";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class DitherScene extends Scene {
	name = "dither";
	spawnPos = new Vec3(0, 0, 5);

	postShader = "post/dither.frag.wgsl";
	resolution = new Vec2(320, 180);
	postTextures = ["noise/blue_0.png"];
	
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

	update(time: number, deltaTime: number) {
		let lightPos = new Vec3(20*Math.cos(time/2), 60, 20*Math.sin(time/2));
		for (let obj of this.objects) {
			(obj.fragUniforms as PhongUniforms).lightPos = lightPos;
		}

	}
}