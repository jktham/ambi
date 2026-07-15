import { Bbox } from "../bbox";
import type { Player, CameraMode } from "../player";
import { Scene } from "../scene";
import { Object } from "../object";
import { Trigger } from "../trigger";
import { InstancedUniforms, PhongUniforms, PostOutlineUniforms, RayspheresUniforms } from "../uniforms";
import { clamp, rad, rnd, rndarr, rndint, rndseed, rndvec3, rndvec4 } from "../utils";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";
import { engine } from "../main";
import type { FragShaderPath, TexturePath } from "../assets";

const MASK_OUTLINE_NONE = 13;
const MASK_OUTLINE_EXT_ONLY = 14;
const MASK_OUTLINE_WHITE = 15;

const N_ROOMS = 9;
const FIRST_ROOM = 0;

export class MuseumScene extends Scene {
	name = "museum";
	resolution = new Vec2(1920, 1080);
	cameraMode: CameraMode = "walk";
	spawnPos: Vec3 = new Vec3(0.001, 2, 0.001);
	postShader: FragShaderPath = "post/outline.frag.wgsl";
	postUniforms = new PostOutlineUniforms();

	roomSlots: number[] = [0, 1, 2, 3, 4]; // CNESW
	roomObjects: Object[][] = Array(N_ROOMS).fill(0).map(_ => []); // different [] objects
	roomTriggers: Trigger[][] = Array(N_ROOMS).fill(0).map(_ => []);

	phong = new PhongUniforms();

	playerPosSmooth = new Vec3();

	constructor() {
		super();
		
		this.postUniforms.scale.fill(2);
		this.postUniforms.mode.fill(1);
		this.postUniforms.color = this.postUniforms.color.map(_ => new Vec4(0, 0, 0, 1));
		this.postUniforms.scale[MASK_OUTLINE_NONE] = 0;
		this.postUniforms.mode[MASK_OUTLINE_EXT_ONLY] = 0;
		this.postUniforms.color[MASK_OUTLINE_WHITE] = new Vec4(1, 1, 1, 1);

		this.phong.light.pos = new Vec3(400, 1200, 800);
		this.phong.material.ambient = Vec3.splat(0.8);
		this.phong.material.diffuse = Vec3.splat(0.2);
		this.phong.material.specular = Vec3.splat(0.0);

		// initial room shuffle
		let rooms = Array(N_ROOMS).fill(0).map((_, i) => i).filter(v => v != FIRST_ROOM);
		this.roomSlots[0] = FIRST_ROOM;
		for (let i=1; i<5; i++) {
			let index = rndint(0, rooms.length);
			this.roomSlots[i] = rooms[index];
			rooms = rooms.filter(v => v != rooms[index]);
		}
	}
	
