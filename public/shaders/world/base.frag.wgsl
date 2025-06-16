#import "../shared.wgsl"

@group(0) @binding(0) var<uniform> u_base: BaseUniforms;

@group(1) @binding(0) var t_sampler: sampler;
@group(1) @binding(1) var t_color: texture_2d<f32>;

@fragment 
fn main(in: FragmentIn) -> FragmentOut {
	var data: FbData;
	data.color = in.color * textureSample(t_color, t_sampler, in.uv);
	data.pos = in.pos;
	data.depth = length(u_base.view_pos - in.pos);
	data.normal = in.normal;
	data.mask = u32(u_base.mask);
	return encodeFbData(data);
}
