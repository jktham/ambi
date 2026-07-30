import { type Mesh, type Texture, type BuiltinTextureLabel, type Shader, MESH_STRIDE, type Collider } from "./assets";
import type { Bbox } from "./bbox";
import { Uniforms } from "./uniforms";
import { Mat4, Vec4 } from "./vec";

const defaultMesh: Mesh = {
    path: "none.obj",
    data: new Float32Array(),
    size: 0,
    stride: MESH_STRIDE,
};

const defaultTexture: Texture = {
    path: "none.png",
    data: new Uint8ClampedArray([255, 255, 255, 255]),
    width: 1,
    height: 1,
};

const defaultVertShader: Shader = {
    path: "world/base.vert.wgsl",
    code: `
        struct VertexIn {
            @location(0) pos: vec3f, // object space
            @location(1) normal: vec3f,
            @location(2) color: vec4f,
            @location(3) uv: vec2f,
            @location(4) tangent: vec3f, // GL tangent
        };

        struct VertexOut {
            @builtin(position) ndc: vec4f, // -1..1
            @location(0) pos: vec3f, // world space
            @location(1) normal: vec3f,
            @location(2) color: vec4f,
            @location(3) uv: vec2f,
            @location(4) tangent: vec3f, // GL tangent
            @location(5) bary: vec3f, // barycentric triangle coords, 0..1
            @location(6) shadow_space: vec4f, // -1..1
        };

        struct FragmentIn {
            @builtin(position) screen: vec4f, // 0..res
            @location(0) pos: vec3f, // world space
            @location(1) normal: vec3f,
            @location(2) color: vec4f,
            @location(3) uv: vec2f,
            @location(4) tangent: vec3f, // GL tangent
            @location(5) bary: vec3f, // barycentric triangle coords, 0..1
            @location(6) shadow_space: vec4f, // -1..1
        };

        struct FragmentOut {
            @location(0) color: vec4f,
            @location(1) pos_depth: vec4f,
            @location(2) normal_mask: vec4f,
        };

        /// world frag shader output
        struct FbData {
            color: vec4f,
            pos: vec3f,
            depth: f32,
            normal: vec3f,
            mask: u32,
        };

        /// global world pass uniforms
        struct GlobalUniforms {
            time: f32,
            frame: f32,
            fov: f32,
            resolution: vec2f,
            view_pos: vec3f,
            view: mat4x4f,
            view_inv: mat4x4f,
            projection: mat4x4f,
            shadow_transform: mat4x4f,
        };

        /// per object world pass uniforms
        struct ObjectUniforms {
            mask: f32,
            cull: f32,
            id: f32,
            uv_scale: f32,
            color: vec4f,
            vert_config: vec4f,
            frag_config: vec4f,
            model: mat4x4f,
            normal: mat4x4f,
        };

        /// base post pass uniforms
        struct PostUniforms {
            time: f32,
            frame: f32,
            resolution: vec2f,
            post_config: vec4f,
            view: mat4x4f,
            projection: mat4x4f,
        };

        /// encode world pass output data into framebuffers
        fn encodeFbData(data: FbData) -> FragmentOut {
            var out: FragmentOut;
            out.color = data.color;
            out.pos_depth = vec4f(data.pos, data.depth);
            out.normal_mask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
            return out;
        }

        /// decode post pass input framebuffers back into data
        fn decodeFbData(pixel: vec2i, fb_color: texture_storage_2d<rgba8unorm, read>, fb_pos_depth: texture_storage_2d<rgba32float, read>, fb_normal_mask: texture_storage_2d<rgba8unorm, read>) -> FbData {
            var data: FbData;
            let color = textureLoad(fb_color, pixel);
            let pd = textureLoad(fb_pos_depth, pixel);
            let nm = textureLoad(fb_normal_mask, pixel);

            data.color = color;
            data.pos = pd.xyz;
            data.depth = pd.w;
            data.normal = nm.xyz * 2.0 - 1.0;
            data.mask = u32(nm.w * 255.0);

            return data;
        }

        fn decideDiscard(color: vec4f, pos: vec3f, normal: vec3f, view_pos: vec3f, cull: f32) {
            if (color.a == 0.0) {
                discard;
            }

            if (cull != 0.0) {
                let view_dir = normalize(view_pos - pos);
                let face = dot(normalize(normal), view_dir);
                if (face * cull < 0.0) {
                    discard;
                }
            }
        }


        @group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
        @group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

        @vertex 
        fn main(in: VertexIn, @builtin(vertex_index) vi: u32) -> VertexOut {
            var out: VertexOut;
            out.ndc = u_global.projection * u_global.view * u_object.model * vec4f(in.pos, 1.0);
            out.pos = (u_object.model * vec4f(in.pos, 1.0)).xyz;
            out.normal = normalize((u_object.normal * vec4f(in.normal, 0.0)).xyz);
            out.color = in.color * u_object.color;
            out.uv = vec2f(in.uv.x, 1.0 - in.uv.y) * u_object.uv_scale;
            out.tangent = normalize((u_object.normal * vec4f(in.tangent, 0.0)).xyz);

            var bary = vec3f(0.0);
            bary[vi % 3] = 1.0;
            out.bary = bary;

            out.shadow_space = u_global.shadow_transform * u_object.model * vec4f(in.pos, 1.0);

            return out;
        }
    `,
};

