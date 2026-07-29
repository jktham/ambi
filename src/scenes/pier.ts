import type { Player } from "../player";
import { Scene } from "../scene";
import { Object } from "../object";
import { InstancedUniforms, PostPsxUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import { rad, rndvec3 } from "../utils";

export class PierScene extends Scene {
	constructor() {
		super();

		this.name = "pier";
		this.resolution = new Vec2(320, 180);
		this.cameraMode = "walk";
		this.spawnPos = new Vec3(8, 1.8, -0.5);
		this.spawnRot = new Vec3(0, rad(90), 0);

		this.postShader = "post/psx_fog.frag.wgsl";
		let postUniforms = new PostPsxUniforms();
		postUniforms.fog_start = -2.0;
		postUniforms.fog_end = 10.0;
		postUniforms.fog_color = new Vec4(0.60, 0.60, 0.60, 1.0);
		this.postUniforms = postUniforms;
	}

	init() {
		let pier = new Object();
		pier.mesh = "pier/pier.obj";
		pier.collider = "pier/collider.obj";
		pier.textures = ["wood.jpg"];
		pier.fragShader = "world/psx.frag.wgsl";
		pier.vertShader = "world/psx.vert.wgsl";
		this.objects.push(pier);

		let water = new Object();
		water.mesh = "pier/water.obj";
		water.textures = ["snow.jpg"];
		water.fragShader = "world/psx.frag.wgsl";
		water.vertShader = "world/psx.vert.wgsl";
		this.objects.push(water);

		let ground = new Object();
		ground.mesh = "pier/ground.obj";
		ground.textures = ["ground.jpg"];
		ground.fragShader = "world/psx.frag.wgsl";
		ground.vertShader = "world/psx.vert.wgsl";
		this.objects.push(ground);

		let sky = new Object();
		sky.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 100);
		sky.mesh = "cube.obj";
		sky.textures = ["test.png"];
		sky.fragShader = "world/skybox.frag.wgsl";
		sky.color = new Vec4(0.1, 0.1, 0.1, 1.0);
		this.objects.push(sky);

		let snow = new Object();
		snow.tags = ["snow"];
		snow.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		snow.mesh = "pier/snow.obj";
		snow.textures = ["white.png"];
		snow.color = new Vec4(0.9, 0.9, 0.9, 1.0);
		snow.fragShader = "world/psx.frag.wgsl";
		snow.vertShader = "world/psx_instanced.vert.wgsl";
		
		let snowUniforms = new InstancedUniforms();
		snowUniforms.instanceCount = 1000;
		for (let i=0; i<snowUniforms.instanceCount; i++) {
			let range = 10;
			let model = Mat4.transform(
				rndvec3(Vec3.splat(-range), Vec3.splat(range)), 
				new Vec3(0, Math.PI * Math.random() * 2, 0), 
				1
			);
			snowUniforms.models.push(model);
			snowUniforms.normals.push(model.inverse().transpose());
		}
		snow.vertUniforms = snowUniforms;
		this.objects.push(snow);

		for (let [post_pos, lamp_pos] of [
			[new Vec3(-5.15233, 1.72745, -1.73468), new Vec3(-4.99565, 2.98092, -1.03047)],
			[new Vec3(17.801, 2.22152, -6.09387), new Vec3(17.9509, 3.4786, -5.39742)],
			[new Vec3(34.3454, 2.78749, -5.01153), new Vec3(34.4953, 4.04457, -4.31509)],
		]) {
			let lantern_post = new Object();
			lantern_post.model = Mat4.translate(post_pos);
			lantern_post.mesh = "pier/lantern_post.obj";
			lantern_post.textures = ["wood.jpg"];
			lantern_post.fragShader = "world/psx.frag.wgsl";
			lantern_post.vertShader = "world/psx.vert.wgsl";
			this.objects.push(lantern_post);

			let lantern = new Object();
			lantern.model = Mat4.translate(lamp_pos);
			lantern.tags = ["sway"];
			lantern.mesh = "pier/lantern.obj";
			lantern.textures = ["cracked.jpg"];
			lantern.color = new Vec4(1.0, 0.9, 0.0, 1.0);
			lantern.mask = 255;
			lantern.fragShader = "world/psx.frag.wgsl";
			lantern.vertShader = "world/psx.vert.wgsl";
			this.objects.push(lantern);

			let lantern_holder = new Object();
			lantern_holder.model = Mat4.translate(lamp_pos);
			lantern_holder.tags = ["sway"];
			lantern_holder.mesh = "pier/lantern_holder.obj";
			lantern_holder.textures = ["metal.jpg"];
			lantern_holder.color = new Vec4(0.2, 0.2, 0.2, 1.0);
			lantern_holder.fragShader = "world/psx.frag.wgsl";
			lantern_holder.vertShader = "world/psx.vert.wgsl";
			this.objects.push(lantern_holder);

			let lantern_chain = new Object();
			lantern_chain.model = Mat4.translate(lamp_pos);
			lantern_chain.tags = ["sway"];
			lantern_chain.mesh = "pier/lantern_chain.obj";
			lantern_chain.textures = ["metal.jpg"];
			lantern_chain.color = new Vec4(0.4, 0.4, 0.4, 1.0);
			lantern_chain.fragShader = "world/psx.frag.wgsl";
			lantern_chain.vertShader = "world/psx.vert.wgsl";
			this.objects.push(lantern_chain);
		}
	}

	update(time: number, deltaTime: number, player: Player) {
		let snow = this.getObject("snow")!;
		let snowUniforms = snow.vertUniforms as InstancedUniforms;
		for (let i=0; i<snowUniforms.instanceCount; i++) {
			let model = snowUniforms.models[i];
			let fall = Mat4.translate(new Vec3(0, -0.2 * deltaTime, 0.1 * deltaTime));
			model = model.mul(fall);
			if (model.mulVec(new Vec3()).y < -2) {
				model = model.mul(Mat4.translate(new Vec3(0, 10, -5)));
			}

			let pos = model.translation();
			if (player.position.sub(pos).length() > 10.0) {
				let range = 10;
				model = Mat4.transform(
					player.position.add(rndvec3(Vec3.splat(-range), Vec3.splat(range))), 
					new Vec3(0, Math.PI * Math.random() * 2, 0), 
					1
				);
			}

			snowUniforms.models[i] = model;
			snowUniforms.normals[i] = model.inverse().transpose();
		}
		snow.changed = true;

		for (let obj of this.getObjects("sway")!) {
			let origin = obj.model.translation();
			let sway = new Vec3(Math.sin(time*0.5)*0.08, Math.cos(time*0.2)*0.5, 0);
			obj.model = Mat4.transform(origin, sway, 1);
			obj.changed = true;
		}
	}
}
