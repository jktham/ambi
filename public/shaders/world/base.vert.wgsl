#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@vertex 
fn main(in: VertexIn) -> VertexOut {
	var out: VertexOut;
	out.ndc = u_base.projection * u_base.view * u_base.model * vec4f(in.pos, 1.0);
	out.pos = (u_base.model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((u_base.normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_base.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
