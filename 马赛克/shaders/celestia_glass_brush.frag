// Celestia Glass — 笔刷版（本地复刻的参数化改版）
// 基于 lonelyang 的 "Celestia Glass" https://www.shadertoy.com/view/WX3fRn
// 上游 Fork 链：harsukh "butterfly stained glass" ← Flopine "ShATI - Soleil"
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// 本改版说明（仅供学习交流）：
// - 将原作中的硬编码常量参数化为 uniforms，供本地控制面板实时调整
//   （马赛克格子/格线/抖动/高光、背景波浪/条纹/配色、太阳大小/光线/浮动、翅膀、整体色相）
// - uPaint  笔刷场一：RG=全局扭曲位移场，B=局部色相场
// - uPaint2 笔刷场二：RG=背景花纹变形场（弯曲条纹曲线），B=填色色号，A=填色强度
// - uPaint3 笔刷场三：RG=太阳变形场（弯曲太阳光线/轮廓曲线）
//   （填色按 Voronoi 玻璃块的特征点采样，实现整块玻璃上色；
//     变形场直接弯曲图案的参数曲线，形状保持矢量化清晰渲染）
// - uRayCtrl/uStripeCtrl 曲线句柄：Illustrator 式可拖拽样条锚点，
//   分别控制太阳光线脊线与背景条纹边界曲线
// - 所有笔刷场为中性值、参数取默认值时，渲染结果与原作一致

#define PI 3.1415926
#define TAU 6.2831853071
#define dt fract(iTime*0.25)
#define AAstep(thre, val) smoothstep(-.7,.7,(val-thre)/min(.05,fwidth(val-thre)))
#define circle(d, s) AAstep(s, length(d))
#define anim easeInOutQuad(abs(-1.+2.*dt))

// 笔刷场强度：位移场满量程对应的 uv 位移、B 色相场乘数
#define WARP_AMP 0.4
#define HUE_BRUSH_AMP 2.0

uniform sampler2D uPaint;   // 笔刷场一（屏幕同分辨率映射）
uniform sampler2D uPaint2;  // 笔刷场二（屏幕同分辨率映射）
uniform sampler2D uPaint3;  // 笔刷场三（屏幕同分辨率映射）
uniform float uCell;        // 马赛克格子密度（原作 30）
uniform float uEdgeLo;      // 格线宽度下阈（原作 0.01）
uniform float uEdgeHi;      // 格线宽度上阈（原作 0.06）
uniform float uJitter;      // 格子抖动 0=整齐 1=原作随机
uniform float uBevel;       // 玻璃高光/斜面强度（原作 1）
uniform float uBgWave;      // 背景波浪幅度（原作 0.1）
uniform float uStripe;      // 背景条纹斜率/宽度（原作 0.7）
uniform vec3  uPal0;        // 背景调色板 4 色
uniform vec3  uPal1;
uniform vec3  uPal2;
uniform vec3  uPal3;
uniform float uSunSize;     // 太阳核心半径（原作 0.3）
uniform float uRays;        // 光线数量（原作 8）
uniform float uSunBob;      // 太阳上下浮动幅度（原作 0.05）
uniform float uWing;        // 翅膀展开幅度（原作 1）
uniform float uHueAll;      // 整体色相偏移（原作 0）

// 曲线句柄（Illustrator 式样条锚点，默认值 = 原作曲线）
uniform float uRayCtrl[6];     // 太阳光线脊线控制点（太阳坐标系 uu.y 位移）
uniform float uStripeCtrl[6];  // 花纹边界轮廓控制点（条纹法向位移）

// 由 mainImage 按当前像素写入、供各层读取的笔刷变形场
vec2 g_stripeWarp = vec2(0.0); // 背景花纹变形（弯曲条纹曲线）
vec2 g_sunWarp = vec2(0.0);    // 太阳变形（弯曲光线/轮廓曲线）

//https://easings.net/#
float easeInOutQuad (float x)
{return x < 0.5 ? 2.0 * x * x : 1.0 - pow(-2.0 * x + 2.0, 2.0) / 2.0;}

float tri (vec2 uv, float size, vec2 ratio)
{return AAstep(size, max(-uv.x,dot(vec2(uv.x,abs(uv.y)),normalize(ratio))));}

mat2 rot (float a)
{return mat2(cos(a),-sin(a),sin(a),cos(a));}

vec2 rand (vec2 x)
{return fract(sin(vec2(dot(x, vec2(1.2,5.5)), dot(x, vec2(4.54,2.41))))*4.45);}


void moda (inout vec2 p, float rep)
{
    float per = TAU/rep;
    float a = mod(atan(p.y,p.x),per)-per*0.70;
    p = vec2(cos(a),sin(a))*length(p);
}

