import { Scene } from "../scene";
import { Object } from "../object";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import { PhongUniforms, PostOutlineUniforms } from "../uniforms";
import { Camera } from "../camera";
import type { Assets } from "../assets";
import { rnd, rndvec3 } from "../utils";

export class DebugPortalsScene extends Scene {
	phong = new PhongUniforms();
	prevPos = new Vec3();

	constructor() {
		super();

		this.name = "dbg_portals";
		this.spawnPos = new Vec3(0, 2, 6);

		let postUniforms = new PostOutlineUniforms();
		postUniforms.mode[0] = 1; // self edges
		postUniforms.mode[1] = 0;
		postUniforms.color[0] = new Vec4(0.0, 0.0, 0.0, 1.0);
		postUniforms.color[1] = new Vec4(0.0, 0.0, 0.0, 1.0);
		postUniforms.color[2] = new Vec4(0.0, 0.0, 0.0, 0.0);
		this.postUniforms = postUniforms;
	
		this.portalCameras = [new Camera(), new Camera()];

		this.phong.light.pos = new Vec3(0, 10, 0);

		this.preload = {
			shaders: ["post/outline.frag.wgsl", "world/portal.frag.wgsl", "world/phong.frag.wgsl", "world/skybox.frag.wgsl"],
			textures: ["white.png", "test.png"],
			meshes: ["quad_vertical.obj", "monke.obj", "cube.obj", "quad.obj"],
			colliders: [],
			fonts: [],
		};
	}

	async init(assets: Assets) {
		this.postShader = await assets.loadShader("post/outline.frag.wgsl");

		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-10, 2, 0), new Vec3(), new Vec3(3, 2, 1));
		obj.mesh = await assets.loadMesh("quad_vertical.obj");
		obj.textures = ["$portal_0"];
		obj.portal_visible = [true, false];
		obj.mask = 0;
		obj.fragShader = await assets.loadShader("world/portal.frag.wgsl");
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(10, 2, 0), new Vec3(), new Vec3(3, 2, 1));
		obj.mesh = await assets.loadMesh("quad_vertical.obj");
		obj.textures = ["$portal_1"];
		obj.portal_visible = [false, true];
		obj.mask = 0;
		obj.fragShader = await assets.loadShader("world/portal.frag.wgsl");
		this.objects.push(obj);


		obj = new Object();
		obj.tags = ["check_backside"];
		obj.model = Mat4.transform(new Vec3(-10, 2, -5), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("white.png")];
		obj.color = new Vec4(1.0, 0.6, 0.6, 1.0);
		obj.mask = 1;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		for (let i=0; i<20; i++) {
			let offset = new Vec3(-10, 2, 0).add(rndvec3().sub(0.5).mul(2).mul(new Vec3(10, 3, 10)));
			if (Math.abs(offset.z) < 2) offset.z = 2 * Math.sign(offset.z); // prevent intersecting portal

			obj = new Object();
			obj.tags = ["check_backside"];
			obj.model = Mat4.transform(offset, new Vec3(), rnd(0.2, 0.6));
			obj.mesh = await assets.loadMesh("cube.obj");
			obj.textures = [await assets.loadTexture("white.png")];
			obj.color = new Vec4(1.0, 0.6, 0.6, 1.0);
			obj.mask = 1;
			obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
			obj.fragUniforms = this.phong;
			this.objects.push(obj);
		}

		obj = new Object();
		obj.tags = ["check_backside"];
		obj.model = Mat4.transform(new Vec3(10, 2, -5), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.textures = [await assets.loadTexture("white.png")];
		obj.color = new Vec4(0.6, 0.6, 1.0, 1.0);
		obj.mask = 1;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		for (let i=0; i<20; i++) {
			let offset = new Vec3(10, 2, 0).add(rndvec3().sub(0.5).mul(2).mul(new Vec3(10, 3, 10)));
			if (Math.abs(offset.z) < 2) offset.z = 2 * Math.sign(offset.z); // prevent intersecting portal

			obj = new Object();
			obj.tags = ["check_backside"];
			obj.model = Mat4.transform(offset, new Vec3(), rnd(0.2, 0.6));
			obj.mesh = await assets.loadMesh("cube.obj");
			obj.textures = [await assets.loadTexture("white.png")];
			obj.color = new Vec4(0.6, 0.6, 1.0, 1.0);
			obj.mask = 1;
			obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
			obj.fragUniforms = this.phong;
			this.objects.push(obj);
		}


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(-10, 0, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(1.0, 0.6, 0.6, 1.0);
		obj.mask = 0;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(10, 0, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.6, 0.6, 1.0, 1.0);
		obj.mask = 0;
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);


		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 0, 0), new Vec3(), 200);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.mask = 2;
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
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
			obj.portal_visible[0] = this.portalCameras[0].model.translation().z * obj.model.translation().z < 0;
			obj.portal_visible[1] = this.portalCameras[1].model.translation().z * obj.model.translation().z < 0;
		}

	}
}