import { MESH_STRIDE, type MeshPath, Vertex, type MaterialPath, type Material, type TexturePath, type FontPath, type Font, type Collider, type Mesh, type Texture } from "./assets";
import { Bbox } from "./bbox";
import { Vec3, Vec4, Vec2 } from "./vec";

/** parses .obj file as string, returns flat f32 array of triangulates vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz) */
export function parseMeshOBJ(path: MeshPath, file: string): Mesh {
    let v: number[][] = []; // vertex pos xyz
    let vc: number[][] = []; // vertex color rgba
    let vn: number[][] = []; // vertex normal xyz
    let vt: number[][] = []; // vertex texcoord uv
    let faces: number[][][] = []; // faces, list of [v1, v2, v3]

    for (let line of file.split(/\r?\n/)) {
        let words = line.split(" ");
        if (words[0] == "v") {
            v.push(words.slice(1, 4).map(w => parseFloat(w)));
            if (words.length == 7) {
                vc.push([words.slice(4, 7).map(w => parseFloat(w)), 1.0].flat());
            } else {
                vc.push([1.0, 1.0, 1.0, 1.0]);
            }

        } else if (words[0] == "vn") {
            vn.push(words.slice(1, 4).map(w => parseFloat(w)));

        } else if (words[0] == "vt") {
            vt.push(words.slice(1, 3).map(w => parseFloat(w)));

        } else if (words[0] == "f") {
            let face: number[][] = [];
            for (let group of words.slice(1)) {
                let indices = group.split("/").map(i => parseInt(i));
                let iv = indices[0];
                let ivc = indices[0];
                let ivn = indices[2];
                let ivt = indices[1];

                let vertex = new Vertex();
                vertex.pos = new Vec3(...v[iv-1]);
                vertex.normal = new Vec3(...vn[ivn-1]);
                vertex.color = new Vec4(...vc[ivc-1]);
                vertex.uv = ivt ? new Vec2(...vt[ivt-1]) : new Vec2(0, 0);
                vertex.tangent = new Vec3(0, 0, 0);

                face.push(vertex.flatten());
            } if (face.length == 3) {
                faces.push(face);
            } else if (face.length > 3) { // we assume convex
                for (let i=2; i<face.length; i++) { // triangulate ngons
                    faces.push([face[0], face[i-1], face[i]]);
                }
            } else {
                console.warn(`invalid mesh face: ${path}, ${face}`);
            }
        }
    }

    // compute tangent as in https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    for (let i = 0; i < faces.length; i++) {
        let v0 = new Vertex(faces[i][0]);
        let v1 = new Vertex(faces[i][1]);
        let v2 = new Vertex(faces[i][2]);

        let edge1 = v1.pos.sub(v0.pos);
        let edge2 = v2.pos.sub(v0.pos);
        let duv1 = v1.uv.sub(v0.uv);
        let duv2 = v2.uv.sub(v0.uv);

        let tangent = new Vec3();
        let fract = 1.0 / (duv1.x * duv2.y - duv2.x * duv1.y);

        tangent.x = fract * (duv2.y * edge1.x - duv1.y * edge2.x);
        tangent.y = fract * (duv2.y * edge1.y - duv1.y * edge2.y);
        tangent.z = fract * (duv2.y * edge1.z - duv1.y * edge2.z);
        tangent = tangent.normalize();

        v0.tangent = tangent;
        v1.tangent = tangent;
        v2.tangent = tangent;

        faces[i][0] = v0.flatten();
        faces[i][1] = v1.flatten();
        faces[i][2] = v2.flatten();
    }

    let verts = faces.flat(2);
    let mesh: Mesh = {
        path,
        data: new Float32Array(verts),
        size: verts.length / MESH_STRIDE,
        stride: MESH_STRIDE,
    };
    return mesh;
}

/** parse .json mesh file (packed verts array) */
export function parseMeshJSON(path: MeshPath, file: string): Mesh {
    let data = new Float32Array(JSON.parse(file || "[]") as number[]); // should be flat list of vertices (pos xyz, normal xyz, color rgba, texcoord uv, tangent xyz)

    let mesh: Mesh = {
        path,
        data,
        size: data.length / MESH_STRIDE,
        stride: MESH_STRIDE,
    };
    return mesh;
}

/** parse .png or .jpg file (from base64 contents) */
export async function parseTexturePNGJPG(path: TexturePath, file_b64: string): Promise<Texture> {
    let image = new Image();
    image.src = file_b64;
    await image.decode();

    const [width, height] = [image.naturalWidth, image.naturalHeight];
    let canvas = new OffscreenCanvas(width, height);
    let context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    let imageData = context.getImageData(0, 0, width, height);

    let texture: Texture = {
        path,
        data: imageData.data,
        width,
        height,
    };
    return texture;
}

