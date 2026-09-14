/* Subpixel Bijection Flow — chronos (Shadertoy 73c3R7) · Image
 * 紫金花·粒子版显示层（全部为纯显示变换，不影响 Buffer A 守恒模拟）：
 *  1. 整体慢旋转 —— 一朵花作为整体缓缓转动（同一角度，不再分层）；
 *  2. 呼吸 —— 粒子云周期性向外膨胀：外圈粒子被花瓣壁截住"压进"边界，
 *     随后回弹。压壁最猛时花缘亮起鎏金（撞壁金光与压壁相位同步）。
 *  3. 花外像素严格直通（呼吸/旋转/金光都不得泄漏到花域外）。
 * 原作此通道是逐字直通（见 image.orig.frag）。
 */

float flowerShape(float th)
{
    th += 3.14159265 * .5;
    float s = abs(cos(uPetals * th * .5));
    s = pow(s, uPetalSharp);
    return uPetalFloor + (1. - uPetalFloor) * s;
}

void mainImage( out vec4 O, in vec2 p )
{
    vec2 ctr = .5 * iResolution.xy;
    float mn = min(iResolution.x, iResolution.y);
    vec2 f = p - ctr;
    float r = length(f);
    float th = atan(f.y, f.x);
    float R = flowerShape(th) * uFlowerSize * mn;
    float w0 = (r * r) / (R * R);
    float inside = 1. - smoothstep(.99, 1.01, r / R);   // 花域掩码（1 域内）

    float press = .5 + .5 * sin(6.2831853 * float(iFrame) / uBreathPeriod);

    float ang = uRotSpeed * float(iFrame);
    float ca = cos(ang), sa = sin(ang);
    vec2 g = vec2(ca * f.x - sa * f.y, sa * f.x + ca * f.y);
    float s = 1. - uBreathAmp * press;
    vec2 src = ctr + g * s;

    vec4 tIn = texelFetch(iChannel0, ivec2(src), 0);   // 域内：旋转 + 呼吸采样
    vec4 tOut = texelFetch(iChannel0, ivec2(p), 0);    // 域外：严格直通（含静态紫晕）
    vec4 t = mix(tOut, tIn, inside);

    // 撞壁金光：只作用于花域内的外圈带 × 压壁相位²；另有常驻细描边
    float rimBand = smoothstep(.80, .97, w0) * smoothstep(1.0, .96, w0) * inside;
    float gold = rimBand * press * press * uGlowGain;
    O = vec4(t.rgb + vec3(1., .70, .22) * gold + vec3(1., .75, .30) * (rimBand * .10), 1.);
}
