// 静态文件服务器 — 交互教程（tutorial/）
// 服务整个项目目录：/ → 教程首页；/index.html → 主程序（紫金花本尊）
// 用法: node tutorial/server.js  [端口默认 8945]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8945;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.md': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') {  // 重定向而不是代填内容，保证页面内相对路径可用
    res.writeHead(301, { Location: '/tutorial/index.html' });
    return res.end();
  }
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404 Not Found: ' + urlPath); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',  // 教程频繁迭代，禁止浏览器缓存旧脚本
    });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`紫金花交互课堂: http://localhost:${PORT}/`);
  console.log(`（同服务器下主程序: http://localhost:${PORT}/index.html）`);
});
