import type { Camera } from "../camera";
import { Scene, WorldObject } from "../scene";
import { InstancedUniforms, PhongUniforms, PostEchoUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";

export class DebugEchoScene extends Scene {
	name = "debug_echo";
	spawnPos = new Vec3(0, 1.8, 0);

	postShader = "post/echo.frag.wgsl";
	postUniforms = new PostEchoUniforms();
	
	init() {
		this.objects = [];

		let phong = new PhongUniforms();
		phong.light_pos = new Vec3(0, 10, 0);

		let obj = new WorldObject();
		obj.mesh = "quad.obj";
		obj.model = Mat4.trs(new Vec3(), new Vec3(), 20);
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;
		this.objects.push(obj);

		obj = new WorldObject();
		obj.mesh = "monke.obj";
		obj.vertShader = "world/instanced.vert.wgsl";
		obj.vertUniforms = new InstancedUniforms();
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = phong;

		let count = 1000;
		let range = 100;
		let inst = obj.vertUniforms as InstancedUniforms;
		inst.instanceCount = count;
		for (let i=0; i<count; i++) {
			let model = Mat4.translate(new Vec3(Math.random()*range - range/2, Math.random()*range - range/2, Math.random()*range - range/2)).mul(Mat4.rotate(new Vec3(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI)));
			inst.models.push(model);
			inst.normals.push(model.inverse().transpose());
		}
		this.objects.push(obj);

		obj = new WorldObject();
		obj.tags = ["pulse_source"];
		obj.mesh = "sphere.obj";
		obj.textures = ["blank.png"];
		obj.model = Mat4.trs(new Vec3(0, 10, 0), new Vec3(), 1);
		this.objects.push(obj);
	}

	lastPulseTime = 0;
	update(time: number, deltaTime: number, camera: Camera) {
		let src = this.getObject("pulse_source")!;
		src.model = Mat4.trs(new Vec3(Math.cos(time)*10, 2, Math.sin(time)*10), new Vec3(), 1);
		src.changed = true;
		if (time - this.lastPulseTime > 1.6) {
			this.sendPulse(src.model.transform(new Vec3()), new Vec4(Math.random(), Math.random(), Math.random(), 1), time);
			this.lastPulseTime = time;
		}
	}

	interact(time: number, camera: Camera) {
		this.sendPulse(camera.position, new Vec4(1, 1, 1, 1), time);
	}

	sendPulse(origin: Vec3, color: Vec4, time: number) {
		this.postUniforms.pulse_origins.unshift(new Vec3(origin.x, origin.y, origin.z));
		this.postUniforms.pulse_origins.pop();
		this.postUniforms.pulse_times.unshift(time);
		this.postUniforms.pulse_times.pop();
		this.postUniforms.pulse_colors.unshift(color);
		this.postUniforms.pulse_colors.pop();
	}
}