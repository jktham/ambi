import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";

export class DebugMaterialScene extends Scene {
	name = "dbg_material";
	spawnPos = new Vec3(0, 0, 5);
	
	init() {
		let obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.trs(new Vec3(-4.5, 0, 0), new Vec3(), 1);
		obj.mesh = "test_mat.obj";
		obj.textures = ["brick_diffuse.jpg", "blue.png", "gray.png", "gray.png"];
		obj.fragShader = "world/phong_material.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.trs(new Vec3(-1.5, 0, 0), new Vec3(), 1);
		obj.mesh = "test_mat.obj";
		obj.textures = ["@diffuse", "@normal", "gray.png", "gray.png"];
		obj.mtl = "test_mat.mtl";
		obj.fragShader = "world/phong_material.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.trs(new Vec3(1.5, 0, 0), new Vec3(), 1);
		obj.mesh = "test_mat.obj";
		obj.textures = ["@diffuse", "@normal", "@roughness", "@specular"];
		obj.mtl = "test_mat.mtl";
		obj.fragShader = "world/phong_material.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["circleLight"];
		obj.model = Mat4.trs(new Vec3(4.5, 0, 0), new Vec3(), 1);
		obj.mesh = "test_mat.obj";
		obj.textures = ["house.jpg", "brick_normal.jpg", "test_roughness.png", "test_specular.png"];
		obj.fragShader = "world/phong_material.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		(obj.fragUniforms as PhongUniforms).material.specular = Vec3.splat(0.6);
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = new PhongUniforms();
		obj.z = 900.0;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		let lightOffset = new Vec3(2*Math.cos(time/2), 2, 2*Math.sin(time/2));
		
		for (let obj of this.getObjects("circleLight")) {
			(obj.fragUniforms as PhongUniforms).light.pos = obj.model.origin().add(lightOffset);
			obj.changed = true;
		}

	}
}