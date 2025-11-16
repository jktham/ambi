import type { CameraMode } from "../camera";
import { Scene, WorldObject } from "../scene";
import { InstancedUniforms, PhongUniforms } from "../uniforms";
import { Mat4, Vec3, Vec4 } from "../vec";

export class BrutalScene extends Scene {
	name = "brutal";
	cameraMode = "walk" as CameraMode;
	spawnPos = new Vec3(0, 2.0, 0);
	postShader = "post/noise.frag.wgsl";

	init() {
		let phong = new PhongUniforms();
		phong.lightPos = new Vec3(100, 300, 200);
		phong.lightColor = new Vec4(1.0, 0.2, 0.2, 1);
		phong.specularFactor = 0.0;

		const size = 21;
		const scale = 20.0;
		let tiles = getTiles();
		let cells = generateCells(size, tiles);

		let instanceModels: Map<string, Mat4[]> = new Map();
		for (let tile of tiles) {
			instanceModels.set(tile.mesh, []);
		}

		for (let i=0; i<size; i++) {
			for (let j=0; j<size; j++) {
				let tile = cells[i][j].candidates[0];
				if (!tile) continue;

				let colliderObj = new WorldObject();
				colliderObj.visible = false;
				colliderObj.model = Mat4.trs(new Vec3(i - Math.floor(size/2), 0.0, j - Math.floor(size/2)).mul(scale), new Vec3(0, tile.rotation*Math.PI/2.0, 0), scale / 10.0);
				colliderObj.collider = tile.mesh;
				colliderObj.bbox = [colliderObj.model.transform(new Vec3()).sub(scale/2), colliderObj.model.transform(new Vec3()).add(scale/2)];
				this.objects.push(colliderObj);

				instanceModels.get(tile.mesh)!.push(colliderObj.model);
			}
		}

		for (let [mesh, models] of instanceModels.entries()) {
			let u = new InstancedUniforms();
			u.models = models;
			u.normals = models.map(m => m.inverse().transpose());
			u.instanceCount = models.length;

			let tileObj = new WorldObject();
			tileObj.mesh = mesh;
			tileObj.textures = ["concrete.jpg"];
			tileObj.fragShader = "world/phong.frag.wgsl";
			tileObj.fragUniforms = phong;
			tileObj.vertShader = "world/instanced.vert.wgsl";
			tileObj.vertUniforms = u;
			this.objects.push(tileObj);
		}

		let sun = new WorldObject();
		sun.model = Mat4.trs(phong.lightPos, new Vec3(), 20.0);
		sun.mesh = "sphere.obj";
		sun.textures = ["blank.png"];
		sun.color = new Vec4(0.8, 0.1, 0.1, 1.0);
		this.objects.push(sun);
	}

	update(time: number, deltaTime: number, position: Vec3) {
		
	}
}

const sockets = ["path", "none", "tower"] as const;
type Socket = typeof sockets[number];

type Tile = {
	mesh: string;
	rotation: number; // 0-3
	sockets: Socket[][]; // NESW
	weight: number;
}

type Cell = {
	candidates: Tile[];
}

function getTiles(): Tile[] {
	let tiles: Tile[] = [];

	for (let r of [0, 1, 2, 3]) {
		let t: Tile = {
			mesh: "brutal/tiles/path_straight.obj",
			rotation: r,
			sockets: [["path"], ["none"], ["path"], ["none"]],
			weight: 1.2
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_cross.obj",
			rotation: r,
			sockets: [["path"], ["path"], ["path"], ["path"]],
			weight: 0.5
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_fork.obj",
			rotation: r,
			sockets: [["none"], ["path"], ["path"], ["path"]],
			weight: 1
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_end.obj",
			rotation: r,
			sockets: [["none"], ["none"], ["path"], ["none"]],
			weight: 1
		};
		tiles.push(t);
		t = {
			mesh: "brutal/tiles/path_turn.obj",
			rotation: r,
			sockets: [["none"], ["path"], ["path"], ["none"]],
			weight: 2
		};
		tiles.push(t);
		// t = {
		// 	mesh: "brutal/tiles/plaza.obj",
		// 	rotation: r,
		// 	sockets: [["path", "none"], ["path", "none"], ["path", "none"], ["path", "none"]],
		// 	weight: 0.05
		// };
		// tiles.push(t);
		t = {
			mesh: "brutal/tiles/tower.obj",
			rotation: r,
			sockets: [["path", "none"], ["path", "none"], ["path", "none"], ["path", "none"]],
			weight: 0.05
		};
		tiles.push(t);
	}

	return tiles;
}

function generateCells(size: number, tiles: Tile[]): Cell[][] {
	let cells: Cell[][] = new Array(size).fill([]).map(() => new Array(size));

	for (let i=0; i<size; i++) {
		for (let j=0; j<size; j++) {
			let c: Cell = {
				candidates: tiles
			};
			cells[i][j] = c;
		}
	}

	let maxEntropy = 0;
	let iterations = 0;
	while (maxEntropy != 1 && iterations < 10000) {
		iterations++;

		maxEntropy = 1;
		let minEntropy = Infinity;
		for (let i=0; i<size; i++) {
			for (let j=0; j<size; j++) {
				let entropy = cells[i][j].candidates.length;
				maxEntropy = Math.max(maxEntropy, entropy);
				if (entropy > 1) minEntropy = Math.min(minEntropy, entropy);
			}
		}

		let minCoords: [number, number][] = [];
		for (let i=0; i<size; i++) {
			for (let j=0; j<size; j++) {
				let entropy = cells[i][j].candidates.length;
				if (entropy == minEntropy) {
					minCoords.push([i, j]);
				}
			}
		}

		if (minCoords.length > 0) {
			let collapseCoords = minCoords[Math.floor(Math.random() * minCoords.length)];
			let collapseCell = cells[collapseCoords[0]][collapseCoords[1]];

			let weightSum = collapseCell.candidates.map((t) => t.weight).reduce((weight, sum) => weight + sum);
			let weightPrefix = collapseCell.candidates.map((t) => t.weight / weightSum);
			for (let i=1; i<weightPrefix.length; i++) {
				weightPrefix[i] += weightPrefix[i-1];
			}
			let r = Math.random();
			for (let i=0; i<weightPrefix.length; i++) {
				if (r <= weightPrefix[i] || i == weightPrefix.length-1) {
					collapseCell.candidates = [collapseCell.candidates[i]];
					break;
				}
			}

			let neighbors: (Cell|undefined)[] = [
				collapseCoords[1]-1 >= 0 ? cells[collapseCoords[0]][collapseCoords[1]-1] : undefined, // N
				collapseCoords[0]+1 < size ? cells[collapseCoords[0]+1][collapseCoords[1]] : undefined, // E
				collapseCoords[1]+1 < size ? cells[collapseCoords[0]][collapseCoords[1]+1] : undefined, // S
				collapseCoords[0]-1 >= 0 ? cells[collapseCoords[0]-1][collapseCoords[1]] : undefined, // W
			];
			for (let i=0; i<4; i++) {
				let n = neighbors[i];
				let c = collapseCell.candidates[0];
				if (!n) continue;

				n.candidates = n.candidates.filter((t) => {
					for (let s of t.sockets[(i + t.rotation + 2) % 4]) {
						if (c.sockets[(i + c.rotation) % 4].includes(s)) return true;
					}
				});
			}
		}
	}

	return cells;
}
