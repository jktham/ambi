import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugDynamicScene extends Scene {
	name = "dbg_dynamic";
	spawnPos = new Vec3(0, 0, 5);

	phong = new PhongUniforms();

	generateAssets(assets: Assets) {
		let dynMesh = [ // pos, normal, color, uv, tangent
			[ 1.0,  1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0, 1.0], [1.0, 1.0], [0.0, 0.0, 0.0],
		    [-1.0, -1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0], [0.0, 0.0], [0.0, 0.0, 0.0],
			[ 1.0, -1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0, 1.0], [1.0, 0.0], [0.0, 0.0, 0.0],
		    [ 1.0,  1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0, 1.0], [1.0, 1.0], [0.0, 0.0, 0.0],
			[-1.0,  1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0, 1.0], [0.0, 1.0], [0.0, 0.0, 0.0],
			[-1.0, -1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 1.0, 0.0, 1.0], [0.0, 0.0], [0.0, 0.0, 0.0],
		].flat();
		assets.addDynamicMesh(":dynMesh", new Float32Array(dynMesh));

		let dynTexture = [
			[1.0, 1.0, 1.0, 1.0], [0.8, 0.8, 0.8, 1.0],
			[0.8, 0.8, 0.8, 1.0], [1.0, 1.0, 1.0, 0.5],
		].flat().map(f => Math.floor(f*255));
		assets.addDynamicTexture(":dynTexture", new ImageData(new Uint8ClampedArray(dynTexture), 2, 2));
	}
	
	init() {
		this.phong.light.pos = new Vec3(0, 10, 0);
		
		let obj = new Object();
		obj.model = Mat4.trs(new Vec3(-3, 0, -5), new Vec3(), 1);
		obj.mesh = "quad_vertical.obj";
		obj.collider = "quad_vertical.obj";
		obj.textures = ["test.png"];
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(0, 0, -5), new Vec3(), 1);
		obj.mesh = ":dynMesh";
		obj.collider = ":dynMesh";
		obj.textures = ["test.png"];
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.trs(new Vec3(3, 0, -5), new Vec3(), 1);
		obj.mesh = ":dynMesh";
		obj.collider = ":dynMesh";
		obj.textures = [":dynTexture"];
		obj.fragShader = "world/phong.frag.wgsl";
		obj.fragUniforms = this.phong;
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
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	update(time: number, deltaTime: number, player: Player) {

	}
}