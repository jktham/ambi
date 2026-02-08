#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@vertex 
fn main(in: VertexIn) -> VertexOut {
	let t = u_base.time;
	let scale = select(u_base.vert_config.x, 0.1, u_base.vert_config.x == 0.0);
	let pos = in.pos + rndvec(in.pos.x + in.pos.y + in.pos.z + t) * scale - scale/2;

	var out: VertexOut;
	out.ndc = u_base.projection * u_base.view * u_base.model * vec4f(pos, 1.0);
	out.pos = (u_base.model * vec4f(pos, 1.0)).xyz;
	out.normal = normalize((u_base.normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_base.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
