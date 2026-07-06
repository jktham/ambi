#import "../lib/data.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@vertex 
fn main(in: VertexIn, @builtin(vertex_index) vi: u32) -> VertexOut {
	let amplitude = u_object.vert_config.x;
	let speed = u_object.vert_config.y;
	let scale = u_object.vert_config.z;

	let uv = vec2f(in.uv.x, 1.0 - in.uv.y) * u_object.uv_scale;
	let pos = in.pos + in.normal * (sin((u_global.time * speed + length(uv) * scale) * 3.1415 * 2) * 0.5 + 0.5) * amplitude;

	var out: VertexOut;
	out.ndc = u_global.projection * u_global.view * u_object.model * vec4f(pos, 1.0);
	out.pos = (u_object.model * vec4f(pos, 1.0)).xyz;
	out.normal = normalize((u_object.normal * vec4f(in.normal, 0.0)).xyz); // incorrect normal
	out.color = in.color * u_object.color;
	out.uv = uv;
	out.tangent = normalize((u_object.normal * vec4f(in.tangent, 0.0)).xyz);

	var bary = vec3f(0.0);
	bary[vi % 3] = 1.0;
	out.bary = bary;

	out.shadow_space = u_global.shadow_transform * u_object.model * vec4f(pos, 1.0);

	return out;
}
