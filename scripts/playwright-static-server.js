const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT || 8080);
const ROOT = process.cwd();

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
};

function safePath(requestPath) {
    const cleanPath = decodeURIComponent(requestPath.split('?')[0]);
    const normalized = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, '');
    const relative = normalized === path.sep ? 'index.html' : normalized.replace(/^[/\\]/, '');
    return path.join(ROOT, relative);
}

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url || '/');
    const absolutePath = safePath(parsed.pathname || '/');

    if (!absolutePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    let filePath = absolutePath;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
    console.log(`Playwright static server running at http://localhost:${PORT}`);
});
