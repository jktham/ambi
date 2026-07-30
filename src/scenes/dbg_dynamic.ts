import { Scene } from "../scene";
import { Object } from "../object";
import { PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";
import type { Player } from "../player";
import type { Assets } from "../assets";

export class DebugDynamicScene extends Scene {
	phong = new PhongUniforms();

	constructor() {
		super();

		this.name = "dbg_dynamic";
		this.spawnPos = new Vec3(0, 0, 5);

		this.phong.light.pos = new Vec3(0, 10, 0);

		this.preload = {
			shaders: ["world/phong.frag.wgsl", "world/skybox.frag.wgsl"],
			textures: ["test.png"],
			meshes: ["quad_vertical.obj", "cube.obj", "quad.obj"],
			colliders: ["quad_vertical.obj"],
			fonts: [],
		};
	}
	
	async init(assets: Assets) {
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
		assets.addDynamicTexture(":dynTexture", new Uint8ClampedArray(dynTexture), 2, 2);

		let obj = new Object();
		obj.model = Mat4.transform(new Vec3(-3, 0, -5), new Vec3(), 1);
		obj.mesh = await assets.loadMesh("quad_vertical.obj");
		obj.collider = await assets.loadCollider("quad_vertical.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, 0, -5), new Vec3(), 1);
		obj.mesh = await assets.loadMesh(":dynMesh");
		obj.collider = await assets.loadCollider(":dynMesh");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(3, 0, -5), new Vec3(), 1);
		obj.mesh = await assets.loadMesh(":dynMesh");
		obj.collider = await assets.loadCollider(":dynMesh");
		obj.textures = [await assets.loadTexture(":dynTexture")];
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		this.objects.push(obj);
		
		
		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 20);
		obj.mesh = await assets.loadMesh("cube.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/skybox.frag.wgsl");
		obj.z = 1000.0;
		this.objects.push(obj);

		obj = new Object();
		obj.model = Mat4.transform(new Vec3(0, -5, 0), new Vec3(), 10);
		obj.mesh = await assets.loadMesh("quad.obj");
		obj.textures = [await assets.loadTexture("test.png")];
		obj.color = new Vec4(0.8, 0.8, 0.8, 1.0);
		obj.fragShader = await assets.loadShader("world/phong.frag.wgsl");
		obj.fragUniforms = this.phong;
		obj.z = 900.0;
		this.objects.push(obj);
	}

	async update(time: number, deltaTime: number, player: Player, assets: Assets) {

	}
}