/* Subpixel Bijection Flow — chronos (Shadertoy 73c3R7) · Buffer A
 * 「紫金花·粒子版」：画布中心一朵紫金花，花内是离散粒子群
 * （确定性哈希撒点的紫/金色颗粒 + 金色花蕊），粒子被剪切流搬运，
 * 只在花形域内运动。花外的呼吸/旋转/压壁金光都在 Image 显示层完成。
 * 花形域由极坐标花瓣包络 R(θ)（n 瓣玫瑰线）定义；演化帧用
 * w=(r/R)² 的 fract 回卷（面积坐标环面双射）保证内容不衰减。
 * 实测教训：径向折叠/径向呼吸/输运层 θ 剪切都会在固定壁上形成
 * 棘轮或离散折叠，内容会衰减消失。
 * 原始未修改源码见 bufferA.orig.frag 与 source/shader.json。
 */

float T = 2.*acos(-1.);
const float PI = 3.14159265;

// --- 剪切位移场（与原作一致）---
float D(float c, vec2 t, int i)
{
    float P = float(i) * (.5 * sqrt(5.)-.5);  // Golden ratio / Weyl sequence
    vec2 r = t * uDriftAmp * sin(P * T); // Drift - Golden angle
    t += P;
    vec2 C = vec2(c * T);          // Ensure continuous boundarties for toroidal wrap
    C += .5 * sin(C + t * .1);

    // v.x = amplitude, v.y = frequency, v.z = time multiplier
    // 注意（原作注释）：v.y 频率倍率必须保持整数，否则各频项不连续
    vec3 v = vec3(uShearAmp, uFreqScale, uTimeMul);
    for(float j = uJStart; j < uJEnd; j += uJStep, v *= vec3(uAmpDecay, uFreqGrow, uTimeGrow)) // 同上
        r += v.x * cos(v.y * C + v.z * t + j);

    r = round(r);
    return r.x - r.y;
}

// --- 花瓣包络（返回相对花朵半径的比例），一片花瓣朝上 ---
float flowerShape(float th)
{
    th += PI * .5;
    float s = abs(cos(uPetals * th * .5));
    s = pow(s, uPetalSharp);
    return uPetalFloor + (1. - uPetalFloor) * s;
}

// --- 确定性哈希撒点 ---
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void mainImage( out vec4 O, in vec2 q )
{
    vec2  ctr = .5 * iResolution.xy;
    float mn  = min(iResolution.x, iResolution.y);
    vec2  fc  = q - ctr;
    float r0  = length(fc);
    float th0 = atan(fc.y, fc.x);
    float R0  = flowerShape(th0) * uFlowerSize * mn;

    // ---- 初始化帧：播下粒子群（暗底上的紫/金颗粒 + 金色花蕊）----
    if (iFrame < int(uInitFrames))
    {
        vec3 col = vec3(.012);
        col += vec3(.045, .018, .06) * exp(-max(r0 - R0, 0.) / (.45 * uFlowerSize * mn));
        if (r0 < R0)
        {
            float t = r0 / R0;
            vec3 body = mix(vec3(.07, .025, .10), vec3(.11, .04, .16), t); // 花瓣暗底
            body *= .7 + .6 * pow(abs(cos(uPetals * (th0 + PI * .5) * .5)), .8);
            col = body;

            // 粒子：3px 网格哈希撒点，紫为主、金为辅（金沿瓣中脉偏置）
            vec2 cell = floor(q / 3.);
            float h1 = hash21(cell);
            float h2 = hash21(cell + 19.7);
            if (h1 < uSpeckle)
            {
                float seg = 2. * PI / uPetals;
                float dMid = abs(mod(th0 + PI * .5, seg) - seg * .5);
                dMid = min(dMid, seg * .5 - dMid);
                float vein = smoothstep(.14, .01, dMid) * (1. - smoothstep(.55, .95, t));
                float isGold = step(h2, .16 + uPetalVein * .5 * vein);
                vec3 pc = isGold > .5
                    ? vec3(1., .72, .18) * (.65 + .7 * h1)                     // 金粒子
                    : mix(vec3(.78, .38, 1.), vec3(.42, .10, .72), h2) * (.7 + .6 * h1); // 紫粒子
                col = pc;
            }

            // 金色花蕊（实心）
            float coreR = uCoreSize * mn;
            col = mix(col, vec3(1., .74, .15) * (1.15 - .35 * r0 / max(coreR, 1.)),
                      1. - smoothstep(coreR * .6, coreR, r0));
        }
        O = vec4(col, 1);
        return;
    }

    // ---- 演化帧：花内粒子搬运，花外静止 ----
    vec3 result = vec3(0);
    if (r0 < R0)
    {
        for(int c = 0; c < 3; c++)
        {
            vec2 p = q;
            for(int i = 0; i < int(uIters); i++)
                p[i&1] = mod(p[i&1] -
                    uDisplaceScale * D((p/iResolution.xy)[~i&1],
                    vec2(iFrame,iFrame-1)/uSpeed + float(c)*.05, i),
                    iResolution[i&1]); // Shift row or col by a constant, with wrap

            // 花域输运：面积守恒的极坐标环面回卷（w=(r/R)²，双射不丢内容）。
            // 边界环流/呼吸/压壁金光全部由 Image 显示层实现（零风险）。
            vec2 f = p - ctr;
            float r = length(f), th = atan(f.y, f.x);
            float R = flowerShape(th) * uFlowerSize * mn;
            float w = fract((r * r) / (R * R));
            p = ctr + vec2(cos(th), sin(th)) * (sqrt(w) * R);

            result[c] = texelFetch(iChannel0, ivec2(p), 0)[c];
        }
        O = vec4(result, 1);
    }
    else
    {
        O = vec4(vec3(.012), 1);
    }
}
