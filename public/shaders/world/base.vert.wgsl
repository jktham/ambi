#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_global: GlobalUniforms;
@group(0) @binding(1) var<uniform> u_object: ObjectUniforms;

@vertex 
fn main(in: VertexIn) -> VertexOut {
	var out: VertexOut;
	out.ndc = u_global.projection * u_global.view * u_object.model * vec4f(in.pos, 1.0);
	out.pos = (u_object.model * vec4f(in.pos, 1.0)).xyz;
	out.normal = normalize((u_object.normal * vec4f(in.normal, 0.0)).xyz);
	out.color = in.color * u_object.color;
	out.uv = vec2f(in.uv.x, 1.0 - in.uv.y);
	return out;
}
