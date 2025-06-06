struct VertexOut {
	@builtin(position) pos: vec4f,
	@location(0) color: vec4f,
	@location(1) uv: vec2f
};

@group(1) @binding(0) var textureSampler: sampler;
@group(1) @binding(1) var texture: texture_2d<f32>;

@fragment 
fn fs(in: VertexOut) -> @location(0) vec4f {
	return in.color * textureSample(texture, textureSampler, in.uv);;
}