vec3 voro (vec2 uv)
{
    vec2 uv_id = floor(uv);
    vec2 uv_st = fract(uv);

    vec2 m_diff;
    vec2 m_point;
    vec2 m_neighbor;
    float m_dist = 10.0;

    for (int j= -1; j<=1; j++){
        for (int i =-1; i<=1; i++){
            vec2 neighbor = vec2(i, j);
            vec2 point = mix(vec2(0.5), rand(uv_id+neighbor), uJitter);
            vec2 diff = neighbor+ point- uv_st;

            float dist = length(diff);
            if (dist < m_dist){
                m_dist = dist;
                m_point = point;
                m_diff = diff;
                m_neighbor = neighbor;
            }
        }
    }

    m_dist = 10.0;
    for(int j = -2; j<= 2; j++){
     for(int i =-2; i<=2; i++){
         if (i==0 && j==0) continue;
         vec2 neighbor = m_neighbor+ vec2(float(i), float(j));
         vec2 point = mix(vec2(0.5), rand(uv_id+neighbor), uJitter);
         vec2 diff = neighbor+ point- uv_st;
         float dist = dot(0.5*(m_diff+diff), normalize(diff-m_diff));
         m_point= point;
         m_dist = min(m_dist, dist);
      }
    }

    return vec3(m_point, m_dist);
}

vec3 HueShift (in vec3 Color, in float Shift)
{
    vec3 P = vec3(0.55735)*dot(vec3(0.55735),Color);
    vec3 U = Color-P;
    vec3 V = cross(vec3(0.55735),U);

    Color = U*cos(Shift*6.2832) + V*sin(Shift*6.2832) + P;

    return Color;
}

// 曲线句柄的样条插值（Catmull-Rom）
float catmull (float p0, float p1, float p2, float p3, float t)
{
    float t2 = t*t; float t3 = t2*t;
    return 0.5*((2.0*p1) + (-p0+p2)*t
        + (2.0*p0-5.0*p1+4.0*p2-p3)*t2 + (-p0+3.0*p1-3.0*p2+p3)*t3);
}

// 太阳光线脊线：tt∈[0,1] 沿光线长度，锚点由界面句柄编辑
#define RAY_X0 -0.10
#define RAY_DX  0.17
float raySpine (float tt)
{
    float f = clamp(tt, 0.0, 1.0)*5.0;
    float fi = floor(f);
    float t = f - fi;
    int i0 = int(max(fi-1.0, 0.0));
    int i1 = int(fi);
    int i2 = int(min(fi+1.0, 5.0));
    int i3 = int(min(fi+2.0, 5.0));
    return catmull(uRayCtrl[i0], uRayCtrl[i1], uRayCtrl[i2], uRayCtrl[i3], t);
}

// 花纹边界轮廓：u 为沿线坐标，锚点由界面句柄编辑
float stripeProfile (float u)
{
    float f = clamp((u + 1.2)/0.48, 0.0, 5.0);
    float fi = floor(f);
    float t = f - fi;
    int i0 = int(max(fi-1.0, 0.0));
    int i1 = int(fi);
    int i2 = int(min(fi+1.0, 5.0));
    int i3 = int(min(fi+2.0, 5.0));
    return catmull(uStripeCtrl[i0], uStripeCtrl[i1], uStripeCtrl[i2], uStripeCtrl[i3], t);
}

// 填色笔刷：在玻璃块的特征点处采样填色场，让整块玻璃一起变色
vec4 cellFill (vec2 uvScaled, vec3 v, float detail)
{
    vec2 feat = (floor(uvScaled) + v.xy) / detail;         // 特征点（层 uv 空间）
    vec2 fscr = feat * iResolution.y + 0.5 * iResolution.xy; // 对应屏幕像素
    return texture(uPaint2, fscr / iResolution.xy);
}

vec4 suns (vec2 uv)
{
    uv += g_sunWarp;           // 太阳形变笔刷：直接弯曲太阳的曲线
    uv *= 3.0;
    uv.y -= anim*uSunBob;
    float size = uSunSize;
    float center = clamp(1.-circle(uv,size),0.,1.);
    float outer = clamp(1.-(circle(uv,size*1.35)+(center)),0.,1.);
    vec2 uu = uv;
    moda(uu,uRays);
    uu.x -= size;
    uu.y += raySpine((uu.x - RAY_X0)/(RAY_DX*5.0));
    float pales = clamp(1.0-(tri(uu,0.2, vec2(0.25,0.8))+outer+center),0.0,1.0);
    vec3 col = vec3(0.95,0.75,0.2)*outer+vec3(1.0,0.72,0.52)*pales+vec3(1.,.9,0.6)*center;
	return vec4(col, clamp(pales+center+outer,0.,1.));
}

