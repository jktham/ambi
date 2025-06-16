#import "../shared.wgsl"

@vertex 
fn main(@builtin(vertex_index) i: u32) -> VertexOut {
	let pos = array(
		vec2f(-1, -1),
		vec2f(1, -1),
		vec2f(1, 1),
		vec2f(1, 1),
		vec2f(-1, 1),
		vec2f(-1, -1)
	);

	var out: VertexOut;
	out.ndc = vec4f(pos[i], 0.0, 1.0);
	out.pos = vec3f(pos[i], 0.0);
	out.uv = vec2f((pos[i].x + 1.0) / 2.0, 1.0 - (pos[i].y + 1.0) / 2.0);
	return out;
}
