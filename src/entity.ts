import type { Bbox } from "./bbox";
import { Uniforms } from "./uniforms";
import { Mat4, Vec4 } from "./vec";

export class Entity {
    id: number; // unique u32 id
    tags: string[] = []; // list of non-unique tags, used for querying
    visible: boolean = true; // set false to skip draw call
    collidable: boolean = true; // set false to skip collision detection
    changed: boolean = true; // set true if object has changed since last frame, otherwise skip uniform updates

    mesh: string = "triangle.json"; // path to .obj or .json mesh file in public/meshes/, actual data later loaded by renderer from assets
    textures: string[] = ["test.png"]; // paths to .png or .jpg texture files in public/textures/, maps to textures in shader bindgroup 1, bindings 1..=n
    color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
    model: Mat4 = new Mat4();
    mask: number = 0; // custom value written to mask framebuffer, for postprocessing pass
    cull: number = 0.0; // 0.0 = no culling, 1.0 = backface culling, -1.0 = frontface culling
    z: number = 0.0; // used for draw order, lower = closer to camera
    zsort: boolean = false; // sort by player distance and set z index every frame, in (0, 1)
    
    collider?: string = undefined; // path to .obj or .json mesh file in public/meshes/, used for fine collision detection
    bbox?: Bbox = undefined; // bounding box used to skip fine collision if present
    mtl?: string = undefined; // path to .mtl file, overrides first texture if specified

    vertShader: string = "world/base.vert.wgsl"; // path to .wgsl file in public/shaders/
    fragShader: string = "world/base.frag.wgsl";
    vertUniforms: Uniforms = new Uniforms();
    fragUniforms: Uniforms = new Uniforms();
    vertConfig: Vec4 = new Vec4(); // custom config values for shaders
    fragConfig: Vec4 = new Vec4();

    constructor() {
        this.id = Math.floor(Math.random() * 2**32); // u32
    }
}
