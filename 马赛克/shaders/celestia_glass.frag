// Fork of "butterfly stained glass" by harsukh. https://shadertoy.com/view/MclyRr
// Fork of "ShATI - Soleil" by Flopine. https://shadertoy.com/view/tsSfRW

// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Code by Lonelyang
// Time 2026-02-02
// I Love Pony!

#define PI 3.1415926
#define TAU 6.2831853071
#define dt fract(iTime*0.25)
#define AAstep(thre, val) smoothstep(-.7,.7,(val-thre)/min(.05,fwidth(val-thre)))
#define circle(d, s) AAstep(s, length(d))
#define anim easeInOutQuad(abs(-1.+2.*dt))

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
            vec2 point = rand(uv_id+neighbor);
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
         vec2 point = rand(uv_id+neighbor);
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

vec4 suns (vec2 uv)
{
    uv *= 3.0;
    uv.y -= anim*0.05;
    float size = 0.3;
    float center = clamp(1.-circle(uv,size),0.,1.);
    float outer = clamp(1.-(circle(uv,size*1.35)+(center)),0.,1.);
    vec2 uu = uv;
    moda(uu,8.);
    uu.x -= size;
    uu.y += sin(uu.x*8.)*0.08;
    float pales = clamp(1.0-(tri(uu,0.2, vec2(0.25,0.8))+outer+center),0.0,1.0);
    vec3 col = vec3(0.95,0.75,0.2)*outer+vec3(1.0,0.72,0.52)*pales+vec3(1.,.9,0.6)*center;
	return vec4(col, clamp(pales+center+outer,0.,1.));
}

vec4 wings (vec2 uv)
{
    uv *= 3.0;
    uv.y -= 0.4;
    uv.x = abs(uv.x)-0.7;
    uv *= rot(anim*0.5);
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
    uv.y += sin(uv.x*5.+iTime*0.25)*0.1;
    vec3 col;
    float mask = floor((abs(uv.x + uv.y)*0.7-0.2)*3.)/3.;
    if (mask<0.2) col = vec3(0.4,0.7,0.7);
    else if (mask>=0.2 && mask<0.5) col = vec3(0.6,0.9,0.5);
    else if (mask>=0.5 && mask<0.7) col = vec3(0.5,0.6,0.7);
    else if (mask>=0.7) col = vec3(0.9,0.6,0.9);
    return col;
}

vec3 back_grid (vec2 uv, float detail)
{
    vec3 mane = background(uv*2.0f);
    uv *= detail;
    vec3 v = voro(uv);
    float svz = smoothstep(0.01,0.06, v.z);
    vec3 col= clamp(mix(vec3(v.x*0.5, v.y*0.75, 0.7)*1.5,mane,0.75)*svz,0.,1.);
    col= HueShift(col, (-uv.y)*0.01);
    col+= (0.15-0.1*(-0.2*uv.y))*svz;
    //col-= (0.1*(-0.2*uv.y))*svz;
    col= (((col-0.5)*0.85)+0.5)*svz;
    return col;
}

vec3 cutiemark_grid (vec2 uv, float detail)
{
    vec3 suns = suns(uv).rgb;
    uv *= detail;
    vec3 v = voro(uv);
    float svz = smoothstep(0.01,0.06, v.z);
    vec3 col= clamp(mix(vec3(1.0, v.x*0.7, v.y*0.2),suns,0.75)*svz,0.,1.);
    col= HueShift(col, (-uv.y)*0.002);
    col+= 0.2*svz;
    col.yz+=(-0.1*(-0.2*uv.y))*svz;
    col= (((col-0.5)*0.9)+0.5)*svz;
    return col;
}

vec3 sky (vec2 uv){
    float m1 = clamp((1.0-suns(uv).a),0.0,1.0);
    return back_grid(uv,30.) * m1;
}

vec3 sun (vec2 uv){
    float m1 = clamp(suns(uv).a-wings(uv).a,0.0,1.0);
    return cutiemark_grid(uv,30.) * m1;
    
}

vec3 wing (vec2 uv){
    float m1 = clamp(wings(uv).a,0.0,1.0);
    return cutiemark_grid(uv,30.) * m1;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	vec2 uv = (fragCoord-0.5*iResolution.xy)/iResolution.y;
	vec3 c = vec3(0.01,0.05,0.008);
    
    c+=sky(uv);
    c+=wing(uv);
    c+=sun(uv);
    
    fragColor = vec4(c, 1.);
}