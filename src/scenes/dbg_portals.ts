import { Scene } from "../scene";
import { Object } from "../object";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { PhongUniforms, PostOutlineUniforms } from "../uniforms";
import { Camera } from "../camera";
import type { PostFragShaderPath } from "../assets";
import { rnd, rndvec3 } from "../utils";

export class DebugPortalsScene extends Scene {
	name = "dbg_portals";
	spawnPos = new Vec3(0, 2, 6);
	
	portalCameras = [new Camera(), new Camera()];

	phong = new PhongUniforms();
	prevPos = new Vec3();

	constructor() {
		super();

		this.postShader = "post/outline.frag.wgsl" as PostFragShaderPath;
		this.postUniforms = new PostOutlineUniforms();
		(this.postUniforms as PostOutlineUniforms).mode[0] = 1; // self edges
		(this.postUniforms as PostOutlineUniforms).mode[1] = 0;
		(this.postUniforms as PostOutlineUniforms).color[0] = new Vec4(0.0, 0.0, 0.0, 1.0);
		(this.postUniforms as PostOutlineUniforms).color[1] = new Vec4(0.0, 0.0, 0.0, 1.0);
		(this.postUniforms as PostOutlineUniforms).color[2] = new Vec4(0.0, 0.0, 0.0, 0.0);
	}

	init() {
		this.phong.light.pos = new Vec3(0, 10, 0);

		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, 0), new Vec3(), new Vec3(3, 2, 1));
		obj.mesh = "quad_vertical.obj";
		obj.textures = ["$portal_0"];
		obj.portal_visible = [true, false];
		obj.mask = 0;
		obj.fragShader = "world/portal.frag.wgsl";
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, 0), new Vec3(), new Vec3(3, 2, 1));
		obj.mesh = "quad_vertical.obj";
		obj.textures = ["$portal_1"];
		obj.portal_visible = [false, true];
		obj.mask = 0;
		obj.fragShader = "world/portal.frag.wgsl";
		this.objects.push(obj);


		obj = new Object();
		obj.tags = ["check_backside"];
		obj.model = Mat4.trs(new Vec3(-10, 2, -5), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["white.png"];
		obj.color = new Vec4(1.0, 0.6, 0.6, 1.0);
		obj.mask = 1;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		for (let i=0; i<20; i++) {
			let offset = new Vec3(-10, 2, 0).add(rndvec3().sub(0.5).mul(2).mul(new Vec3(10, 3, 10)));
			if (Math.abs(offset.z) < 2) offset.z = 2 * Math.sign(offset.z); // prevent intersecting portal

			obj = new Object();
			obj.tags = ["check_backside"];
			obj.model = Mat4.trs(offset, new Vec3(), rnd(0.2, 0.6));
			obj.mesh = "cube.obj";
			obj.textures = ["white.png"];
			obj.color = new Vec4(1.0, 0.6, 0.6, 1.0);
			obj.mask = 1;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = this.phong;
			this.objects.push(obj);
		}

		obj = new Object();
		obj.tags = ["check_backside"];
		obj.model = Mat4.trs(new Vec3(10, 2, -5), new Vec3(), 1);
		obj.mesh = "monke.obj";
		obj.textures = ["white.png"];
		obj.color = new Vec4(0.6, 0.6, 1.0, 1.0);
		obj.mask = 1;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		for (let i=0; i<20; i++) {
			let offset = new Vec3(10, 2, 0).add(rndvec3().sub(0.5).mul(2).mul(new Vec3(10, 3, 10)));
			if (Math.abs(offset.z) < 2) offset.z = 2 * Math.sign(offset.z); // prevent intersecting portal

			obj = new Object();
			obj.tags = ["check_backside"];
			obj.model = Mat4.trs(offset, new Vec3(), rnd(0.2, 0.6));
			obj.mesh = "cube.obj";
			obj.textures = ["white.png"];
			obj.color = new Vec4(0.6, 0.6, 1.0, 1.0);
			obj.mask = 1;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = this.phong;
			this.objects.push(obj);
		}


		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 0, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(1.0, 0.6, 0.6, 1.0);
		obj.mask = 0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 0, 0), new Vec3(), 10);
		obj.mesh = "quad.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.6, 0.6, 1.0, 1.0);
		obj.mask = 0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(), 200);
		obj.mesh = "cube.obj";
		obj.textures = ["test.png"];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.mask = 2;
		obj.fragShader = "world/skybox.frag.wgsl";
		obj.z = 1000.0;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		if (player.position.x > -13 && player.position.x < -7 &&
			player.position.y > 0 && player.position.y < 4 &&
			player.position.z * this.prevPos.z < 0
		) {
			console.log("a");
			player.position.x += 20.0;
			player.updateCamera();

		} else if (player.position.x > 7 && player.position.x < 13 &&
			player.position.y > 0 && player.position.y < 4 &&
			player.position.z * this.prevPos.z < 0
		) {
			console.log("b");
			player.position.x -= 20.0;
			player.updateCamera();
		}

		this.prevPos = player.position.copy();

		this.portalCameras[0].model = Mat4.translate(new Vec3(20, 0, 0)).mul(player.camera.model);
		this.portalCameras[0].aspect = player.camera.aspect;
		this.portalCameras[0].fov = player.camera.fov;
		this.portalCameras[0].updateMatrices();

		this.portalCameras[1].model = Mat4.translate(new Vec3(-20, 0, 0)).mul(player.camera.model);
		this.portalCameras[1].aspect = player.camera.aspect;
		this.portalCameras[1].fov = player.camera.fov;
		this.portalCameras[1].updateMatrices();

		// hide objects on backside of portal
		for (let obj of this.getObjects("check_backside")) {
			obj.portal_visible = [true, true];
			obj.portal_visible[0] = this.portalCameras[0].model.origin().z * obj.model.origin().z < 0;
			obj.portal_visible[1] = this.portalCameras[1].model.origin().z * obj.model.origin().z < 0;
		}

	}
}