/** parse .json texture file (3d uint array [r, g, b, a][width][height] 0..=255) */
export function parseTextureJSON(path: TexturePath, file: string): Texture {
    let data = JSON.parse(file || "[]") as number[][][]; // should be [r, g, b, a][width][height] as 0..=255
    if (data[0]?.[0]?.[0] === undefined) {
        throw new Error(`invalid texture data: ${path}`);
    }

    const height = data.length;
    const width = data[0].length;

    let texture: Texture = {
        path,
        data: new Uint8ClampedArray(data.flat(2)),
        width,
        height,
    };
    return texture;
}

/** returns 2d list of vertex positions from full mesh array */
export function parseCollider(path: MeshPath, mesh: Float32Array): Collider {
    let data: [Vec3, Vec3, Vec3][] = [];
    for (let i=0; i<mesh.length; i+=MESH_STRIDE*3) {
        let v0 = new Vertex([...mesh.slice(i, i + MESH_STRIDE)]);
        let v1 = new Vertex([...mesh.slice(i + MESH_STRIDE, i + 2*MESH_STRIDE)]);
        let v2 = new Vertex([...mesh.slice(i + 2*MESH_STRIDE, i + 3*MESH_STRIDE)]);
        data.push([v0.pos, v1.pos, v2.pos]);
    }
    let collider: Collider = {
        path,
        triangles: data,
        size: data.length,
    };
    return collider;
}

/** returns min/max of vertex positions */
export function parseBbox(path: MeshPath, mesh: Float32Array): Bbox {
    let min = new Vec3(Infinity, Infinity, Infinity);
    let max = new Vec3(-Infinity, -Infinity, -Infinity);

    for (let i=0; i<mesh.length; i+=MESH_STRIDE) {
        let v = new Vertex([...mesh.slice(i, i+MESH_STRIDE)]).pos;
        min.x = Math.min(min.x, v.x);
        min.y = Math.min(min.y, v.y);
        min.z = Math.min(min.z, v.z);
        max.x = Math.max(max.x, v.x);
        max.y = Math.max(max.y, v.y);
        max.z = Math.max(max.z, v.z);
    }

    return new Bbox([min, max]);
}

/** parse .mtl and return map of found texture labels to texture paths */
export function parseMaterialMTL(path: MaterialPath, file: string): Material {
    let material: Material = {
        path,
        diffuse_map: undefined,
        normal_map: undefined,
        roughness_map: undefined,
        specular_map: undefined,
    };
    for (let line of file.split(/\r?\n/)) {
        let words = line.split(" ");
        switch (words[0].toLowerCase()) {
            case "map_kd": {
                let abs = words[1];
                if (!abs.includes("textures/")) {
                    console.warn(`diffuse map texture path in mtl does not include "textures/": ${path}, ${abs}`);
                    continue;
                }
                let rel = abs.split("textures/").slice(1).join("");
                material.diffuse_map = rel as TexturePath;
                break;
            }
            case "map_bump": {
                let abs = words[3];
                if (!abs.includes("textures/")) {
                    console.warn(`normal map texture path in mtl does not include "textures/": ${path}, ${abs}`);
                    continue;
                }
                let rel = abs.split("textures/").slice(1).join("");
                material.normal_map = rel as TexturePath;
                break;
            }
            case "map_ns": {
                let abs = words[1];
                if (!abs.includes("textures/")) {
                    console.warn(`roughness map texture path in mtl does not include "textures/": ${path}, ${abs}`);
                    continue;
                }
                let rel = abs.split("textures/").slice(1).join("");
                material.roughness_map = rel as TexturePath;
                break;
            }
            case "map_ks": {
                let abs = words[1];
                if (!abs.includes("textures/")) {
                    console.warn(`specular map texture path in mtl does not include "textures/": ${path}, ${abs}`);
                    continue;
                }
                let rel = abs.split("textures/").slice(1).join("");
                material.specular_map = rel as TexturePath;
                break;
            }
        }
    }
    return material;
}

