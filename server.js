const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'chat.db');
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
const MAX_CACHE_MESSAGES = 500;
const DEFAULT_ROOM = '大厅';
const ROOM_TOPICS = ['综合', '技术', '游戏', '生活', '产品', '其他'];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// ========== SQLite 持久化 ==========
const db = new DatabaseSync(DB_FILE);
db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS rooms (
        name TEXT PRIMARY KEY,
        topic TEXT NOT NULL DEFAULT '综合',
        created_at INTEGER NOT NULL,
        created_by TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        username TEXT,
        avatar TEXT,
        type TEXT NOT NULL,
        content TEXT,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        created_text TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room, id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
`);

const insertRoomStmt = db.prepare('INSERT OR IGNORE INTO rooms (name, topic, created_at, created_by) VALUES (?, ?, ?, ?)');
const insertMessageStmt = db.prepare(`
    INSERT INTO messages (room, username, avatar, type, content, payload, created_at, created_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const deleteMessageStmt = db.prepare('DELETE FROM messages WHERE id = ? AND username = ?');

// 预置几个带话题的房间，避免新用户进入后发现页空空如也
[
    ['大厅', '综合'],
    ['技术交流', '技术'],
    ['游戏开黑', '游戏'],
    ['生活闲聊', '生活']
].forEach(([name, topic], index) => {
    insertRoomStmt.run(name, topic, Date.now() + index, 'system');
});

const PRESENCE_ROOMS = {};
const roomNames = db.prepare('SELECT name FROM rooms ORDER BY created_at ASC').all().map(r => r.name);
roomNames.forEach(name => { PRESENCE_ROOMS[name] = []; });
if (!PRESENCE_ROOMS[DEFAULT_ROOM]) PRESENCE_ROOMS[DEFAULT_ROOM] = [];

// ========== 工具函数 ==========
function json(res, data, status = 200) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatTimestamp(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function escapeLike(value) {
    return String(value).replace(/[\\%_]/g, '\\$&');
}

function decodeParam(value) {
    if (!value) return '';
    try {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(Buffer.from(normalized, 'base64').toString('utf8'));
    } catch (e) {
        return '';
    }
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtml(value) {
    return String(value == null ? '' : value)
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

function generateAvatar(username) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#00CED1'
    ];
    return colors[(username && username.charCodeAt ? username.charCodeAt(0) : 0) % colors.length];
}

function rowToMessage(row) {
    let message;
    try {
        message = JSON.parse(row.payload);
    } catch (e) {
        message = { type: 'message', content: row.content || '' };
    }
    message.id = String(row.id);
    message.room = row.room;
    return message;
}

function getRecentMessages(room, limit = 50) {
    const rows = db.prepare('SELECT id, room, payload FROM messages WHERE room = ? ORDER BY id DESC LIMIT ?')
        .all(room, limit);
    return rows.reverse().map(rowToMessage);
}

function hasOlderMessages(room, beforeId) {
    if (!beforeId) return false;
    const row = db.prepare('SELECT 1 AS found FROM messages WHERE room = ? AND id < ? LIMIT 1').get(room, beforeId);
    return !!row;
}

function countOnline(room) {
    let count = 0;
    users.forEach(user => {
        if (user && user.room === room) count += 1;
    });
    return count;
}

// ========== 消息缓存（仅用于反应/已读/撤回等实时操作，完整历史在 SQLite） ==========
let users = new Map();
let messageCache = {};
let pinnedMessages = {};

function getRoomMessages(room) {
    if (!messageCache[room]) messageCache[room] = [];
    return messageCache[room];
}

function cacheMessage(room, message) {
    const list = getRoomMessages(room);
    list.push(message);
    if (list.length > MAX_CACHE_MESSAGES) list.shift();
}

function findCachedMessage(room, messageId) {
    return getRoomMessages(room).find(m => String(m.id) === String(messageId));
}

// 仅持久化群聊内容消息；私聊和系统提示不入库，避免隐私与噪音
function saveGroupMessage(data) {
    const createdAt = Date.now();
    const timestamp = data.timestamp || formatTimestamp(createdAt);
    const message = { ...data, timestamp };
    const payload = JSON.stringify(message);
    const info = insertMessageStmt.run(
        message.room,
        message.username || '',
        message.avatar || '',
        message.type,
        message.content || '',
        payload,
        createdAt,
        timestamp
    );
    message.id = String(info.lastInsertRowid);
    cacheMessage(message.room, message);
    return message;
}

function ensureRoom(room, topic = '综合', createdBy = '') {
    if (!room) return;
    if (!PRESENCE_ROOMS[room]) PRESENCE_ROOMS[room] = [];
    insertRoomStmt.run(room, ROOM_TOPICS.includes(topic) ? topic : '其他', Date.now(), createdBy || '');
}

function listRoomNames() {
    return db.prepare('SELECT name FROM rooms ORDER BY created_at ASC').all().map(r => r.name);
}

// ========== HTTP 服务 ==========
const server = http.createServer((req, res) => {
    let parsed;
    try {
        parsed = new URL(req.url, 'http://localhost');
    } catch (e) {
        res.writeHead(400);
        res.end('Bad Request');
        return;
    }
    const pathname = decodeURIComponent(parsed.pathname);

    try {
        if (pathname === '/api/upload' && req.method === 'POST') {
            handleUpload(req, res);
            return;
        }
        if (pathname === '/api/messages' && req.method === 'GET') {
            handleMessagesApi(parsed, res);
            return;
        }
        if (pathname === '/api/rooms' && req.method === 'GET') {
            handleRoomsApi(res);
            return;
        }
        if (pathname === '/api/export' && req.method === 'GET') {
            handleExportApi(parsed, res);
            return;
        }
        if (pathname === '/api/ice' && req.method === 'GET') {
            json(res, { iceServers: getIceServers() });
            return;
        }
        if (pathname.startsWith('/uploads/')) {
            serveUpload(pathname, req, res);
            return;
        }
        serveStatic(pathname, res);
    } catch (error) {
        console.error('请求处理失败:', error);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Server Error');
        }
    }
});

// ========== 上传 ==========
const MIME_EXT = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'text/plain': '.txt',
    'application/zip': '.zip'
};

const EXT_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.webm': 'audio/webm',
    '.mp4': 'video/mp4',
    '.txt': 'text/plain; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.zip': 'application/zip'
};

