import { Scene } from "../scene";
import { Object } from "../object";
import { InstancedUniforms, PhongUniforms, PostEchoUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";
import { generateTextMesh } from "../parse";

export class EchoScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "echo";
		this.spawnPos = new Vec3(0, 1.8, 0);

		this.postUniforms = new PostEchoUniforms();

		this.phong.light.pos = new Vec3(0, 10, 0);

		this.preload = {
			shaders: ["post/echo.frag.wgsl", "world/phong.frag.wgsl", "world/instanced.vert.wgsl"],
			textures: ["colors/white.png"],
			meshes: ["quad.obj", "monke.obj", "uvsphere.obj"],
		};
	}

	async init(assets: Assets) {
		this.postShader = await assets.loadShader("post/echo.frag.wgsl");

		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 2, -2), new Vec3(), 1.0);
		obj.mesh = generateTextMesh(":text1.obj", await assets.loadFont("noto_outline.fnt"), "[E] to fire pulse", 0.5, "center");
		obj.textures = [await assets.loadTexture("fonts/noto_outline.png")];
		this.objects.push(obj);

		obj = new Object();
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.model = Mat4.transform(new Vec3(), new Vec3(), 20);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.mesh = await assets.loadMesh("monke.obj");
		obj.vertShader = await assets.loadShader("world/instanced.vert.wgsl");
		obj.vertUniforms = new InstancedUniforms();
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;

		let count = 1000;
		let range = 100;
		let inst = obj.vertUniforms as InstancedUniforms;
		inst.instanceCount = count;
		for (let i=0; i<count; i++) {
			let model = Mat4.translate(new Vec3(Math.random()*range - range/2, Math.random()*range - range/2, Math.random()*range - range/2)).mul(Mat4.rotateIntrinsic(new Vec3(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI)));
			inst.models.push(model);
			inst.normals.push(model.inverse().transpose());
		}
		this.objects.push(obj);

		obj = new Object();
		obj.tags = ["pulse_source"];
		obj.mesh = await assets.loadMesh("uvsphere.obj");
		obj.textures = [await assets.loadTexture("colors/white.png")];
		obj.model = Mat4.transform(new Vec3(0, 10, 0), new Vec3(), 1);
		this.objects.push(obj);
	}

	lastPulseTime = 0;
	async update(time: number, deltaTime: number, player: Player, assets: Assets) {
		let src = this.getObject("pulse_source")!;
		src.model = Mat4.transform(new Vec3(Math.cos(time)*10, 2, Math.sin(time)*10), new Vec3(), 1);
		src.update = true;
		if (time - this.lastPulseTime > 1.6) {
			this.sendPulse(src.model.mulVec(new Vec3()), new Vec4(Math.random(), Math.random(), Math.random(), 1), time);
			this.lastPulseTime = time;
		}
	}

	async interact(time: number, player: Player, assets: Assets) {
		this.sendPulse(player.position, new Vec4(1, 1, 1, 1), time);
	}

	sendPulse(origin: Vec3, color: Vec4, time: number) {
		let u = this.postUniforms as PostEchoUniforms;
		u.pulse_origins.unshift(new Vec3(origin.x, origin.y, origin.z));
		u.pulse_origins.pop();
		u.pulse_times.unshift(time);
		u.pulse_times.pop();
		u.pulse_colors.unshift(color);
		u.pulse_colors.pop();
	}
}