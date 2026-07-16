import type { FragShaderPath, MeshPath, MaterialPath, TexturePath, VertShaderPath } from "./assets";
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
    /** set true if object has changed since last frame, otherwise skip uniform updates */
    changed: boolean = true;

    /** mesh color multiplier, with transparency */
    color: Vec4 = new Vec4(1.0, 1.0, 1.0, 1.0);
    /** path to .obj or .json mesh file in public/meshes/, or dynamic label. actual data later loaded by renderer from assets */
    mesh: MeshPath = "triangle.json";
    /** paths to .png or .jpg texture files in public/textures/ or material label or dynamic label, assigned to textures in shader bindgroup 1, bindings 2.. */
    textures: TexturePath[] = ["test.png"];
    /** worldspace transform */
    model: Mat4 = new Mat4();
    /** custom value written to mask framebuffer, for postprocessing pass, u8 [0, 255] */
    mask: number = 0;
    /** 0 = no culling, 1 = backface culling, -1 = frontface culling */
    cull: number = 0.0;
    /** scaling factor for texture coordinates */
    uv_scale: number = 1.0;
    /** used for draw order, lower = closer to camera */
    z: number = 0.0;
    /** sort by player distance and sets fractional part of z index every frame, (0, 1) */
    zsort: boolean = false;
    /** if defined, object is deleted from scene when lifetime reaches 0 */
    lifetime?: number = undefined;
    
    /** path to .obj or .json mesh file in public/meshes/, used for fine collision detection */
    collider?: MeshPath = undefined;
    /** bounding box used to skip fine collision if present */
    bbox?: Bbox = undefined;
    /** path to .mtl file in public/meshes/, overrides @ labeled textures at asset load */
    mtl?: MaterialPath = undefined;

    /** path to .vert.wgsl file in public/shaders/ */
    vertShader: VertShaderPath = "world/base.vert.wgsl";
    /** path to .frag.wgsl file in public/shaders/ */
    fragShader: FragShaderPath = "world/base.frag.wgsl";

    /** uniform values for vert shader stage */
    vertUniforms: Uniforms = new Uniforms();
    /** uniform values for frag shader stage */
    fragUniforms: Uniforms = new Uniforms();

    /** custom config values for vertex shader that dont warrant a full uniform struct */
    vertConfig: Vec4 = new Vec4();
    /** custom config values for fragment shader that dont warrant a full uniform struct */
    fragConfig: Vec4 = new Vec4();

    constructor() {
        this.id = Math.floor(Math.random() * 2**32); // u32
    }
}