function handleUpload(req, res) {
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_UPLOAD_SIZE) {
        res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('文件过大，最大支持 50MB');
        req.resume();
        return;
    }

    const chunks = [];
    req.on('data', chunk => {
        chunks.push(chunk);
        if (chunks.reduce((sum, c) => sum + c.length, 0) > MAX_UPLOAD_SIZE) {
            res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('文件过大，最大支持 50MB');
            req.destroy();
        }
    });
    req.on('end', () => {
        try {
            const contentType = req.headers['content-type'] || '';
            const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
            const boundary = boundaryMatch && (boundaryMatch[1] || boundaryMatch[2]);
            if (!boundary) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Upload failed: missing boundary');
                return;
            }

            const buffer = Buffer.concat(chunks);
            const separator = Buffer.from('--' + boundary);
            const firstSeparator = buffer.indexOf(separator);
            if (firstSeparator === -1) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Upload failed: bad body');
                return;
            }
            const partStart = buffer.indexOf('\r\n\r\n', firstSeparator);
            if (partStart === -1) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Upload failed: bad part');
                return;
            }
            const headerText = buffer.slice(firstSeparator, partStart).toString('utf8');
            const filenameMatch = /filename="([^"]*)"/i.exec(headerText);
            if (!filenameMatch) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Upload failed: missing filename');
                return;
            }
            const originalName = filenameMatch[1] || 'file';
            const mimeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headerText);
            const mime = (mimeMatch ? mimeMatch[1].trim().toLowerCase() : 'application/octet-stream');
            const dataStart = partStart + 4;
            const nextSeparator = buffer.indexOf(Buffer.from('\r\n--' + boundary), dataStart);
            const content = buffer.slice(dataStart, nextSeparator === -1 ? buffer.length : nextSeparator);

            let ext = path.extname(originalName).toLowerCase();
            if (!/^\.[a-z0-9]{1,10}$/.test(ext)) {
                ext = MIME_EXT[mime] || '.bin';
            }

            const filename = Date.now() + '_' + Math.random().toString(36).slice(2, 11) + ext;
            fs.writeFileSync(path.join(UPLOAD_DIR, filename), content);

            json(res, {
                url: '/uploads/' + filename,
                name: originalName,
                size: content.length,
                type: mime
            });
        } catch (error) {
            console.error('上传失败:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Upload failed');
        }
    });
    req.on('error', error => {
        console.error('上传连接错误:', error);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end('Upload failed');
        }
    });
}

