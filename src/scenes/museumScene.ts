import { Bbox } from "../bbox";
import type { CameraMode } from "../camera";
import { engine } from "../main";
import { Scene, WorldObject } from "../scene";
import { Trigger } from "../trigger";
import { InstancedUniforms, PhongUniforms, PostOutlineUniforms } from "../uniforms";
import { rnd, rndarr, rndvec } from "../utils";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class MuseumScene extends Scene {
	name = "museum";
	resolution = new Vec2(1920, 1080);
	cameraMode: CameraMode = "walk";
	spawnPos: Vec3 = new Vec3(0.001, 2, 0.001);
	postShader = "post/outline.frag.wgsl";
	postUniforms = new PostOutlineUniforms();

	roomSlots: number[] = [0, 1, 2, 3, 4]; // CNESW
	roomObjects: WorldObject[][] = [[], [], [], [], []];
	roomTriggers: Trigger[][] = [[], [], [], [], []];

	constructor() {
		super();

		this.postUniforms.scale.fill(2);
		this.postUniforms.mode.fill(1);
		this.postUniforms.color = this.postUniforms.color.map(_ => new Vec4(0, 0, 0, 1));
		this.postUniforms.color[15] = new Vec4(1, 1, 1, 1);
	}
	
	init() {
		let phong = new PhongUniforms();
		phong.lightPos = new Vec3(400, 1200, 800);
		phong.ambientFactor = 0.8;
		phong.diffuseFactor = 0.2;
		phong.specularFactor = 0.0;

		// room 0
		let r = 0;
		let [o, t] = this.createRoom(phong);
		this.roomObjects[r].push(...o);
		this.roomTriggers[r].push(...t);
		
		[o, t] = this.createPortals(phong, [
			["pier", "field"], 
			["brutal", "debug"], 
			["pier", "field"], 
			["debug_dither", "debug_outline"]
		]);
		this.roomObjects[r].push(...o);
		this.roomTriggers[r].push(...t);

		o = this.createWindows(phong);
		this.roomObjects[r].push(...o);

		// room 1
		r = 1;
		[o, t] = this.createRoom(phong);
		this.roomObjects[r].push(...o);
		this.roomTriggers[r].push(...t);

		for (let i=0; i<7; i++) {
			let obj = new WorldObject();
			obj.tags = [`lod${i}`, "rotate"];
			obj.model = Mat4.trs(new Vec3(0, 3.5, 0), new Vec3(0, 0, 0), 3);
			obj.mesh = `museum/monke_lod${i}.obj`;
			obj.textures[0] = "blank.png";
			obj.mask = 0;
			obj.fragShader = "world/rainbow.frag.wgsl";
			obj.vertShader = "world/glitch.vert.wgsl";
			this.roomObjects[r].push(obj);
		}

		// room 2
		r = 2;
		[o, t] = this.createRoom(phong);
		this.roomObjects[r].push(...o);
		this.roomTriggers[r].push(...t);

		let obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 1, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);

		// room 3
		r = 3;
		[o, t] = this.createRoom(phong);
		this.roomObjects[r].push(...o);
		this.roomTriggers[r].push(...t);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0.2, 1, 0.4);
		obj.collider = "cube.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 0;
		obj.cull = 1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);
		
		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(10, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(1, 0, 0.86, 0.0001);
		obj.collider = "cube.obj";
		obj.textures[0] = "test_trans.png";
		obj.mask = 0;
		obj.cull = 0.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);
		
		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(-10, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 1, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "test_trans2.png";
		obj.mask = 0;
		obj.cull = 0.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);
		
		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 2, 10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 15;
		obj.cull = -1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);
		
		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 2, -10), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(0, 0, 0, 0.1);
		obj.collider = "cube.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 0;
		obj.cull = 1.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);

		// room 4
		r = 4;
		[o, t] = this.createRoom(phong);
		this.roomObjects[r].push(...o);
		this.roomTriggers[r].push(...t);

		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 2, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "cube.obj";
		obj.color = new Vec4(1, 0, 1, 1);
		obj.collider = "cube.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.roomObjects[r].push(obj);

		// concat
		this.applyRoomOffsets();
		this.objects.push(...this.roomObjects.flat());
		this.triggers.push(...this.roomTriggers.flat());

		// outer rooms
		obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "museum/room.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		obj.vertShader = "world/instanced.vert.wgsl";
		let uniforms = new InstancedUniforms();
		uniforms.instanceCount = 4;
		uniforms.models = [
			Mat4.trs(new Vec3(0, 0, -88), new Vec3(0, 0, 0), 1),
			Mat4.trs(new Vec3(88, 0, 0), new Vec3(0, 0, 0), 1),
			Mat4.trs(new Vec3(0, 0, 88), new Vec3(0, 0, 0), 1),
			Mat4.trs(new Vec3(-88, 0, 0), new Vec3(0, 0, 0), 1),
		];
		uniforms.normals = uniforms.models.map(m => m.inverse().transpose());
		obj.vertUniforms = uniforms;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, position: Vec3) {
		if (position.z < -22) {
			position.z += 44;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(1);
			this.applyRoomOffsets();
		}
		if (position.x > 22) {
			position.x -= 44;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(2);
			this.applyRoomOffsets();
		}
		if (position.z > 22) {
			position.z -= 44;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(3);
			this.applyRoomOffsets();
		}
		if (position.x < -22) {
			position.x += 44;
			this.applyRoomOffsets(-1);
			this.shuffleRooms(4);
			this.applyRoomOffsets();
		}

		let lodDistances = [10, 13, 16, 19, 22, 25, 1000];
		let lodObjects: WorldObject[][] = [];
		for (let i=0; i<7; i++) {
			lodObjects.push(this.getObjects(`lod${i}`));
		}
		for (let i=0; i<lodObjects.length; i++) {
			for (let obj of lodObjects[i]) {
				let dist = position.sub(obj.model.transform(new Vec3(0, 0, 0))).length();
				if (i == 0) {
					obj.visible = dist < lodDistances[i] ? true : false;
					obj.collidable = dist < lodDistances[i] ? true : false;
				} else {
					obj.visible = dist < lodDistances[i] && dist >= lodDistances[i-1] ? true : false;
					obj.collidable = dist < lodDistances[i] && dist >= lodDistances[i-1] ? true : false;
				}
			}
		}

		let rotateObjects = this.getObjects("rotate");
		for (let obj of rotateObjects) {
			obj.model = obj.model.mul(Mat4.rotate(new Vec3(0, 0.5 * deltaTime, 0)));
			obj.changed = true;
		}
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

		for (let r=0; r<5; r++) {
			let offset = offsets[this.roomSlots.findIndex(v => v == r)];
			for (let obj of this.roomObjects[r]) {
				obj.model = Mat4.translate(offset).mul(obj.model);
				obj.collidable = this.roomSlots[0] == r; // only collidable if in current room
				obj.z %= 100000.0;
				obj.z += this.roomSlots[0] == r ? 100000.0 : 0.0; // draw current room first
				obj.changed = true;
			}
			for (let t of this.roomTriggers[r]) {
				t.bbox.model = Mat4.translate(offset).mul(t.bbox.model);
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
		let freeRooms = [0, 1, 2, 3, 4].filter(r => r != nextRoom && r != currRoom);

		for (let slot of freeSlots) {
			let randomRoom = freeRooms[Math.floor(rnd(0, freeRooms.length))];
			freeRooms = freeRooms.filter(r => r != randomRoom);
			this.roomSlots[slot] = randomRoom;
		}
	}

	createRoom(phong: PhongUniforms): [WorldObject[], Trigger[]] {
		let objects: WorldObject[] = [];
		let triggers: Trigger[] = [];

		let obj = new WorldObject();
		obj.model = Mat4.trs(new Vec3(0, 0, 0), new Vec3(0, 0, 0), 1);
		obj.mesh = "museum/room.obj";
		obj.collider = "museum/room.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 1;
		obj.z = 1000.0;
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
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
			let obj = new WorldObject();
			obj.model = Mat4.trs(positions[i], rotations[i], 1);
			obj.mesh = `museum/tunnel.obj`;
			obj.collider = `museum/tunnel.obj`;
			obj.textures[0] = "blank.png";
			obj.mask = 2;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = phong;
			objects.push(obj);
		}

		positions = [
			new Vec3(17, 0, -17),
			new Vec3(17, 0, 17),
			new Vec3(-17, 0, 17),
			new Vec3(-17, 0, -17),
		];
		for (let i=0; i<4; i++) {
			let obj = new WorldObject();
			obj.model = Mat4.translate(positions[i]);
			obj.mesh = `museum/pillar.obj`;
			obj.collider = `museum/pillar.obj`;
			obj.textures[0] = "blank.png";
			obj.mask = 3;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = phong;
			objects.push(obj);
		}

		return [objects, triggers];
	}

	createPortals(phong: PhongUniforms, scenes: string[][]): [WorldObject[], Trigger[]] {
		let objects: WorldObject[] = [];
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

				let obj = new WorldObject();
				obj.model = Mat4.trs(positions[i][j], rotations[i], 1);
				obj.mesh = `museum/portal_h.obj`;
				obj.textures[0] = "blank.png";
				obj.fragShader = "world/noise.frag.wgsl";
				obj.mask = 1;
				objects.push(obj);

				obj = new WorldObject();
				obj.model = Mat4.trs(positions[i][j], rotations[i], 1);
				obj.mesh = `museum/portal_frame.obj`;
				obj.collider = `museum/portal_frame.obj`;
				obj.textures[0] = "blank.png";
				obj.mask = 2;
				obj.fragShader = "world/phong.frag.wgsl";
				obj.fragUniforms = phong;
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

	createWindows(phong: PhongUniforms): WorldObject[] {
		let objects: WorldObject[] = [];
		let textures: string[][] = [
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

		let instances: Map<string, Mat4[]> = new Map();
		for (let i=0; i<5; i++) {
			for (let texture of textures[i]) {
				let [min, max] = wallDimensions[i];

				let position = rndvec(min, max);
				let rotation = rndarr(wallRotations[i]);
				let dist = Math.min(...occupiedPositions[i].map(p => p.sub(position).mul(new Vec3(1, i == 4 ? 1 : 0.5, 1)).length()), 100);
				let iterations = 0;

				while (dist < (i == 4 ? 6 : 4) && iterations < 100) {
					position = rndvec(min, max);
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
			let obj = new WorldObject();
			obj.mesh = `museum/portal_h.obj`;
			obj.textures[0] = texture;
			obj.fragShader = "world/skybox.frag.wgsl";
			obj.mask = 1;
			obj.vertShader = "world/instanced.vert.wgsl";
			obj.vertUniforms = new InstancedUniforms();
			(obj.vertUniforms as InstancedUniforms).instanceCount = models.length;
			(obj.vertUniforms as InstancedUniforms).models = models;
			(obj.vertUniforms as InstancedUniforms).normals = models.map(m => m.inverse().transpose());
			objects.push(obj);

			obj = new WorldObject();
			obj.mesh = `museum/portal_frame.obj`;
			obj.textures[0] = "blank.png";
			obj.mask = 2;
			obj.fragShader = "world/phong.frag.wgsl";
			obj.fragUniforms = phong;
			obj.vertShader = "world/instanced.vert.wgsl";
			obj.vertUniforms = new InstancedUniforms();
			(obj.vertUniforms as InstancedUniforms).instanceCount = models.length;
			(obj.vertUniforms as InstancedUniforms).models = models;
			(obj.vertUniforms as InstancedUniforms).normals = models.map(m => m.inverse().transpose());
			objects.push(obj);
		}

		return objects;
	}
}