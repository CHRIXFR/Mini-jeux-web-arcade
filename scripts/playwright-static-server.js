const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const ROOT = path.resolve(process.cwd());

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://gc.zgo.at",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data:",
        "media-src 'self' blob:",
        "connect-src 'self' https://api.github.com https://formspree.io https://mini-arcade.goatcounter.com",
        "form-action https://formspree.io",
        'upgrade-insecure-requests'
    ].join('; ')
};

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
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
    const cleanPath = decodeURIComponent(requestPath || '/');
    const normalized = path.normalize(cleanPath);
    const relative = normalized === path.sep ? 'index.html' : normalized.replace(/^[/\\]+/, '');
    return path.resolve(ROOT, relative);
}

function isInsideRoot(filePath) {
    const relative = path.relative(ROOT, filePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function writeResponse(res, status, headers = {}) {
    res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
}

const server = http.createServer((req, res) => {
    const parsed = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const absolutePath = safePath(parsed.pathname || '/');

    if (!isInsideRoot(absolutePath)) {
        writeResponse(res, 403);
        res.end('Forbidden');
        return;
    }

    let filePath = absolutePath;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
        writeResponse(res, 404);
        res.end('Not found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    writeResponse(res, 200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
    console.log(`Playwright static server running at http://localhost:${PORT}`);
});
