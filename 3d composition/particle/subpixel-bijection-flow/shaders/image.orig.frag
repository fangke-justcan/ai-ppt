/* Subpixel Bijection Flow — chronos (Shadertoy 73c3R7) · Image (image)
 * 原作未修改源码备份（字节级一致）。运行版本在同名 .frag 中做了参数化。
 * 注意：缺少 uniform 声明，非独立可编译源码，由运行器注入头部。
 */

void mainImage( out vec4 O, in vec2 p ) { O = texelFetch(iChannel0, ivec2(p), 0); }