/** parse font .fnt and return offsets */
export function parseFontFNT(path: FontPath, file: string): Font {
    /** parses list of key=value strings and returns map */
    const parseKV = (pairs: string[]): Map<string, number> => {
        let map = new Map<string, number>();
        for (let pair of pairs) {
            let p = pair.split("=");
            map.set(p[0], parseFloat(p[1]));
        }
        return map;
    }

    let font: Font = {
        path,
        resolution: new Vec2(),
        line_height: 0,
        base: 0,
        chars: [],
        kernings: []
    };

    for (let line of file.split(/\r?\n/)) {
        let words = line.split(/\s+/).filter(w => w != "");
        let kv = parseKV(words.slice(1));
        
        if (words[0] == "common") {
            font.resolution.x = kv.get("scaleW")!;
            font.resolution.y = kv.get("scaleH")!;
            font.line_height = kv.get("lineHeight")!;
            font.base = kv.get("base")!;

        } else if (words[0] == "char") {
            let char = {
                id: kv.get("id")!,
                pos: new Vec2(kv.get("x")!, kv.get("y")!),
                size: new Vec2(kv.get("width")!, kv.get("height")!),
                offset: new Vec2(kv.get("xoffset")!, kv.get("yoffset")!),
                advance: kv.get("xadvance")!,
            };
            font.chars.push(char);

        } else if (words[0] == "kerning") {
            let kerning = {
                first: kv.get("first")!, 
                second: kv.get("second")!, 
                amount: kv.get("amount")!,
            };
            font.kernings.push(kerning);

        }
    }
    return font;
}

/** generate quads per character with uv coords matching font atlas texture */
export function generateTextMesh(path: MeshPath, font: Font, text: string, font_size: number = 1, align: "left" | "center" | "right" = "left"): Mesh {
    let cursor = new Vec2(0, -font.base);
    let scale = 1.0 / font.line_height * font_size;

    // generate quads
    let line = 0;
    let line_widths = [];
    let lines: [Vertex, Vertex, Vertex, Vertex][][] = [];
    for (let i=0; i<text.length; i++) {
        let c = text.charCodeAt(i);
        let next = text.charCodeAt(i+1);

        // line break
        if (c == 10) {
            cursor.x = 0;
            cursor.y -= font.line_height;
            line++;
            continue;
        }

        let char = font.chars.find(ch => ch.id == c);

        if (!char) {
            console.warn(`unknown char ${c}`);
            continue;
        }

        let top_left = new Vertex();
        let top_right = new Vertex();
        let bottom_left = new Vertex();
        let bottom_right = new Vertex();

        top_left.pos = new Vec3(cursor.x + char.offset.x, cursor.y + font.base - char.offset.y, 0);
        top_right.pos = top_left.pos.add(new Vec3(char.size.x, 0, 0));
        bottom_left.pos = top_left.pos.add(new Vec3(0, -char.size.y, 0));
        bottom_right.pos = top_left.pos.add(new Vec3(char.size.x, -char.size.y, 0));

        for (let v of [bottom_left, bottom_right, top_left, top_right]) {
            v.pos = v.pos.mul(scale);
        }

        top_left.uv = new Vec2(char.pos.x, char.pos.y);
        top_right.uv = top_left.uv.add(new Vec2(char.size.x, 0));
        bottom_left.uv = top_left.uv.add(new Vec2(0, char.size.y));
        bottom_right.uv = top_left.uv.add(new Vec2(char.size.x, char.size.y));

        for (let v of [bottom_left, bottom_right, top_left, top_right]) {
            v.uv = v.uv.div(font.resolution);
            v.uv.y = 1.0 - v.uv.y;
        }

        while (lines.length < line + 1) {
            lines.push([]);
        }
        lines[line].push([bottom_left, bottom_right, top_left, top_right]);

        if (next) {
            let kerning = font.kernings.find(k => k.first == c && k.second == next);
            if (kerning) {
                cursor.x += kerning.amount;
            }
        }
        cursor.x += char.advance;

        while (line_widths.length < line + 1) {
            line_widths.push(0);
        }
        line_widths[line] = cursor.x;
    }

    // adjust alignment
    for (let [i, line] of lines.entries()) {
        for (let quad of line) {
            for (let vert of quad) {
                if (align == "center") {
                    vert.pos.x -= line_widths[i] / 2.0 * scale;
                } else if (align == "right") {
                    vert.pos.x -= line_widths[i] * scale;
                }
            }
        }
    }

    // triangulate quads
    let verts: number[][] = [];
    for (let line of lines) {
        for (let [bottom_left, bottom_right, top_left, top_right] of line) {
            verts.push(bottom_left.flatten());
            verts.push(top_right.flatten());
            verts.push(top_left.flatten());
            
            verts.push(bottom_left.flatten());
            verts.push(bottom_right.flatten());
            verts.push(top_right.flatten());
        }
    }
    
    let mesh: Mesh = {
        path,
        data: new Float32Array(verts.flat()),
        size: verts.flat().length / MESH_STRIDE,
        stride: MESH_STRIDE,
    };
    return mesh;
};