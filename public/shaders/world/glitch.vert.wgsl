#import "../data.wgsl"
#import "../noise.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@vertex 
fn main(in: VertexIn, @builtin(vertex_index) vi: u32) -> VertexOut {
	let t = u_global.time;
	let scale = select(u_object.vert_config.x, 0.1, u_object.vert_config.x == 0.0);
	let pos = in.pos + rndvec3(in.pos.x + in.pos.y + in.pos.z + t) * scale - scale/2;

	var out: VertexOut;
	out.ndc = u_global.projection * u_global.view * u_object.model * vec4f(pos, 1.0);
	out.pos = (u_object.model * vec4f(pos, 1.0)).xyz;
	out.normal = normalize((u_object.normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_object.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);

	var bary = vec3f(0.0);
	bary[vi % 3] = 1.0;
	out.bary = bary;

	return out;
}
