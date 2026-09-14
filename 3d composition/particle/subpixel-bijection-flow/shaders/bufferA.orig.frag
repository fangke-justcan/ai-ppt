/* Subpixel Bijection Flow — chronos (Shadertoy 73c3R7) · Buffer A (buffer)
 * 原作未修改源码备份（字节级一致）。运行版本在同名 .frag 中做了参数化。
 * 注意：缺少 uniform 声明，非独立可编译源码，由运行器注入头部。
 */

float T = 2.*acos(-1.);

float D(float c, vec2 t, int i)
{
    float P = float(i) * (.5 * sqrt(5.)-.5);  // Golden ratio / Weyl sequence
    vec2 r = t * 9. * sin(P * T); // Drift - Golden angle
    t += P;
    vec2 C = vec2(c * T);          // Ensure continuous boundarties for toroidal wrap
    C += .5 * sin(C + t * .1);
    
    // v.x = amplitude, v.y = frequency, v.z = time multiplier
    vec3 v = vec3(320., 1., .14); // y component / freq scale must always be int!
    for(float j = .1; j < .24; j += .02, v *= vec3(.45, 2., -1.1)) // Here as well.
        r += v.x * cos(v.y * C + v.z * t + j);
    
    r = round(r);
    return r.x - r.y;
}

void mainImage( out vec4 O, in vec2 q )
{
    vec3 result = vec3(0);
    for(int c = 0; c < 3; c++)
     {
        vec2 p = q;
         for(int i = 0; i < 6; i++)
        p[i&1] = mod(p[i&1] - 
            D((p/iResolution.xy)[~i&1], 
            vec2(iFrame,iFrame-1)/60. + float(c)*.05, i),
            iResolution[i&1]); // Shift row or col by a constant, with wrap
        result[c] = texelFetch(iChannel0, ivec2(p), 0)[c];
    }
    O = iFrame < 9 ? 
        exp2(4.*sin(vec4(q.x/99.))-4.)  // initialize
        :
        
        vec4(result, 1);
}