function serveUpload(pathname, req, res) {
    const safePath = path.resolve(__dirname, '.' + pathname);
    if (!safePath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(safePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = EXT_MIME[ext] || 'application/octet-stream';
        const range = req.headers.range;
        const headers = {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
            'Content-Disposition': 'inline'
        };

        if (!range) {
            headers['Content-Length'] = stat.size;
            res.writeHead(200, headers);
            fs.createReadStream(safePath).pipe(res);
            return;
        }

        const match = /bytes=(\d*)-(\d*)/.exec(range);
        if (!match) {
            res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
            res.end();
            return;
        }
        let start = match[1] ? Number(match[1]) : NaN;
        let end = match[2] ? Number(match[2]) : NaN;
        if (Number.isNaN(start)) {
            start = Math.max(0, stat.size - (Number.isNaN(end) ? 0 : end));
            end = stat.size - 1;
        } else if (Number.isNaN(end) || end >= stat.size) {
            end = stat.size - 1;
        }
        if (start > end || start >= stat.size) {
            res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
            res.end();
            return;
        }

        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
        headers['Content-Length'] = end - start + 1;
        res.writeHead(206, headers);
        fs.createReadStream(safePath, { start, end }).pipe(res);
    });
}

function serveStatic(pathname, res) {
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    if (pathname === '/') filePath = path.join(__dirname, 'index.html');

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    });
}

// ========== 历史分页 / 搜索 ==========
function handleMessagesApi(parsed, res) {
    const roomFromId = decodeParam(parsed.searchParams.get('roomId'));
    const roomParam = roomFromId || parsed.searchParams.get('room');
    const room = roomParam === 'all' ? null : (roomParam || DEFAULT_ROOM);
    const q = (decodeParam(parsed.searchParams.get('qId')) || parsed.searchParams.get('q') || '').trim();
    const user = (decodeParam(parsed.searchParams.get('userId')) || parsed.searchParams.get('user') || '').trim();
    const before = Number(parsed.searchParams.get('before')) || null;
    const limit = Math.min(Math.max(Number(parsed.searchParams.get('limit')) || 30, 1), 100);

    let sql = 'SELECT id, room, payload FROM messages WHERE 1 = 1';
    const params = [];
    if (room) {
        sql += ' AND room = ?';
        params.push(room);
    }
    if (before) {
        sql += ' AND id < ?';
        params.push(before);
    }
    if (q) {
        sql += " AND (content LIKE ? ESCAPE '\\' OR username LIKE ? ESCAPE '\\')";
        const like = '%' + escapeLike(q) + '%';
        params.push(like, like);
    }
    if (user) {
        sql += ' AND username = ?';
        params.push(user);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit + 1);

    const rows = db.prepare(sql).all(...params);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    page.reverse();

    json(res, {
        room: room || 'all',
        messages: page.map(rowToMessage),
        hasMore
    });
}

// ========== 房间发现 ==========
function handleRoomsApi(res) {
    const rows = db.prepare(`
        SELECT r.name, r.topic, r.created_at AS createdAt,
            (SELECT COUNT(*) FROM messages m WHERE m.room = r.name) AS messageCount,
            (SELECT MAX(m.created_at) FROM messages m WHERE m.room = r.name) AS lastActivity
        FROM rooms r
        ORDER BY r.created_at ASC
    `).all();

    json(res, {
        rooms: rows.map(row => ({
            name: row.name,
            topic: row.topic || '其他',
            createdAt: row.createdAt,
            messageCount: Number(row.messageCount) || 0,
            lastActivity: row.lastActivity ? Number(row.lastActivity) : null,
            onlineCount: countOnline(row.name)
        })),
        topics: ROOM_TOPICS
    });
}

// ========== 服务端导出 ==========
function handleExportApi(parsed, res) {
    const room = decodeParam(parsed.searchParams.get('roomId')) ||
        parsed.searchParams.get('room') || DEFAULT_ROOM;
    const format = (parsed.searchParams.get('format') || 'json').toLowerCase();

    const rows = room === 'all'
        ? db.prepare('SELECT id, room, payload FROM messages ORDER BY id ASC').all()
        : db.prepare('SELECT id, room, payload FROM messages WHERE room = ? ORDER BY id ASC').all(room);
    const messages = rows.map(rowToMessage);

    const now = new Date();
    const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
    const roomLabel = room === 'all' ? '全部房间' : room;
    const safeRoom = roomLabel.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40) || 'chat';

    let content;
    let extension;
    let contentType;

    if (format === 'md') {
        content = buildMarkdownExport(messages, roomLabel, now);
        extension = 'md';
        contentType = 'text/markdown; charset=utf-8';
    } else if (format === 'html') {
        content = buildHtmlExport(messages, roomLabel, now);
        extension = 'html';
        contentType = 'text/html; charset=utf-8';
    } else {
        content = JSON.stringify({
            room: roomLabel,
            exportedAt: now.toISOString(),
            count: messages.length,
            messages
        }, null, 2);
        extension = 'json';
        contentType = 'application/json; charset=utf-8';
    }

    const filename = `${safeRoom}-chat-${date}.${extension}`;
    res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="chat-${date}.${extension}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store'
    });
    res.end(content, 'utf-8');
}

