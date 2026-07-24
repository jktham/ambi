import { Scene } from "../scene";
import { Object } from "../object";
import { InstancedUniforms, PhongUniforms, PostEchoUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";

export class DebugEchoScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_echo";
		this.spawnPos = new Vec3(0, 1.8, 0);

		this.postShader = "post/echo.frag.wgsl";
		this.postUniforms = new PostEchoUniforms();

		this.phong.light.pos = new Vec3(0, 10, 0);
	}

	init() {
		let obj = new Object();
		obj.mesh = "quad.obj";
		obj.model = Mat4.transform(new Vec3(), new Vec3(), 20);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.mesh = "monke.obj";
		obj.vertShader = "world/instanced.vert.wgsl";
		obj.vertUniforms = new InstancedUniforms();
		obj.fragShader = "world/phong.frag.wgsl";
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
		obj.mesh = "sphere.obj";
		obj.textures = ["white.png"];
		obj.model = Mat4.transform(new Vec3(0, 10, 0), new Vec3(), 1);
		this.objects.push(obj);
	}

	lastPulseTime = 0;
	update(time: number, deltaTime: number, player: Player) {
		let src = this.getObject("pulse_source")!;
		src.model = Mat4.transform(new Vec3(Math.cos(time)*10, 2, Math.sin(time)*10), new Vec3(), 1);
		src.changed = true;
		if (time - this.lastPulseTime > 1.6) {
			this.sendPulse(src.model.mulVec(new Vec3()), new Vec4(Math.random(), Math.random(), Math.random(), 1), time);
			this.lastPulseTime = time;
		}
	}

	interact(time: number, player: Player) {
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