vec4 wings (vec2 uv)
{
    uv *= 3.0;
    uv.y -= 0.4;
    uv.x = abs(uv.x)-0.7;
    uv *= rot(anim*0.5*uWing);
    vec2 uu = uv;
    uu *= rot(-TAU/8.);
    uu.y += sin(uu.x*1.5)*0.3;
    float w1 = tri(uu, 0.14,vec2(0.12,1.));
    uu.y += sin(uu.x*2.)*0.2;
    uu.y += 0.1;
    float w2 = tri(uu, 0.12,vec2(0.15,1.));
    uu *= rot(TAU/15.);
    uu.y += 0.1;
    float w3 = tri(uu, 0.1,vec2(0.2,1.));
    float wing = clamp(1.-w1*w2*w3*circle(uv+vec2(0.13,0.1),0.2),0.,1.);
    return vec4(wing);
}

vec3 background (vec2 uv)
{
    uv += g_stripeWarp;        // 花纹笔刷：直接弯曲条纹曲线
    uv.y += sin(uv.x*5.+iTime*0.25)*uBgWave;
    vec3 col;
    float prof = stripeProfile((uv.x - uv.y)*0.70710678);
    float mask = floor((abs(uv.x + uv.y)*uStripe-0.2 + prof)*3.)/3.;
    if (mask<0.2) col = uPal0;
    else if (mask>=0.2 && mask<0.5) col = uPal1;
    else if (mask>=0.5 && mask<0.7) col = uPal2;
    else if (mask>=0.7) col = uPal3;
    return col;
}

vec3 back_grid (vec2 uv, float detail)
{
    vec3 mane = background(uv*2.0f);
    uv *= detail;
    vec3 v = voro(uv);
    float svz = smoothstep(uEdgeLo,uEdgeHi, v.z);
    vec3 col= clamp(mix(vec3(v.x*0.5, v.y*0.75, 0.7)*1.5,mane,0.75)*svz,0.,1.);
    col= HueShift(col, (-uv.y)*0.01);
    col+= (0.15-0.1*(-0.2*uv.y))*svz*uBevel;
    //col-= (0.1*(-0.2*uv.y))*svz;
    col= (((col-0.5)*0.85)+0.5)*svz;
    // 填色笔刷（整块上色，保留格线缝隙）
    vec4 pf = cellFill(uv, v, detail);
    vec3 fillCol = pf.b < 0.25 ? uPal0 : (pf.b < 0.5 ? uPal1 : (pf.b < 0.75 ? uPal2 : uPal3));
    col = mix(col, fillCol, pf.a * svz);
    return col;
}

vec3 cutiemark_grid (vec2 uv, float detail)
{
    vec3 suns = suns(uv).rgb;
    uv *= detail;
    vec3 v = voro(uv);
    float svz = smoothstep(uEdgeLo,uEdgeHi, v.z);
    vec3 col= clamp(mix(vec3(1.0, v.x*0.7, v.y*0.2),suns,0.75)*svz,0.,1.);
    col= HueShift(col, (-uv.y)*0.002);
    col+= 0.2*svz;
    col.yz+=(-0.1*(-0.2*uv.y))*svz*uBevel;
    // 填色笔刷（整块上色，保留格线缝隙）
    vec4 pf = cellFill(uv, v, detail);
    vec3 fillCol = pf.b < 0.25 ? uPal0 : (pf.b < 0.5 ? uPal1 : (pf.b < 0.75 ? uPal2 : uPal3));
    col = mix(col, fillCol, pf.a * svz);
    col= (((col-0.5)*0.9)+0.5)*svz;
    return col;
}

vec3 sky (vec2 uv){
    float m1 = clamp((1.0-suns(uv).a),0.0,1.0);
    return back_grid(uv,uCell) * m1;
}

vec3 sun (vec2 uv){
    float m1 = clamp(suns(uv).a-wings(uv).a,0.0,1.0);
    return cutiemark_grid(uv,uCell) * m1;

}

vec3 wing (vec2 uv){
    float m1 = clamp(wings(uv).a,0.0,1.0);
    return cutiemark_grid(uv,uCell) * m1;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	vec2 uv0 = (fragCoord-0.5*iResolution.xy)/iResolution.y;

	// 笔刷场一：RG=全局扭曲位移，B=局部色相
	vec4 paint = texture(uPaint, fragCoord/iResolution.xy);
	vec2 uv = uv0 + (paint.rg-0.5)*WARP_AMP;
	float hueBrush = (paint.b-0.5)*HUE_BRUSH_AMP;

	// 笔刷场二：RG=花纹变形（BA=填色由 cellFill 按块采样）
	vec4 paint2 = texture(uPaint2, fragCoord/iResolution.xy);
	g_stripeWarp = (paint2.rg-0.5)*WARP_AMP;

	// 笔刷场三：RG=太阳变形
	vec4 paint3 = texture(uPaint3, fragCoord/iResolution.xy);
	g_sunWarp = (paint3.rg-0.5)*WARP_AMP;

	vec3 c = vec3(0.01,0.05,0.008);

    c+=sky(uv);
    c+=wing(uv);
    c+=sun(uv);

    c = HueShift(c, uHueAll*6.2832 + hueBrush);

    fragColor = vec4(c, 1.);
}