function messageAttachmentMarkdown(message) {
    if ((message.type === 'imageMessage') && message.imageUrl) {
        return `\n\n![图片](${message.imageUrl})`;
    }
    if (message.type === 'audioMessage' && message.audioUrl) {
        return `\n\n[语音 ${message.duration || ''}s](${message.audioUrl})`;
    }
    if ((message.type === 'fileMessage' || message.type === 'privateFileMessage') && message.fileUrl) {
        return `\n\n[文件](${message.fileUrl})`;
    }
    if (message.type === 'locationMessage' && message.latitude != null && message.longitude != null) {
        return `\n\n[位置](https://uri.amap.com/marker?position=${message.longitude},${message.latitude})`;
    }
    return '';
}

function buildMarkdownExport(messages, roomLabel, now) {
    const lines = [
        `# ${roomLabel} 聊天记录`,
        '',
        `- 导出时间：${now.toLocaleString('zh-CN')}`,
        `- 消息数量：${messages.length}`,
        ''
    ];
    messages.forEach(message => {
        const roomBadge = roomLabel === '全部房间' ? ` [${message.room}]` : '';
        lines.push(`## ${message.username || '系统'}${roomBadge}`);
        lines.push(`_${message.timestamp || ''}_`);
        lines.push('');
        if (message.content) lines.push(message.content);
        const attachment = messageAttachmentMarkdown(message);
        if (attachment) lines.push(attachment);
        lines.push('');
        lines.push('---');
        lines.push('');
    });
    return lines.join('\n');
}

