// CPU 参考模拟：把 Shadertoy 73c3R7 Buffer A 的算法逐帧复算（float64），
// 用于仲裁本地 WebGL 运行器的输出是否正确。
// 用法: node cpu_sim.js [W] [H] [frames]
const W = Number(process.argv[2]) || 256;
const H = Number(process.argv[3]) || 144;
const FRAMES = Number(process.argv[4]) || 1025;
const CH = process.argv[5] === 'gray' ? 1 : 3;   // gray=单通道加速

const T = 2 * Math.acos(-1);
const PHI = 0.5 * Math.sqrt(5) - 0.5;

// GLSL round(): 半数远离零；JS Math.round(): 半数向 +∞。对结构无影响。
const round = Math.round;
// GLSL mod(x,y) = x - y*floor(x/y)
const gmod = (x, y) => x - y * Math.floor(x / y);

function D(c, tx, ty, i) {
  const P = i * PHI;
  let rx = tx * 9 * Math.sin(P * T);
  let ry = ty * 9 * Math.sin(P * T);
  const t0 = tx + P, t1 = ty + P;
  let Cx = c * T, Cy = c * T;
  Cx += 0.5 * Math.sin(Cx + t0 * 0.1);
  Cy += 0.5 * Math.sin(Cy + t1 * 0.1);
  let vx = 320, vy = 1, vz = 0.14;
  for (let j = 0.1; j < 0.24; j += 0.02) {
    rx += vx * Math.cos(vy * Cx + vz * t0 + j);
    ry += vx * Math.cos(vy * Cy + vz * t1 + j);
    vx *= 0.45; vy *= 2; vz *= -1.1;
  }
  return round(rx - ry);
}

// 状态缓冲（RGBA8 → 每通道 0..255）
let buf = new Float32Array(W * H * 3);
let tmp = new Float32Array(W * H * 3);

function init(f) {
  // exp2(4*sin(q.x/99)-4) → 0..255
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = Math.pow(2, 4 * Math.sin(x / 99) - 4) * 255;
      const o = (y * W + x) * 3;
      buf[o] = buf[o + 1] = buf[o + 2] = v;
    }
}

function step(f) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3;
      // 逐通道独立错位
      for (let c = 0; c < 3; c++) {
        let px = x, py = y;
        for (let i = 0; i < 6; i++) {
          const axis = i & 1, other = (~i) & 1;
          const cc = (other === 0 ? px / W : py / H);
          const d = D(cc, f / 60 + c * 0.05, (f - 1) / 60 + c * 0.05, i);
          if (axis === 0) px = gmod(px - d, W);
          else py = gmod(py - d, H);
        }
        const so = ((py | 0) * W + (px | 0)) * 3;
        tmp[o + c] = buf[so + c];
      }
    }
  [buf, tmp] = [tmp, buf];
}

const CHECKS = [9, 50, 200, 600, 1024];
const RAMP = ' .:-=+*#%@';
init(0);
for (let f = 0; f < FRAMES; f++) {
  if (f >= 9) step(f); else { /* iFrame<9: init 分支 */ if (f === 0) init(0); }
  if (CHECKS.includes(f)) {
    // ASCII 预览（亮度 = R 通道）
    console.log(`\n===== frame ${f} =====`);
    for (let y = 0; y < H; y += Math.max(1, H >> 5)) {
      let line = '';
      for (let x = 0; x < W; x += Math.max(1, W >> 6)) {
        const v = buf[(y * W + x) * 3] / 255;
        line += RAMP[Math.min(9, v * 10 | 0)];
      }
      console.log(line);
    }
  }
}
console.log('\ndone');
