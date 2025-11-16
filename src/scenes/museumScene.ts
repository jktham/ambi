import { engine } from "../main";
import { Scene, WorldObject } from "../scene";
import { Trigger } from "../trigger";
import { PostOutlineUniforms } from "../uniforms";
import { Mat4, Vec2, Vec3, Vec4 } from "../vec";

export class MuseumScene extends Scene {
	name = "museum";
	resolution = new Vec2(1920, 1080);
	cameraMode: "fly" | "walk" = "walk";
	postShader = "post/outline.frag.wgsl";
	postUniforms = new PostOutlineUniforms();

	constructor() {
		super();

		this.postUniforms.scale.fill(2);
		this.postUniforms.mode[0] = 1;
		this.postUniforms.color[0] = new Vec4(0, 0, 0, 1);
		this.postUniforms.mode[1] = 1;
		this.postUniforms.color[1] = new Vec4(0, 0, 0, 1);
		this.postUniforms.mode[2] = 1;
		this.postUniforms.color[2] = new Vec4(0, 0, 0, 1);
	}
	
	init() {
		let obj = new WorldObject();
		obj.mesh = "museum/room.obj";
		obj.collider = "museum/room.obj";
		obj.textures[0] = "blank.png";
		obj.mask = 0;
		this.objects.push(obj);

		let scenes = ["debug", "pier", "brutal"];
		let positions = [
			new Vec3(-5, 0, -13),
			new Vec3(0, 0, -13),
			new Vec3(5, 0, -13),
		];
		let colors = [
			new Vec4(1, 1, 1, 1),
			new Vec4(1, 1, 1, 1),
			new Vec4(1, 1, 1, 1),
		];

		for (let i=0; i<scenes.length; i++) {
			obj = new WorldObject();
			obj.model = Mat4.translate(positions[i]);
			obj.mesh = "museum/door.obj";
			obj.textures[0] = "blank.png";
			obj.color = colors[i];
			obj.fragShader = "world/noise.frag.wgsl";
			obj.mask = 1;
			this.objects.push(obj);

			obj = new WorldObject();
			obj.model = Mat4.translate(positions[i]);
			obj.mesh = "museum/doorframe.obj";
			obj.collider = "museum/doorframe.obj";
			obj.textures[0] = "blank.png";
			obj.mask = 2;
			this.objects.push(obj);

			let t = new Trigger();
			t.bbox = [
				positions[i].sub(new Vec3(1, 2, 0.4)),
				positions[i].add(new Vec3(1, 2, 0.4)),
			];
			console.log(t.bbox)
			t.onEnter = async () => await engine.setScene(scenes[i]);
			this.triggers.push(t);
		}

	}

	update(time: number, deltaTime: number, position: Vec3) {
		
	}
}