const defaultFragShader: Shader = {
    path: "world/base.frag.wgsl",
    code: `
        struct VertexIn {
            @location(0) pos: vec3f, // object space
            @location(1) normal: vec3f,
            @location(2) color: vec4f,
            @location(3) uv: vec2f,
            @location(4) tangent: vec3f, // GL tangent
        };

        struct VertexOut {
            @builtin(position) ndc: vec4f, // -1..1
            @location(0) pos: vec3f, // world space
            @location(1) normal: vec3f,
            @location(2) color: vec4f,
            @location(3) uv: vec2f,
            @location(4) tangent: vec3f, // GL tangent
            @location(5) bary: vec3f, // barycentric triangle coords, 0..1
            @location(6) shadow_space: vec4f, // -1..1
        };

        struct FragmentIn {
            @builtin(position) screen: vec4f, // 0..res
            @location(0) pos: vec3f, // world space
            @location(1) normal: vec3f,
            @location(2) color: vec4f,
            @location(3) uv: vec2f,
            @location(4) tangent: vec3f, // GL tangent
            @location(5) bary: vec3f, // barycentric triangle coords, 0..1
            @location(6) shadow_space: vec4f, // -1..1
        };

        struct FragmentOut {
            @location(0) color: vec4f,
            @location(1) pos_depth: vec4f,
            @location(2) normal_mask: vec4f,
        };

        /// world frag shader output
        struct FbData {
            color: vec4f,
            pos: vec3f,
            depth: f32,
            normal: vec3f,
            mask: u32,
        };

        /// global world pass uniforms
        struct GlobalUniforms {
            time: f32,
            frame: f32,
            fov: f32,
            resolution: vec2f,
            view_pos: vec3f,
            view: mat4x4f,
            view_inv: mat4x4f,
            projection: mat4x4f,
            shadow_transform: mat4x4f,
        };

        /// per object world pass uniforms
        struct ObjectUniforms {
            mask: f32,
            cull: f32,
            id: f32,
            uv_scale: f32,
            color: vec4f,
            vert_config: vec4f,
            frag_config: vec4f,
            model: mat4x4f,
            normal: mat4x4f,
        };

        /// base post pass uniforms
        struct PostUniforms {
            time: f32,
            frame: f32,
            resolution: vec2f,
            post_config: vec4f,
            view: mat4x4f,
            projection: mat4x4f,
        };

        /// encode world pass output data into framebuffers
        fn encodeFbData(data: FbData) -> FragmentOut {
            var out: FragmentOut;
            out.color = data.color;
            out.pos_depth = vec4f(data.pos, data.depth);
            out.normal_mask = vec4f((data.normal + 1.0) / 2.0, f32(data.mask) / 255.0);
            return out;
        }

        /// decode post pass input framebuffers back into data
        fn decodeFbData(pixel: vec2i, fb_color: texture_storage_2d<rgba8unorm, read>, fb_pos_depth: texture_storage_2d<rgba32float, read>, fb_normal_mask: texture_storage_2d<rgba8unorm, read>) -> FbData {
            var data: FbData;
            let color = textureLoad(fb_color, pixel);
            let pd = textureLoad(fb_pos_depth, pixel);
            let nm = textureLoad(fb_normal_mask, pixel);

            data.color = color;
            data.pos = pd.xyz;
            data.depth = pd.w;
            data.normal = nm.xyz * 2.0 - 1.0;
            data.mask = u32(nm.w * 255.0);

            return data;
        }

        fn decideDiscard(color: vec4f, pos: vec3f, normal: vec3f, view_pos: vec3f, cull: f32) {
            if (color.a == 0.0) {
                discard;
            }

            if (cull != 0.0) {
                let view_dir = normalize(view_pos - pos);
                let face = dot(normalize(normal), view_dir);
                if (face * cull < 0.0) {
                    discard;
                }
            }
        }

        @group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
        @group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

        @group(1) @binding(0) var t_sampler: sampler;
        @group(1) @binding(1) var t_sampler_direct: sampler;
        @group(1) @binding(2) var t_color: texture_2d<f32>;

        @fragment 
        fn main(in: FragmentIn) -> FragmentOut {
            _ = t_sampler_direct;
            
            var data: FbData;
            data.color = in.color * textureSample(t_color, t_sampler, in.uv);
            data.pos = in.pos;
            data.depth = length(u_global.view_pos - in.pos);
            data.normal = in.normal;
            data.mask = u32(u_object.mask);

            decideDiscard(data.color, data.pos, data.normal, u_global.view_pos, u_object.cull);
            return encodeFbData(data);
        }
    `,
};

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
    /** mesh to draw */
    mesh: Mesh = defaultMesh;
    /** textures, assigned to shader bindgroup 1, bindings 2.. */
    textures: (Texture | BuiltinTextureLabel)[] = [defaultTexture];
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
    
    /** collider mesh, used for fine collision detection */
    collider?: Collider = undefined;
    /** bounding box used to skip fine collision if present */
    bbox?: Bbox = undefined;

    /** world vertex shader */
    vertShader: Shader = defaultVertShader;
    /** world fragment shader */
    fragShader: Shader = defaultFragShader;

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
