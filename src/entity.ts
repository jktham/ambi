import type { Bbox } from "./bbox";
import { Uniforms } from "./uniforms";
import { Mat4, Vec4 } from "./vec";

export type eid = number;

export class Entity {
    /** unique u32 id */
    id: eid;
    /** list of non-unique tags, used for querying */
    tags: string[] = [];
    /** set false to skip draw call */
    visible: boolean = true;
    /** set false to skip collision detection */
    collidable: boolean = true;
    /** set true if object has changed since last frame, otherwise skip uniform updates */
    changed: boolean = true;

    /** path to .obj or .json mesh file in public/meshes/, actual data later loaded by renderer from assets */
    mesh: string = "triangle.json";
    /** paths to .png or .jpg texture files in public/textures/, maps to textures in shader bindgroup 1, bindings 1..=n */
    textures: string[] = ["test.png"];
    /** color multiplier used by built in shaders */
    color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
    /** object to world transform */
    model: Mat4 = new Mat4();
    /** custom value written to mask framebuffer, for postprocessing pass */
    mask: number = 0;
    /** 0.0 = no culling, 1.0 = backface culling, -1.0 = frontface culling */
    cull: number = 0.0;
    /** used for draw order, lower = closer to camera */
    z: number = 0.0;
    /** sort by player distance and set z index every frame, in (0, 1) */
    zsort: boolean = false;
    
    /** path to .obj or .json mesh file in public/meshes/, used for fine collision detection */
    collider?: string = undefined;
    /** bounding box used to skip fine collision if present */
    bbox?: Bbox = undefined;
    /** path to .mtl file, overrides first texture if specified */
    mtl?: string = undefined;

    /** path to .vert.wgsl file in public/shaders/ */
    vertShader: string = "world/base.vert.wgsl";
    /** path to .frag.wgsl file in public/shaders/ */
    fragShader: string = "world/base.frag.wgsl";

    vertUniforms: Uniforms = new Uniforms();
    fragUniforms: Uniforms = new Uniforms();

    /** custom config values for vertex shader that dont warrant a full uniform struct */
    vertConfig: Vec4 = new Vec4();
    /** custom config values for fragment shader that dont warrant a full uniform struct */
    fragConfig: Vec4 = new Vec4();

    constructor() {
        this.id = Math.floor(Math.random() * 2**32); // u32
    }
}
