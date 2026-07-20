import type { MeshPath, MaterialPath, TexturePath, WorldVertShaderPath, WorldFragShaderPath } from "./assets";
import type { Bbox } from "./bbox";
import { Uniforms } from "./uniforms";
import { Mat4, Vec4 } from "./vec";

export type oid = number;

export class Object {
    /** unique u32 id */
    id: oid;
    /** list of non-unique tags, used for querying */
    tags: string[] = [];
    /** set false to skip draw call */
    visible: boolean = true;
    /** set false to skip collision detection */
    collidable: boolean = true;
    /** set false to skip draw call in shadow pass */
    shadows: boolean = true;
    /** whether to draw in portal_i pass, should be length of scene portals or undefined */
    portal_visible?: boolean[];
    /** set true if object has changed since last frame, otherwise skip buffer updates */
    changed: boolean = true;

    /** mesh color multiplier, with transparency */
    color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
    /** mesh path, data later loaded by renderer from assets */
    mesh: MeshPath = "triangle.json";
    /** texture path, assigned to textures in shader bindgroup 1, bindings 2.. */
    textures: TexturePath[] = ["test.png"];
    /** worldspace transform */
    model: Mat4 = new Mat4();
    /** custom value written to mask framebuffer, for postprocessing pass, u8 [0, 255] */
    mask: number = 0;
    /** 0 = no culling, 1 = backface culling, -1 = frontface culling */
    cull: number = 0;
    /** scaling factor for texture coordinates */
    uv_scale: number = 1.0;
    /** used for draw order, lower = closer to camera */
    z: number = 0.0;
    /** sort by player distance and sets fractional part of z index every frame, (0, 1) */
    z_sort: boolean = false;
    /** remaining lifetime in seconds, if defined object is deleted from scene when lifetime reaches 0 */
    lifetime?: number = undefined;
    
    /** mesh path, used for fine collision detection */
    collider?: MeshPath = undefined;
    /** bounding box used to skip fine collision if present */
    bbox?: Bbox = undefined;
    /** mtl path, resolves material label textures at asset load */
    mtl?: MaterialPath = undefined;

    /** world vertex shader */
    vertShader: WorldVertShaderPath = "world/base.vert.wgsl";
    /** world fragment shader */
    fragShader: WorldFragShaderPath = "world/base.frag.wgsl";

    /** uniform values for vertex shader stage */
    vertUniforms: Uniforms = new Uniforms();
    /** uniform values for fragment shader stage */
    fragUniforms: Uniforms = new Uniforms();

    /** custom config values for vertex shader that dont warrant a full uniform struct */
    vertConfig: Vec4 = new Vec4();
    /** custom config values for fragment shader that dont warrant a full uniform struct */
    fragConfig: Vec4 = new Vec4();

    constructor() {
        this.id = Math.floor(Math.random() * 2**32); // u32
    }
}