function buildHtmlExport(messages, roomLabel, now) {
    const items = messages.map(message => {
        const attachments = [];
        if (message.type === 'imageMessage' && message.imageUrl) {
            attachments.push(`<img src="${escapeHtml(message.imageUrl)}" alt="图片" loading="lazy">`);
        }
        if (message.type === 'audioMessage' && message.audioUrl) {
            attachments.push(`<audio controls preload="metadata" src="${escapeHtml(message.audioUrl)}"></audio>`);
        }
        if ((message.type === 'fileMessage' || message.type === 'privateFileMessage') && message.fileUrl) {
            attachments.push(`<a class="file" href="${escapeHtml(message.fileUrl)}" target="_blank" rel="noopener">📎 ${escapeHtml(message.fileName || '文件')}</a>`);
        }
        if (message.type === 'locationMessage' && message.latitude != null && message.longitude != null) {
            attachments.push(`<a class="file" href="https://uri.amap.com/marker?position=${message.longitude},${message.latitude}" target="_blank" rel="noopener">📍 ${message.latitude}, ${message.longitude}</a>`);
        }
        return `
        <article class="message">
            <header>
                <strong>${escapeHtml(message.username || '系统')}</strong>
                <span>${escapeHtml(message.timestamp || '')}${roomLabel === '全部房间' ? ' · ' + escapeHtml(message.room) : ''}</span>
            </header>
            <div class="content">${escapeHtml(message.content || '').replace(/\n/g, '<br>')}</div>
            ${attachments.join('\n')}
        </article>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(roomLabel)} 聊天记录</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 860px; margin: 0 auto; padding: 24px; background: #f5f6fa; color: #1f2937; }
    h1 { margin: 0 0 8px; }
    .meta { color: #6b7280; margin-bottom: 24px; }
    .message { background: #fff; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06); }
    .message header { display: flex; justify-content: space-between; gap: 12px; color: #6b7280; font-size: 12px; margin-bottom: 8px; }
    .message header strong { color: #4f46e5; font-size: 14px; }
    .content { line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
    img { max-width: 100%; border-radius: 8px; margin-top: 10px; }
    audio { width: 100%; margin-top: 10px; }
    .file { display: inline-block; margin-top: 10px; color: #4f46e5; text-decoration: none; }
</style>
</head>
<body>
    <h1>${escapeHtml(roomLabel)} 聊天记录</h1>
    <div class="meta">导出时间：${escapeHtml(now.toLocaleString('zh-CN'))} · 消息数量：${messages.length}</div>
    ${items}
</body>
</html>`;
}

// ========== TURN / ICE ==========
function getIceServers() {
    const servers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];
    const turnUrls = (process.env.TURN_URLS || process.env.TURN_URL || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    if (turnUrls.length > 0) {
        const turn = { urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls };
        if (process.env.TURN_USERNAME) turn.username = process.env.TURN_USERNAME;
        if (process.env.TURN_CREDENTIAL) turn.credential = process.env.TURN_CREDENTIAL;
        servers.push(turn);
    }
    return servers;
}

// ========== 机器人命令 ==========
const BOT = { username: '小助手', avatar: '#8b5cf6' };

async function fetchJson(url, timeout = 10000) {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: {
            'User-Agent': 'simple-chat-app/1.7 (+https://github.com)',
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

async function botWeather(city) {
    const target = city || 'Beijing';
    const data = await fetchJson(`https://wttr.in/${encodeURIComponent(target)}?format=j1&lang=zh`);
    const current = data.current_condition && data.current_condition[0];
    if (!current) throw new Error('天气数据为空');
    const description = (current.lang_zh && current.lang_zh[0] && current.lang_zh[0].value)
        || (current.weatherDesc && current.weatherDesc[0] && current.weatherDesc[0].value)
        || '未知天气';
    const area = data.nearest_area && data.nearest_area[0];
    const areaName = area && area.areaName && area.areaName[0] ? area.areaName[0].value : target;
    return [
        `🌤️ ${areaName} 当前天气`,
        `${description}，气温 ${current.temp_C}°C（体感 ${current.FeelsLikeC}°C）`,
        `湿度 ${current.humidity}% · 风 ${current.winddir16Point || '-'} ${current.windspeedKmph || '-'}km/h`,
        `观测时间 ${current.observation_time || '-'}`
    ].join('\n');
}

async function botRate(args) {
    const tokens = args.filter(Boolean);
    let amount = 1;
    let from = 'CNY';
    let to = 'USD';

    if (tokens.length >= 3) {
        amount = Number(tokens[0]);
        from = tokens[1].toUpperCase();
        to = tokens[2].toUpperCase();
    } else if (tokens.length === 2) {
        from = tokens[0].toUpperCase();
        to = tokens[1].toUpperCase();
    } else if (tokens.length === 1) {
        to = tokens[0].toUpperCase();
    }

    if (!Number.isFinite(amount) || amount <= 0) amount = 1;
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
        return '汇率用法：`/rate [金额] 源币种 目标币种`，例如 `/rate 100 USD CNY`';
    }
    if (from === to) {
        return `💱 ${amount} ${from} = ${amount.toFixed(2)} ${to}`;
    }

    const data = await fetchJson(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
    const rate = data.rates && data.rates[to];
    if (!rate) throw new Error('不支持的币种');
    return [
        `💱 ${amount} ${from} = ${(amount * rate).toFixed(2)} ${to}`,
        `参考汇率 1 ${from} = ${rate} ${to}（${data.date || '最新'}）`
    ].join('\n');
}

function extractLocalTodayEvents(data, month, day) {
    const mmdd = pad2(month) + pad2(day);
    const dashed = `${pad2(month)}-${pad2(day)}`;
    let list = data[mmdd] || data[dashed] || data[`${month}-${day}`];
    if (!list && data[pad2(month)] && data[pad2(month)][mmdd]) {
        list = data[pad2(month)][mmdd];
    }
    return Array.isArray(list) ? list : [];
}

async function botToday() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    let events = [];
    const localFile = path.join(DATA_DIR, 'historical_events.json');
    if (fs.existsSync(localFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(localFile, 'utf-8'));
            events = extractLocalTodayEvents(data, month, day);
        } catch (e) {
            console.error('读取本地 historical_events.json 失败:', e.message);
        }
    }

    if (!events.length) {
        const remoteUrl = process.env.LSSDJT_URL || 'https://www.lssdjt.com/historical_events.json';
        try {
            const data = await fetchJson(remoteUrl, 8000);
            events = extractLocalTodayEvents(data, month, day);
        } catch (e) {
            // lssdjt 站点当前可能不可用，降级到百度百科公开的“历史上的今天”数据
        }
    }

    if (!events.length) {
        try {
            const data = await fetchJson(`https://baike.baidu.com/cms/home/eventsOnHistory/${pad2(month)}.json`, 8000);
            const monthData = data[pad2(month)] || {};
            events = monthData[pad2(month) + pad2(day)] || [];
        } catch (e) {
            // ignore, handled below
        }
    }

    if (!events.length) {
        return `📅 历史上的今天（${month}月${day}日）\n暂时没有取到数据，请稍后再试。`;
    }

    const lines = [`📅 历史上的今天（${month}月${day}日）`];
    events.slice(0, 5).forEach(item => {
        const year = item.year ? `${item.year}年` : '';
        const title = stripHtml(item.title || item.content || item.desc || '');
        if (title) lines.push(`• ${year}${title}`);
    });
    return lines.join('\n');
}

function botHelp() {
    return [
        '🤖 可用命令：',
        '/weather <城市> — 查询实时天气，例如 /weather 杭州',
        '/rate [金额] <源币种> <目标币种> — 查询汇率，例如 /rate 100 USD CNY',
        '/today — 查看历史上的今天',
        '/help — 查看命令帮助'
    ].join('\n');
}

async function handleBotCommand(rawContent, room) {
    const content = String(rawContent || '').trim();
    const [command, ...args] = content.split(/\s+/);
    const cmd = command.toLowerCase();

    let reply;
    try {
        if (cmd === '/weather' || cmd === '/天气') {
            reply = await botWeather(args.join(' ').trim());
        } else if (cmd === '/rate' || cmd === '/汇率') {
            reply = await botRate(args);
        } else if (cmd === '/today' || cmd === '/今天') {
            reply = await botToday();
        } else if (cmd === '/help' || cmd === '/帮助') {
            reply = botHelp();
        } else {
            reply = `未知命令：${command}\n\n${botHelp()}`;
        }
    } catch (error) {
        console.error('机器人命令失败:', error);
        reply = `😵 命令执行失败：${error.message || '服务暂时不可用'}\n请稍后再试。`;
    }

    const message = saveGroupMessage({
        type: 'message',
        username: BOT.username,
        avatar: BOT.avatar,
        content: reply,
        room,
        isPrivate: false,
        isBot: true,
        reads: {}
    });
    broadcastToRoom(room, message);
}

// ========== WebSocket ==========
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    let username = '';
    let avatar = '';
    let currentRoom = DEFAULT_ROOM;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'login') {
                username = data.username || 'Guest';
                avatar = data.avatar || generateAvatar(username);
                currentRoom = data.room || DEFAULT_ROOM;
                ensureRoom(currentRoom, '综合', username);

                users.set(ws, { username, avatar, room: currentRoom });

                if (!PRESENCE_ROOMS[currentRoom]) PRESENCE_ROOMS[currentRoom] = [];
                PRESENCE_ROOMS[currentRoom].push(username);

                const userList = getRoomUsers(currentRoom);
                const roomMessages = getRecentMessages(currentRoom, 50);

                broadcastToRoom(currentRoom, {
                    type: 'system',
                    message: `${username} 加入了 ${currentRoom}`,
                    users: userList
                });

                ws.send(JSON.stringify({
                    type: 'loginSuccess',
                    username,
                    avatar,
                    room: currentRoom,
                    rooms: listRoomNames(),
                    messages: roomMessages,
                    hasMore: hasOlderMessages(currentRoom, roomMessages[0] && roomMessages[0].id),
                    pinnedMessages
                }));

            } else if (data.type === 'message') {
                const content = String(data.content || '');
                if (content.trim().startsWith('/')) {
                    handleBotCommand(content, currentRoom);
                    return;
                }

                const messageData = saveGroupMessage({
                    type: 'message',
                    username,
                    avatar,
                    content,
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    replyTo: data.replyTo || null
                });

                broadcastToRoom(currentRoom, messageData);

            } else if (data.type === 'imageMessage') {
                const messageData = saveGroupMessage({
                    type: 'imageMessage',
                    username,
                    avatar,
                    imageUrl: data.imageUrl,
                    content: data.content || '[图片]',
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {},
                    replyTo: data.replyTo || null
                });

                broadcastToRoom(currentRoom, messageData);

            } else if (data.type === 'audioMessage') {
                const messageData = saveGroupMessage({
                    type: 'audioMessage',
                    username,
                    avatar,
                    audioUrl: data.audioUrl,
                    duration: data.duration || 0,
                    content: data.content || '[语音]',
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {},
                    replyTo: data.replyTo || null
                });

                broadcastToRoom(currentRoom, messageData);

            } else if (data.type === 'fileMessage') {
                const messageData = saveGroupMessage({
                    type: 'fileMessage',
                    username,
                    avatar,
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    fileType: data.fileType || '',
                    content: data.content || '[文件]',
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {},
                    replyTo: data.replyTo || null
                });

                broadcastToRoom(currentRoom, messageData);

            } else if (data.type === 'privateFileMessage') {
                const timestamp = formatTimestamp();
                const messageData = {
                    type: 'privateFileMessage',
                    id: Date.now().toString(),
                    username,
                    avatar,
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    fileType: data.fileType || '',
                    content: data.content,
                    timestamp,
                    toUser: data.toUser,
                    isPrivate: true
                };

                broadcastToUser(data.toUser, messageData);
                ws.send(JSON.stringify(messageData));

            } else if (data.type === 'privateMessage') {
                const timestamp = formatTimestamp();
                const messageData = {
                    type: 'privateMessage',
                    id: Date.now().toString(),
                    username,
                    avatar,
                    content: data.content || '',
                    timestamp,
                    toUser: data.toUser,
                    isPrivate: true,
                    isEncrypted: !!data.isEncrypted
                };

                broadcastToUser(data.toUser, messageData);
                ws.send(JSON.stringify(messageData));

            } else if (data.type === 'recall') {
                const messageId = data.messageId;
                const list = getRoomMessages(currentRoom);
                const messageIndex = list.findIndex(m => String(m.id) === String(messageId) && m.username === username);

                if (messageIndex !== -1) {
                    list.splice(messageIndex, 1);
                }
                try {
                    deleteMessageStmt.run(Number(messageId), username);
                } catch (e) {
                    // 私聊消息或非法 id 忽略
                }

                broadcastToRoom(currentRoom, {
                    type: 'messageRecalled',
                    messageId,
                    username
                });

            } else if (data.type === 'readMessage') {
                const messageId = data.messageId;
                const message = findCachedMessage(currentRoom, messageId);

                if (message && username !== message.username) {
                    message.reads = message.reads || {};
                    message.reads[username] = true;
                    broadcastToRoom(currentRoom, {
                        type: 'messageRead',
                        messageId,
                        reader: username
                    });
                }

            } else if (data.type === 'createRoom') {
                const roomName = String(data.roomName || '').trim();
                if (roomName && !PRESENCE_ROOMS[roomName]) {
                    const topic = ROOM_TOPICS.includes(data.topic) ? data.topic : '其他';
                    ensureRoom(roomName, topic, username);
                    PRESENCE_ROOMS[roomName] = [];
                    broadcastToAll({
                        type: 'roomCreated',
                        room: roomName,
                        topic
                    });
                }

            } else if (data.type === 'joinRoom') {
                const oldRoom = currentRoom;
                const newRoom = data.room || DEFAULT_ROOM;
                ensureRoom(newRoom, '综合', username);

                if (PRESENCE_ROOMS[oldRoom]) {
                    PRESENCE_ROOMS[oldRoom] = PRESENCE_ROOMS[oldRoom].filter(u => u !== username);
                }

                if (!PRESENCE_ROOMS[newRoom]) {
                    PRESENCE_ROOMS[newRoom] = [];
                }
                PRESENCE_ROOMS[newRoom].push(username);

                currentRoom = newRoom;
                const userData = users.get(ws);
                if (userData) {
                    userData.room = currentRoom;
                }

                broadcastToRoom(oldRoom, {
                    type: 'system',
                    message: `${username} 离开了 ${oldRoom}`,
                    users: getRoomUsers(oldRoom)
                });

                broadcastToRoom(newRoom, {
                    type: 'system',
                    message: `${username} 加入了 ${newRoom}`,
                    users: getRoomUsers(newRoom)
                });

                const roomMessages = getRecentMessages(newRoom, 50);
                ws.send(JSON.stringify({
                    type: 'joinedRoom',
                    room: newRoom,
                    messages: roomMessages,
                    hasMore: hasOlderMessages(newRoom, roomMessages[0] && roomMessages[0].id),
                    users: getRoomUsers(newRoom)
                }));

            } else if (data.type === 'typing') {
                broadcastToOthersInRoom(ws, currentRoom, {
                    type: 'typing',
                    username
                });
            } else if (data.type === 'stopTyping') {
                broadcastToOthersInRoom(ws, currentRoom, {
                    type: 'stopTyping',
                    username
                });
            } else if (data.type === 'updateProfile') {
                const newUsername = data.newUsername;
                const newAvatar = data.newAvatar;
                const oldUsername = username;

                if (newUsername) username = newUsername;
                if (newAvatar) avatar = newAvatar;

                const userData = users.get(ws);
                if (userData) {
                    userData.username = username;
                    userData.avatar = avatar;
                }

                if (PRESENCE_ROOMS[currentRoom]) {
                    const userIndex = PRESENCE_ROOMS[currentRoom].indexOf(oldUsername);
                    if (userIndex !== -1) {
                        PRESENCE_ROOMS[currentRoom][userIndex] = username;
                    }
                }

                getRoomMessages(currentRoom).forEach(msg => {
                    if (msg.username === oldUsername) {
                        msg.username = username;
                        msg.avatar = avatar;
                    }
                });

                ws.send(JSON.stringify({
                    type: 'profileUpdated',
                    username,
                    avatar
                }));

                broadcastToRoom(currentRoom, {
                    type: 'system',
                    message: oldUsername + ' 修改了昵称为 ' + username,
                    users: getRoomUsers(currentRoom)
                });
            } else if (data.type === 'addReaction') {
                const message = findCachedMessage(currentRoom, data.messageId);
                if (message) {
                    if (!message.reactions) message.reactions = {};
                    if (message.reactions[data.username] === data.emoji) {
                        delete message.reactions[data.username];
                    } else {
                        message.reactions[data.username] = data.emoji;
                    }
                    broadcastToRoom(currentRoom, {
                        type: 'reactionAdded',
                        messageId: data.messageId,
                        reactions: message.reactions
                    });
                }
            } else if (data.type === 'pinMessage') {
                pinnedMessages[data.messageId] = {
                    content: data.content,
                    username: data.username
                };
                broadcastToRoom(currentRoom, {
                    type: 'pinMessage',
                    messageId: data.messageId,
                    content: data.content,
                    username: data.username
                });
            } else if (data.type === 'unpinMessage') {
                delete pinnedMessages[data.messageId];
                broadcastToRoom(currentRoom, {
                    type: 'unpinMessage',
                    messageId: data.messageId
                });
            } else if (data.type === 'callOffer') {
                const callId = Date.now().toString();
                broadcastToUser(data.toUser, {
                    type: 'callOffer',
                    from: username,
                    avatar,
                    callType: data.callType,
                    callId
                });
            } else if (data.type === 'callAnswer') {
                broadcastToUser(data.toUser, {
                    type: 'callAnswer',
                    from: username,
                    callId: data.callId
                });
            } else if (data.type === 'callReject') {
                broadcastToUser(data.toUser, {
                    type: 'callReject',
                    from: username,
                    callId: data.callId
                });
            } else if (data.type === 'callEnd') {
                broadcastToUser(data.toUser, {
                    type: 'callEnd',
                    from: username
                });
            } else if (data.type === 'locationMessage') {
                const messageData = saveGroupMessage({
                    type: 'locationMessage',
                    username,
                    avatar,
                    content: data.content || '[位置共享]',
                    latitude: data.latitude,
                    longitude: data.longitude,
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {},
                    replyTo: data.replyTo || null
                });

                broadcastToRoom(currentRoom, messageData);
            }
        } catch (e) {
            console.error('解析消息失败:', e);
        }
    });

    ws.on('close', () => {
        if (username) {
            if (PRESENCE_ROOMS[currentRoom]) {
                PRESENCE_ROOMS[currentRoom] = PRESENCE_ROOMS[currentRoom].filter(u => u !== username);
            }
            users.delete(ws);
            broadcastToRoom(currentRoom, {
                type: 'system',
                message: `${username} 离开了 ${currentRoom}`,
                users: getRoomUsers(currentRoom)
            });
        }
    });
});

function broadcastToAll(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToRoom(room, data) {
    wss.clients.forEach((client) => {
        const user = users.get(client);
        if (user && user.room === room && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToOthersInRoom(sender, room, data) {
    wss.clients.forEach((client) => {
        const user = users.get(client);
        if (user && user.room === room && client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToUser(targetUsername, data) {
    wss.clients.forEach((client) => {
        const user = users.get(client);
        if (user && user.username === targetUsername && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function getRoomUsers(room) {
    const roomUsers = [];
    users.forEach((user) => {
        if (user && user.room === room) {
            roomUsers.push({
                username: user.username || 'Guest',
                avatar: user.avatar || generateAvatar('Guest')
            });
        }
    });
    return roomUsers;
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    console.log(`本地访问: http://localhost:${PORT}`);
    console.log(`数据库: ${DB_FILE}`);
});