	init() {
		// room 0: portals
		let r = 0;
		let o = this.createRoomBase();
		this.roomObjects[r].push(...o);
		
		let [o2, t] = this.createPortals([
			["pier", "field"], 
			["brutal", "dbg_object"], 
			["dbg_dither", "dbg_outline"], 
			["dbg_transparency", "dbg_echo"]
		]);
		this.roomObjects[r].push(...o2);
		this.roomTriggers[r].push(...t);

		o = this.createWindows();
		this.roomObjects[r].push(...o);


		// room 1: shaky monke
		r = 1;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		for (let i=0; i<7; i++) {
			let obj = new Object();
			obj.tags = [`lod${i}`, "lookatplayersmooth"];
			obj.model = Mat4.trs(new Vec3(0, 5, 0), new Vec3(0, 0, 0), 3);
			obj.mesh = `museum/monke_lod${i}.obj`;
			obj.textures[0] = "white.png";
			obj.mask = 0;
			obj.fragShader = "world/rainbow.frag.wgsl";
			obj.vertShader = "world/glitch.vert.wgsl";
			this.roomObjects[r].push(obj);
		}

		for (let i=0; i<12; i++) {
			let obj = new Object();
			obj.tags = ["rotate", "explode"];
			obj.model = Mat4.trs(rndvec3(new Vec3(-16, 1, -16), new Vec3(16, 18, 16)), rndvec3().mul(Math.PI), rnd(0.4, 0.8));
			obj.mesh = `monke.obj`;
			obj.textures[0] = "white.png";
			obj.mask = 0;
			obj.fragShader = "world/rainbow.frag.wgsl";
			obj.vertShader = "world/explode.vert.wgsl";
			obj.vertConfig.x = 1.0; // explode scale
			this.roomObjects[r].push(obj);
		}


		// room 2: tree orbs
		r = 2;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 1, 0), new Vec3(0, 0, 0), 0.9);
		obj.mesh = "museum/tree.obj";
		obj.zsort = true;
		obj.color = new Vec4(1, 1, 1, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 4, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.z = 0.001;
		obj.color = new Vec4(1, 1, 1, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/rayspheres.frag.wgsl";
		let rayspheresUniforms = new RayspheresUniforms();
		rayspheresUniforms.sphere_count = 1;
		rayspheresUniforms.spheres = [{
				pos: new Vec4(0, 0, 0, 0.8),
				color: new Vec4(1, 1, 1, 1),
		}];
		rayspheresUniforms.background_color = new Vec4(0, 0, 0, 0);
		rayspheresUniforms.light.pos = this.phong.light.pos;
		rayspheresUniforms.material.ambient = this.phong.material.ambient;
		rayspheresUniforms.material.diffuse = this.phong.material.diffuse;
		rayspheresUniforms.material.specular = this.phong.material.specular;
		rayspheresUniforms.material.shininess = this.phong.material.shininess;
		obj.fragUniforms = rayspheresUniforms;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, 0), new Vec3(0, rad(-90), 0), 1);
		obj.mesh = "quad_vertical.obj";
		obj.zsort = true;
		obj.color = new Vec4(1, 1, 1, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/rayspheres.frag.wgsl";
		rayspheresUniforms = new RayspheresUniforms();
		rayspheresUniforms.sphere_count = 1;
		rayspheresUniforms.spheres = [{
				pos: new Vec4(0, 2, -10, 0.8),
				color: new Vec4(1, 0, 0, 1),
		}];
		rayspheresUniforms.background_color = new Vec4(1.0, 0, 0, 0.1);
		rayspheresUniforms.light.pos = this.phong.light.pos;
		rayspheresUniforms.material.ambient = this.phong.material.ambient;
		rayspheresUniforms.material.diffuse = this.phong.material.diffuse;
		rayspheresUniforms.material.specular = this.phong.material.specular;
		rayspheresUniforms.material.shininess = this.phong.material.shininess;
		obj.fragUniforms = rayspheresUniforms;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, 0), new Vec3(0, rad(90), 0), 1);
		obj.mesh = "quad_vertical.obj";
		obj.zsort = true;
		obj.color = new Vec4(1, 1, 1, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/rayspheres.frag.wgsl";
		rayspheresUniforms = new RayspheresUniforms();
		rayspheresUniforms.sphere_count = 1;
		rayspheresUniforms.spheres = [{
				pos: new Vec4(0, 2, -10, 0.8),
				color: new Vec4(0, 0, 1, 1),
		}];
		rayspheresUniforms.background_color = new Vec4(0, 0, 1.0, 0.1);
		rayspheresUniforms.light.pos = this.phong.light.pos;
		rayspheresUniforms.material.ambient = this.phong.material.ambient;
		rayspheresUniforms.material.diffuse = this.phong.material.diffuse;
		rayspheresUniforms.material.specular = this.phong.material.specular;
		rayspheresUniforms.material.shininess = this.phong.material.shininess;
		obj.fragUniforms = rayspheresUniforms;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 2, -10), new Vec3(0, rad(180), 0), 1);
		obj.mesh = "quad_vertical.obj";
		obj.zsort = true;
		obj.color = new Vec4(1, 1, 1, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/rayspheres.frag.wgsl";
		rayspheresUniforms = new RayspheresUniforms();
		rayspheresUniforms.sphere_count = 1;
		rayspheresUniforms.spheres = [{
				pos: new Vec4(0, 2, -10, 0.8),
				color: new Vec4(0, 1, 0, 1),
		}];
		rayspheresUniforms.background_color = new Vec4(0, 1.0, 0, 0.1);
		rayspheresUniforms.light.pos = this.phong.light.pos;
		rayspheresUniforms.material.ambient = this.phong.material.ambient;
		rayspheresUniforms.material.diffuse = this.phong.material.diffuse;
		rayspheresUniforms.material.specular = this.phong.material.specular;
		rayspheresUniforms.material.shininess = this.phong.material.shininess;
		obj.fragUniforms = rayspheresUniforms;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 2, 10), new Vec3(0, rad(0), 0), 1);
		obj.mesh = "quad_vertical.obj";
		obj.zsort = true;
		obj.color = new Vec4(1, 1, 1, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/rayspheres.frag.wgsl";
		rayspheresUniforms = new RayspheresUniforms();
		rayspheresUniforms.sphere_count = 1;
		rayspheresUniforms.spheres = [{
				pos: new Vec4(0, 2, -10, 0.0),
				color: new Vec4(0, 0, 0, 0.2),
		}];
		rayspheresUniforms.background_color = new Vec4(0, 0, 0, 0.1);
		rayspheresUniforms.light.pos = this.phong.light.pos;
		rayspheresUniforms.material.ambient = this.phong.material.ambient;
		rayspheresUniforms.material.diffuse = this.phong.material.diffuse;
		rayspheresUniforms.material.specular = this.phong.material.specular;
		rayspheresUniforms.material.shininess = this.phong.material.shininess;
		obj.fragUniforms = rayspheresUniforms;
		this.roomObjects[r].push(obj);


		// room 3: trans cubes
		r = 3;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0.2, 1, 0.4);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = 0;
		obj.cull = 1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);
		
		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(1, 0, 0.86, 0.0001);
		obj.collider = "cube.obj";
		obj.textures[0] = "test_trans.png";
		obj.mask = 0;
		obj.cull = 0.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);
		
		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 1, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "test_trans2.png";
		obj.mask = 0;
		obj.cull = 0.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);
		
		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 2, 10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 0.1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = 0;
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);
		
		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 2, -10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_NONE;
		obj.cull = 0.0;
		obj.fragShader = "world/wireframe.frag.wgsl";
		obj.fragConfig.x = 4.0; // line width
		this.roomObjects[r].push(obj);


		// room 4: rayspheres
		r = 4;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		obj = new Object();
		obj.tags = ["spheres"];
		obj.model = Mat4.trs(new Vec3(0, 5, 0), new Vec3(0, 0, 0), new Vec3(4, 4, 4));
		obj.mesh = "cube.obj";
		obj.color = new Vec4(1, 1, 1, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/rayspheres.frag.wgsl";
		rayspheresUniforms = new RayspheresUniforms();
		rayspheresUniforms.sphere_count = 16;
		rayspheresUniforms.spheres = new Array(rayspheresUniforms.sphere_count).fill(0).map((_, i) => {
			return {
				pos: rndvec4(new Vec4(-2, -4, -2, 0.5), new Vec4(2, 4, 2, 1.5)),
				color: rndvec4(new Vec4(0, 0, 0, 1), new Vec4(1, 1, 1, 1)),
			};
		});
		rayspheresUniforms.background_color = new Vec4(0, 0, 0, 1);
		rayspheresUniforms.light.pos = this.phong.light.pos;
		rayspheresUniforms.material.ambient = Vec3.splat(0.5);
		rayspheresUniforms.material.diffuse = Vec3.splat(0.4);
		rayspheresUniforms.material.specular = Vec3.splat(0.1);
		rayspheresUniforms.material.shininess = 32.0;
		obj.fragUniforms = rayspheresUniforms;
		this.roomObjects[r].push(obj);


		// room 5: sky orb
		r = 5;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		obj = new Object();
		obj.tags = ["pulse"];
		obj.model = Mat4.trs(new Vec3(0, 10, 0), new Vec3(0, 0, 0), 7);
		obj.mesh = "sphere.obj";
		obj.fragShader = "world/skybox.frag.wgsl";
		this.roomObjects[r].push(obj);


		// room 6: rainbow cube
		r = 6;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 12, 0), new Vec3(rad(35.26), 0, rad(45)), 4);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_WHITE;
		obj.tags = ["rotate-Y"];
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 12, 0), rndvec3().mul(Math.PI), 2);
		obj.mesh = "monke.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_NONE;
		obj.tags = ["rotateY"];
		obj.fragShader = "world/px_rainbow.frag.wgsl";
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, -10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_WHITE;
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, -10), rndvec3().mul(Math.PI), 0.5);
		obj.mesh = "cone.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_NONE;
		obj.tags = ["rotateY"];
		obj.fragShader = "world/px_rainbow.frag.wgsl";
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, -10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_WHITE;
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, -10), rndvec3().mul(Math.PI), 0.5);
		obj.mesh = "torus.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_NONE;
		obj.tags = ["rotateY"];
		obj.fragShader = "world/px_rainbow.frag.wgsl";
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, 10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_WHITE;
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(-10, 2, 10), rndvec3().mul(Math.PI), 0.5);
		obj.mesh = "cylinder.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_NONE;
		obj.tags = ["rotateY"];
		obj.fragShader = "world/px_rainbow.frag.wgsl";
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, 10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_WHITE;
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.roomObjects[r].push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(10, 2, 10), rndvec3().mul(Math.PI), 0.5);
		obj.mesh = "quad.obj";
		obj.textures[0] = "white.png";
		obj.mask = MASK_OUTLINE_NONE;
		obj.tags = ["rotateY"];
		obj.fragShader = "world/px_rainbow.frag.wgsl";
		this.roomObjects[r].push(obj);


		// room 7: wave plane
		r = 7;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0.01, 0), new Vec3(), 10.0);
		obj.mesh = "grid.obj";
		obj.textures = ["brick_diffuse.jpg"];
		obj.mask = 0;
		obj.uv_scale = 4.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.vertShader = "world/ripple.vert.wgsl";
		obj.vertConfig.x = 0.05; // ripple amplitude
		obj.vertConfig.y = 0.25; // ripple speed
		obj.vertConfig.z = 0.5; // ripple scale
		this.roomObjects[r].push(obj);


		// room 8: error
		r = 8;
		o = this.createRoomBase();
		this.roomObjects[r].push(...o);

		obj = new Object();
		obj.tags = ["lookatplayer", "scalewithplayer"]
		obj.model = Mat4.trs(new Vec3(0, 1.95, 0), new Vec3(), 1.0);
		obj.mesh = "error.obj";
		obj.textures = ["error.png"];
		obj.mask = MASK_OUTLINE_EXT_ONLY;
		obj.fragShader = "world/pulse.frag.wgsl";
		obj.fragConfig.x = 2.0; // speed
		obj.fragConfig.y = 0.5; // min
		obj.fragConfig.z = 1.0; // max
		this.roomObjects[r].push(obj);


		// concat
		this.applyRoomOffsets();
		this.entities.push(...this.roomObjects.flat());
		this.triggers.push(...this.roomTriggers.flat());

		// outer rooms
		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "museum/room.obj";
		obj.textures[0] = "white.png";
		obj.mask = 0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		obj.vertShader = "world/instanced.vert.wgsl";
		let uniforms = new InstancedUniforms();
		uniforms._instanceCount = 4;
		uniforms.models = [
			Mat4.trs(new Vec3(0, 0, -88), new Vec3(0, 0, 0), 1),
			Mat4.trs(new Vec3(88, 0, 0), new Vec3(0, 0, 0), 1),
			Mat4.trs(new Vec3(0, 0, 88), new Vec3(0, 0, 0), 1),
			Mat4.trs(new Vec3(-88, 0, 0), new Vec3(0, 0, 0), 1),
		];
		uniforms.normals = uniforms.models.map(m => m.inverse().transpose());
		obj.vertUniforms = uniforms;
		this.entities.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {
		if (player.position.z < -22) {
			player.position.z += 44;
			this.playerPosSmooth = player.position;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(1);
			this.applyRoomOffsets();
		}
		if (player.position.x > 22) {
			player.position.x -= 44;
			this.playerPosSmooth = player.position;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(2);
			this.applyRoomOffsets();
		}
		if (player.position.z > 22) {
			player.position.z -= 44;
			this.playerPosSmooth = player.position;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(3);
			this.applyRoomOffsets();
		}
		if (player.position.x < -22) {
			player.position.x += 44;
			this.playerPosSmooth = player.position;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(4);
			this.applyRoomOffsets();
		}

		let lodDistances = [10, 13, 16, 19, 22, 25, 1000];
		let lodObjects: Object[][] = [];
		for (let i=0; i<7; i++) {
			lodObjects.push(this.getObjects(`lod${i}`));
		}
		for (let i=0; i<lodObjects.length; i++) {
			for (let obj of lodObjects[i]) {
				let dist = player.position.sub(obj.model.transform(new Vec3(0, 0, 0))).length();
				if (i == 0) {
					obj.visible = dist < lodDistances[i] ? true : false;
					obj.collidable = dist < lodDistances[i] ? true : false;
				} else {
					obj.visible = dist < lodDistances[i] && dist >= lodDistances[i-1] ? true : false;
					obj.collidable = dist < lodDistances[i] && dist >= lodDistances[i-1] ? true : false;
				}
			}
		}

		for (let obj of this.getObjects("rotate")) {
			obj.model = obj.model.mul(Mat4.rotateIntrinsic(new Vec3(0, 0.5 * deltaTime, 0)));
			obj.changed = true;
		}

		for (let obj of this.getObjects("rotateY")) {
			let translation = obj.model.origin();
			let modelWithoutTranslation = Mat4.translate(translation.mul(-1)).mul(obj.model);
			let globalYRot = Mat4.rotateIntrinsic(new Vec3(0, 0.5 * deltaTime, 0));
			obj.model = Mat4.translate(translation).mul(globalYRot).mul(modelWithoutTranslation);
			obj.changed = true;
		}

		for (let obj of this.getObjects("rotate-Y")) {
			let translation = obj.model.origin();
			let modelWithoutTranslation = Mat4.translate(translation.mul(-1)).mul(obj.model);
			let globalYRot = Mat4.rotateIntrinsic(new Vec3(0, -0.25 * deltaTime, 0));
			obj.model = Mat4.translate(translation).mul(globalYRot).mul(modelWithoutTranslation);
			obj.changed = true;
		}

		for (let obj of this.getObjects("explode")) {
			let dist = obj.model.origin().mul(new Vec3(1, 0.5, 1)).dist(player.position.mul(new Vec3(1, 0.5, 1)));
			obj.vertConfig.x = clamp((dist - 5.0) / 2.0, 0.0, 10.0);
			obj.changed = true;
		}

		for (let obj of this.getObjects("spheres")) {
			let uniforms = obj.fragUniforms as RayspheresUniforms;
			for (let i=0; i<uniforms.sphere_count; i++) {
				uniforms.spheres[i].pos.y += rndseed(i, 0.3, 1.2) * deltaTime;
				if (uniforms.spheres[i].pos.y > 4) {
					uniforms.spheres[i].pos = rndvec4(new Vec4(-2, -4, -2, 0.5), new Vec4(2, -4, 2, 1.5));
					uniforms.spheres[i].color = rndvec4(new Vec4(0, 0, 0, 1), new Vec4(1, 1, 1, 1));
				}
			}
			obj.changed = true;
		}

		for (let obj of this.getObjects("pulse")) {
			let pulse = 1.0 + Math.sin(time) * 0.05;
			let origin = obj.model.origin();
			obj.model = Mat4.trs(origin, new Vec3(0, 0, 0), 7 * pulse);
			obj.changed = true;
		}

		for (let obj of this.getObjects("lookatplayer")) {
			let [t, _r, s] = obj.model.decompose();
			obj.model = Mat4.translate(t).mul(Mat4.rotateLookAt(t.negate(), player.position.negate()).mul(Mat4.scale(s))); // negate so +z towards player
			obj.changed = true;
		}

		for (let obj of this.getObjects("scalewithplayer")) {
			let [t, r, _s] = obj.model.decompose();
			let dist = player.position.dist(t);
			obj.model = Mat4.trs(t, r, dist * 0.1);
			obj.changed = true;
		}

		this.playerPosSmooth = Vec3.lerp(this.playerPosSmooth, player.position, 0.05);
		for (let obj of this.getObjects("lookatplayersmooth")) {
			let [t, _r, s] = obj.model.decompose();
			obj.model = Mat4.translate(t).mul(Mat4.rotateLookAt(t.negate(), this.playerPosSmooth.negate()).mul(Mat4.scale(s))); // negate so +z towards player
			obj.changed = true;
		}
	}

	interact(time: number, player: Player) {
		
	}

	applyRoomOffsets(factor: number = 1) {
		let offsets = [
			new Vec3(0, 0, 0),
			new Vec3(0, 0, -44),
			new Vec3(44, 0, 0),
			new Vec3(0, 0, 44),
			new Vec3(-44, 0, 0),
		];
		offsets = offsets.map(v => v.mul(factor));
		let voidOffset = new Vec3(0, 50, 0).mul(factor); // unused room

		for (let r=0; r<N_ROOMS; r++) {
			let slot = this.roomSlots.findIndex(v => v == r);
			let offset = slot != -1 ? offsets[slot] : voidOffset;
			
			for (let obj of this.roomObjects[r]) {
				let [translation, rotation, scale] = obj.model.decompose();
				obj.model = Mat4.trs(translation.add(offset), rotation, scale);
				obj.collidable = this.roomSlots[0] == r; // only collidable if in current room
				obj.z %= 100000.0;
				obj.z += this.roomSlots[0] == r ? 100000.0 : 0.0; // draw current room first, breaks on negative z!
				obj.changed = true;
			}
			for (let t of this.roomTriggers[r]) {
				let [translation, rotation, scale] = t.bbox.model.decompose();
				t.bbox.model = Mat4.trs(translation.add(offset), rotation, scale);
				t.enabled = this.roomSlots[0] == r;
			}
		}

	}

	shuffleRooms(nextSlot: number) {
		let currSlot = 0;
		let prevSlot = [-1, 3, 4, 1, 2][nextSlot];

		let currRoom = this.roomSlots[currSlot];
		let nextRoom = this.roomSlots[nextSlot];

		this.roomSlots[currSlot] = nextRoom;
		this.roomSlots[prevSlot] = currRoom;

		let freeSlots = [0, 1, 2, 3, 4].filter(s => s != currSlot && s != prevSlot);
		let freeRooms = Array(N_ROOMS).fill(0).map((_, i) => i).filter(r => r != nextRoom && r != currRoom);

		for (let slot of freeSlots) {
			let randomRoom = freeRooms[rndint(0, freeRooms.length)];
			freeRooms = freeRooms.filter(r => r != randomRoom);
			this.roomSlots[slot] = randomRoom;
		}
	}

	createRoomBase(): Object[] {
		let objects: Object[] = [];

		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "museum/room.obj";
		obj.collider = "museum/room.obj";
		obj.textures[0] = "white.png";
		obj.mask = 1;
		obj.z = 1000.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		objects.push(obj);
		
		let positions = [
			new Vec3(0, -0.05, -20),
			new Vec3(20, -0.05, 0),
			new Vec3(0, -0.05, 20),
			new Vec3(-20, -0.05, 0),
		];
		let rotations = [
			new Vec3(0, Math.PI * 0, 0),
			new Vec3(0, Math.PI * 1.5, 0),
			new Vec3(0, Math.PI * 1, 0),
			new Vec3(0, Math.PI * 0.5, 0),
		];
		for (let i=0; i<4; i++) {
			let obj = new Object();
			obj.model = Mat4.trs(positions[i], rotations[i], 1);
			obj.mesh = `museum/tunnel.obj`;
			obj.collider = `museum/tunnel.obj`;
			obj.textures[0] = "white.png";
			obj.mask = 2;
			obj.z = 1000.0;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = this.phong;
			objects.push(obj);
		}

		positions = [
			new Vec3(17, 0, -17),
			new Vec3(17, 0, 17),
			new Vec3(-17, 0, 17),
			new Vec3(-17, 0, -17),
		];
		for (let i=0; i<4; i++) {
			let obj = new Object();
			obj.model = Mat4.translate(positions[i]);
			obj.mesh = `museum/pillar.obj`;
			obj.collider = `museum/pillar.obj`;
			obj.textures[0] = "white.png";
			obj.mask = 3;
			obj.z = 1000.0;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = this.phong;
			objects.push(obj);
		}

		return objects;
	}

	createPortals(scenes: string[][]): [Object[], Trigger[]] {
		let objects: Object[] = [];
		let triggers: Trigger[] = [];

		let positions = [
			[new Vec3(-8, -0.05, -20), new Vec3(8, -0.05, -20)],
			[new Vec3(20, -0.05, -8), new Vec3(20, -0.05, 8)],
			[new Vec3(8, -0.05, 20), new Vec3(-8, -0.05, 20)],
			[new Vec3(-20, -0.05, 8), new Vec3(-20, -0.05, -8)],
		];
		let rotations = [
			new Vec3(0, Math.PI * 0, 0),
			new Vec3(0, Math.PI * 1.5, 0),
			new Vec3(0, Math.PI * 1, 0),
			new Vec3(0, Math.PI * 0.5, 0),
		];
		for (let i=0; i<4; i++) {
			for (let j=0; j<2; j++) {
				if (scenes[i][j] == "") {
					continue;
				}

				let obj = new Object();
				obj.model = Mat4.trs(positions[i][j], rotations[i], 1);
				obj.mesh = `museum/portal_h.obj`;
				obj.textures[0] = "white.png";
				obj.fragShader = "world/noise.frag.wgsl";
				obj.mask = 1;
				objects.push(obj);

				obj = new Object();
				obj.model = Mat4.trs(positions[i][j], rotations[i], 1);
				obj.mesh = `museum/portal_frame.obj`;
				obj.collider = `museum/portal_frame.obj`;
				obj.textures[0] = "white.png";
				obj.mask = 2;
				obj.fragShader = "world/phong.frag.wgsl";
				obj.fragUniforms = this.phong;
				objects.push(obj);

				let t = new Trigger();
				t.bbox = new Bbox();
				t.bbox.model = Mat4.translate(positions[i][j]);
				t.bbox.mesh = `museum/portal_${["h", "v", "h", "v"][i]}.obj`;
				t.onEnter = async () => await engine.setScene(scenes[i][j]);
				triggers.push(t);
			}
		}
		return [objects, triggers];
	}

	createWindows(): Object[] {
		let objects: Object[] = [];
		let textures: TexturePath[][] = [
			new Array(8).fill("").map(() => rndarr(["skybox/pure_clouds.jpg", "skybox/pure_cloudy.jpg", "skybox/pure_stars.jpg"])),
			new Array(8).fill("").map(() => rndarr(["skybox/pure_clouds.jpg", "skybox/pure_cloudy.jpg", "skybox/pure_stars.jpg"])),
			new Array(8).fill("").map(() => rndarr(["skybox/pure_clouds.jpg", "skybox/pure_cloudy.jpg", "skybox/pure_stars.jpg"])),
			new Array(8).fill("").map(() => rndarr(["skybox/pure_clouds.jpg", "skybox/pure_cloudy.jpg", "skybox/pure_stars.jpg"])),
			new Array(16).fill("").map(() => rndarr(["skybox/desert_stars.jpg"])),
		];

		let occupiedPositions = [
			[new Vec3(0, -0.05, -20), new Vec3(-8, -0.05, -20), new Vec3(8, -0.05, -20)],
			[new Vec3(20, -0.05, 0), new Vec3(20, -0.05, -8), new Vec3(20, -0.05, 8)],
			[new Vec3(0, -0.05, 20), new Vec3(8, -0.05, 20), new Vec3(-8, -0.05, 20)],
			[new Vec3(-20, -0.05, 0), new Vec3(-20, -0.05, 8), new Vec3(-20, -0.05, -8)],
			[new Vec3(17, 20, -17), new Vec3(17, 20, 17), new Vec3(-17, 20, 17), new Vec3(-17, 20, -17)],
		];
		let wallDimensions = [
			[new Vec3(-18, 0.5, -20), new Vec3(18, 15, -20)],
			[new Vec3(20, 0.5, -18), new Vec3(20, 15, 18)],
			[new Vec3(-18, 0.5, 20), new Vec3(18, 15, 20)],
			[new Vec3(-20, 0.5, -18), new Vec3(-20, 15, 18)],
			[new Vec3(-15, 20, -18), new Vec3(18, 20, 15)],
		];
		let wallRotations = [
			[new Vec3(0, Math.PI * 0, 0)],
			[new Vec3(0, Math.PI * 1.5, 0)],
			[new Vec3(0, Math.PI * 1, 0)],
			[new Vec3(0, Math.PI * 0.5, 0)],
			[new Vec3(Math.PI * 0.5, 0, 0), new Vec3(Math.PI * 0.5, 0, Math.PI * 0.5)],
		];

		let instances: Map<TexturePath, Mat4[]> = new Map();
		for (let i=0; i<5; i++) {
			for (let texture of textures[i]) {
				let [min, max] = wallDimensions[i];

				let position = rndvec3(min, max);
				let rotation = rndarr(wallRotations[i]);
				let dist = Math.min(...occupiedPositions[i].map(p => p.sub(position).mul(new Vec3(1, i == 4 ? 1 : 0.5, 1)).length()), 100);
				let iterations = 0;

				while (dist < (i == 4 ? 6 : 4) && iterations < 100) {
					position = rndvec3(min, max);
					dist = Math.min(...occupiedPositions[i].map(p => p.sub(position).mul(new Vec3(1, i == 4 ? 1 : 0.5, 1)).length()), 100);
					iterations++;
				}
				if (iterations >= 100) {
					continue;
				}
				occupiedPositions[i].push(position);

				if (!instances.has(texture)) {
					instances.set(texture, []);
				}
				instances.get(texture)?.push(Mat4.trs(position, rotation, 1));

			}
		}
		
		for (let [texture, models] of instances) {
			let obj = new Object();
			obj.mesh = `museum/portal_h.obj`;
			obj.textures[0] = texture;
			obj.fragShader = "world/skybox.frag.wgsl";
			obj.mask = 1;
			obj.vertShader = "world/instanced.vert.wgsl";
			obj.vertUniforms = new InstancedUniforms();
			(obj.vertUniforms as InstancedUniforms)._instanceCount = models.length;
			(obj.vertUniforms as InstancedUniforms).models = models;
			(obj.vertUniforms as InstancedUniforms).normals = models.map(m => m.inverse().transpose());
			objects.push(obj);

			obj = new Object();
			obj.mesh = `museum/portal_frame.obj`;
			obj.textures[0] = "white.png";
			obj.mask = 2;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = this.phong;
			obj.vertShader = "world/instanced.vert.wgsl";
			obj.vertUniforms = new InstancedUniforms();
			(obj.vertUniforms as InstancedUniforms)._instanceCount = models.length;
			(obj.vertUniforms as InstancedUniforms).models = models;
			(obj.vertUniforms as InstancedUniforms).normals = models.map(m => m.inverse().transpose());
			objects.push(obj);
		}

		return objects;
	}
}