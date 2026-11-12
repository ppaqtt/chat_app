const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const Database = require('better-sqlite3');
const bot = require('./bot');

const PORT = Number(process.env.PORT) || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'chat.db');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ========== 数据库初始化 ==========
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
CREATE TABLE IF NOT EXISTS rooms (
    name TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    avatar TEXT,
    created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'message',
    username TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    content TEXT DEFAULT '',
    to_user TEXT DEFAULT '',
    is_private INTEGER NOT NULL DEFAULT 0,
    is_bot INTEGER NOT NULL DEFAULT 0,
    payload TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    ts TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_room_seq ON messages(room, seq);
CREATE INDEX IF NOT EXISTS idx_messages_private ON messages(is_private, username, to_user);

CREATE TABLE IF NOT EXISTS pinned (
    room TEXT NOT NULL,
    message_id TEXT NOT NULL,
    content TEXT DEFAULT '',
    username TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    PRIMARY KEY (room, message_id)
);

CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    room TEXT NOT NULL,
    title TEXT NOT NULL,
    assignee TEXT DEFAULT '',
    due_at TEXT DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    completed_by TEXT DEFAULT '',
    completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_todos_room ON todos(room, done, due_at);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(content, tokenize='trigram');
`);

db.prepare('INSERT OR IGNORE INTO rooms(name, created_at) VALUES (?, ?)').run('大厅', Date.now());

const stmts = {
    insertMessage: db.prepare(`INSERT INTO messages
        (room, type, username, avatar, content, to_user, is_private, is_bot, payload, created_at, ts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
    insertFts: db.prepare('INSERT INTO messages_fts(rowid, content) VALUES (?, ?)'),
    deleteMessage: db.prepare('DELETE FROM messages WHERE seq = ?'),
    deleteFts: db.prepare('DELETE FROM messages_fts WHERE rowid = ?'),
    messageBySeq: db.prepare('SELECT * FROM messages WHERE seq = ?'),
    updatePayload: db.prepare('UPDATE messages SET payload = ? WHERE seq = ?'),
    messageHistory: db.prepare('SELECT * FROM messages WHERE room = ? AND is_private = 0 ORDER BY seq DESC LIMIT ?'),
    messageHistoryBefore: db.prepare('SELECT * FROM messages WHERE room = ? AND is_private = 0 AND seq < ? ORDER BY seq DESC LIMIT ?'),
    privateHistory: db.prepare('SELECT * FROM messages WHERE is_private = 1 AND (username = ? OR to_user = ?) ORDER BY seq DESC LIMIT ?'),
    allRoomMessages: db.prepare('SELECT * FROM messages WHERE room = ? AND is_private = 0 ORDER BY seq ASC'),
    upsertUser: db.prepare(`INSERT INTO users(username, avatar, created_at, last_seen) VALUES (?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET avatar = excluded.avatar, last_seen = excluded.last_seen`),
    getUser: db.prepare('SELECT * FROM users WHERE username = ?'),
    renameMessages: db.prepare('UPDATE messages SET username = ?, avatar = ? WHERE username = ?'),
    insertRoom: db.prepare('INSERT OR IGNORE INTO rooms(name, created_at) VALUES (?, ?)'),
    listRooms: db.prepare('SELECT name FROM rooms ORDER BY created_at ASC'),
    pinMessage: db.prepare(`INSERT INTO pinned(room, message_id, content, username, created_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(room, message_id) DO UPDATE SET content = excluded.content, username = excluded.username`),
    unpinMessage: db.prepare('DELETE FROM pinned WHERE room = ? AND message_id = ?'),
    pinnedByRoom: db.prepare('SELECT message_id, content, username FROM pinned WHERE room = ?'),
    deletePinned: db.prepare('DELETE FROM pinned WHERE message_id = ?'),
    insertTodo: db.prepare(`INSERT INTO todos(id, room, title, assignee, due_at, done, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)`),
    todosByRoom: db.prepare('SELECT * FROM todos WHERE room = ? ORDER BY done ASC, created_at ASC'),
    todoById: db.prepare('SELECT * FROM todos WHERE id = ?'),
    toggleTodo: db.prepare('UPDATE todos SET done = ?, completed_by = ?, completed_at = ? WHERE id = ?'),
    deleteTodo: db.prepare('DELETE FROM todos WHERE id = ?')
};

function formatTime(ts) {
    return new Date(ts || Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(ts) {
    return new Date(ts || Date.now()).toLocaleString('zh-CN', { hour12: false });
}

function rowToMessage(row) {
    let extra = {};
    try {
        extra = JSON.parse(row.payload || '{}');
    } catch (e) {
        extra = {};
    }
    const message = {
        id: String(row.seq),
        seq: row.seq,
        type: row.type,
        username: row.username,
        avatar: row.avatar || '',
        content: row.content || '',
        timestamp: row.ts,
        room: row.room,
        isPrivate: !!row.is_private
    };
    if (row.to_user) message.toUser = row.to_user;
    if (row.is_bot) message.isBot = true;
    return Object.assign(message, extra);
}

function saveMessage(fields) {
    const room = fields.room || '';
    const type = fields.type || 'message';
    const username = fields.username || 'Guest';
    const avatar = fields.avatar || '';
    const content = fields.content || '';
    const toUser = fields.toUser || '';
    const isPrivate = fields.isPrivate ? 1 : 0;
    const isBot = fields.isBot ? 1 : 0;
    const extra = fields.extra || {};
    const now = Date.now();
    const ts = formatTime(now);

    const info = stmts.insertMessage.run(room, type, username, avatar, content, toUser, isPrivate, isBot, JSON.stringify(extra), now, ts);
    const seq = Number(info.lastInsertRowid);
    if (content) {
        try {
            stmts.insertFts.run(seq, content);
        } catch (e) {
            console.error('FTS 索引失败:', e.message);
        }
    }

    const message = {
        id: String(seq),
        seq,
        type,
        username,
        avatar,
        content,
        timestamp: ts,
        room,
        isPrivate: !!isPrivate
    };
    if (isBot) message.isBot = true;
    if (toUser) message.toUser = toUser;
    return Object.assign(message, extra);
}

function getRoomHistory(room, beforeSeq, limit) {
    const fetchLimit = limit + 1;
    let rows;
    if (beforeSeq && Number(beforeSeq) > 0) {
        rows = stmts.messageHistoryBefore.all(room, Number(beforeSeq), fetchLimit);
    } else {
        rows = stmts.messageHistory.all(room, fetchLimit);
    }
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse().map(rowToMessage);
    return { messages: page, hasMore };
}

function getPinnedMap(room) {
    const map = {};
    stmts.pinnedByRoom.all(room).forEach((row) => {
        map[row.message_id] = { content: row.content, username: row.username };
    });
    return map;
}

function rowToTodo(row) {
    return {
        id: row.id,
        title: row.title,
        assignee: row.assignee || '',
        dueAt: row.due_at || '',
        done: !!row.done,
        createdBy: row.created_by,
        createdAt: row.created_at,
        completedBy: row.completed_by || '',
        completedAt: row.completed_at || null
    };
}

function getTodos(room) {
    return stmts.todosByRoom.all(room).map(rowToTodo);
}

function ensureRoom(room) {
    stmts.insertRoom.run(room, Date.now());
}

function getRoomNames() {
    return stmts.listRooms.all().map((row) => row.name);
}

// ========== 机器人 / Webhook ==========
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function postBotMessage(room, content) {
    ensureRoom(room);
    const message = saveMessage({
        room,
        type: 'message',
        username: bot.name,
        avatar: '#8B5CF6',
        content: escapeHtml(content),
        isBot: true
    });
    broadcastToRoom(room, message);
    return message;
}

function maybeBotReply(room, message) {
    if (!message || message.isBot || message.isPrivate || !message.content) return;
    const match = /^\s*@(bot|机器人|小助手)[\s,，:：]?([\s\S]*)$/i.exec(message.content);
    if (!match) return;

    const query = (match[2] || '').trim() || '帮助';
    const result = bot.answer(query);
    let reply;
    if (result) {
        reply = '【' + result.question + '】\n' + result.answer;
    } else {
        const samples = bot.sampleQuestions(3);
        reply = '暂时没有找到匹配的答案。可以试试这样问我：\n' + samples.map(function (q) { return '· ' + q; }).join('\n');
    }
    postBotMessage(room, reply);
}

function handleWebhook(room, payload) {
    ensureRoom(room);
    let title = '';
    let content = '';
    let level = '';
    let source = '';

    if (payload && typeof payload === 'object') {
        title = payload.title || payload.subject || '';
        content = payload.content || payload.message || payload.text || '';
        level = payload.level || payload.severity || '';
        source = payload.source || payload.service || '';
    } else if (typeof payload === 'string') {
        content = payload;
    }

    if (!content && title) {
        content = title;
        title = '';
    }
    if (!content) {
        content = '收到一条空告警';
    }

    const levelText = level ? '[' + String(level).toUpperCase() + '] ' : '';
    const sourceText = source ? '（来源：' + source + '）' : '';
    const text = (title ? '【' + title + '】\n' : '') + levelText + content + sourceText;

    return postBotMessage(room, text);
}

// ========== 导出 ==========
function messageExportText(message) {
    if (message.type === 'imageMessage') return '[图片] ' + (message.imageUrl || '');
    if (message.type === 'fileMessage' || message.type === 'privateFileMessage') {
        return '[文件] ' + (message.fileName || '') + (message.fileUrl ? ' ' + message.fileUrl : '');
    }
    if (message.type === 'locationMessage') {
        return '[位置] ' + (message.latitude || '') + ', ' + (message.longitude || '');
    }
    return message.content || '';
}

function buildMarkdownExport(room, messages, todos) {
    const lines = [];
    lines.push('# ' + room + ' 聊天记录');
    lines.push('');
    lines.push('- 导出时间：' + formatDateTime(Date.now()));
    lines.push('- 消息数量：' + messages.length);
    lines.push('');
    lines.push('---');
    lines.push('');
    messages.forEach(function (m) {
        const who = m.isBot ? m.username + '（机器人）' : m.username;
        lines.push('**' + who + '** · ' + formatDateTime(m.created_at) + (m.isPrivate ? ' · 私聊' : ''));
        lines.push('');
        lines.push(messageExportText(m));
        lines.push('');
    });
    if (todos.length) {
        lines.push('---');
        lines.push('');
        lines.push('## 房间待办');
        lines.push('');
        todos.forEach(function (t) {
            lines.push('- [' + (t.done ? 'x' : ' ') + '] ' + t.title +
                (t.assignee ? ' — 负责人：' + t.assignee : '') +
                (t.dueAt ? ' — 截止：' + t.dueAt.replace('T', ' ') : ''));
        });
        lines.push('');
    }
    return lines.join('\n');
}

function buildHtmlExport(room, messages, todos) {
    const esc = escapeHtml;
    const rows = messages.map(function (m) {
        const who = esc(m.isBot ? m.username + ' 🤖' : m.username);
        const body = esc(messageExportText(m)).replace(/\n/g, '<br>');
        const badge = m.isPrivate ? '<span class="badge">私聊</span>' : '';
        return '<div class="msg">' +
            '<div class="meta"><strong>' + who + '</strong> ' + badge +
            '<span class="time">' + esc(formatDateTime(m.created_at)) + '</span></div>' +
            '<div class="body">' + body + '</div></div>';
    }).join('\n');

    const todoHtml = todos.length ? (
        '<h2>房间待办</h2><ul class="todos">' + todos.map(function (t) {
            return '<li class="' + (t.done ? 'done' : '') + '">' +
                (t.done ? '✅' : '⬜') + ' ' + esc(t.title) +
                (t.assignee ? ' <em>@' + esc(t.assignee) + '</em>' : '') +
                (t.dueAt ? ' <small>截止 ' + esc(t.dueAt.replace('T', ' ')) + '</small>' : '') +
                '</li>';
        }).join('') + '</ul>'
    ) : '';

    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>' + esc(room) + ' 聊天归档</title><style>' +
        'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;' +
        'max-width:860px;margin:0 auto;padding:32px 20px;background:#f7f7fb;color:#1f2333;line-height:1.6}' +
        'h1{font-size:26px;margin:0 0 6px}.info{color:#6b7280;font-size:13px;margin-bottom:24px}' +
        '.msg{background:#fff;border:1px solid #e8e8f0;border-radius:10px;padding:12px 16px;margin-bottom:10px}' +
        '.meta{font-size:13px;color:#4b5563;margin-bottom:6px}.time{color:#9ca3af;font-size:12px;margin-left:8px}' +
        '.badge{background:#eef2ff;color:#4f46e5;font-size:11px;border-radius:4px;padding:1px 6px;margin-left:6px}' +
        '.body{white-space:normal;word-break:break-word;font-size:14px}' +
        'h2{font-size:18px;margin-top:32px}.todos{padding-left:18px}.todos li{margin:6px 0}' +
        '.todos li.done{color:#9ca3af;text-decoration:line-through}' +
        '</style></head><body><h1>' + esc(room) + ' 聊天归档</h1>' +
        '<div class="info">导出时间：' + esc(formatDateTime(Date.now())) + ' · 消息 ' + messages.length + ' 条</div>' +
        rows + todoHtml + '</body></html>';
}

// ========== HTTP 服务器 ==========
function sendJson(res, status, obj) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
}

function readBody(req, limit) {
    return new Promise(function (resolve, reject) {
        const chunks = [];
        let size = 0;
        req.on('data', function (chunk) {
            size += chunk.length;
            if (size > limit) {
                reject(new Error('请求体过大'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', function () {
            resolve(Buffer.concat(chunks));
        });
        req.on('error', reject);
    });
}

async function handleApi(req, res, pathname, query) {
    // 文件上传（沿用原有简单 multipart 解析）
    if (pathname === '/api/upload' && req.method === 'POST') {
        const buffer = await readBody(req, 200 * 1024 * 1024);
        const boundary = req.headers['content-type'] ? req.headers['content-type'].split('boundary=')[1] : null;
        if (boundary) {
            const parts = buffer.toString('binary').split('--' + boundary);
            for (const part of parts) {
                if (part.includes('filename=')) {
                    const filename = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.jpg';
                    const contentMatch = part.split('\r\n\r\n');
                    if (contentMatch && contentMatch[1]) {
                        const content = Buffer.from(contentMatch[1], 'binary');
                        fs.writeFileSync(path.join(UPLOAD_DIR, filename), content);
                        sendJson(res, 200, { url: '/uploads/' + filename });
                        return true;
                    }
                }
            }
        }
        sendJson(res, 400, { error: '上传失败' });
        return true;
    }

    // 机器人状态
    if (pathname === '/api/bot/status' && req.method === 'GET') {
        sendJson(res, 200, { name: bot.name, faqCount: bot.faqCount, faqFiles: bot.faqFiles });
        return true;
    }

    // Webhook 告警接入
    if (pathname.startsWith('/api/webhook/') && req.method === 'POST') {
        const expectedToken = process.env.WEBHOOK_TOKEN || '';
        if (expectedToken) {
            const provided = req.headers['x-webhook-token'] || query.get('token') || '';
            if (provided !== expectedToken) {
                sendJson(res, 401, { error: 'invalid webhook token' });
                return true;
            }
        }
        const room = decodeURIComponent(pathname.slice('/api/webhook/'.length)) || '大厅';
        const raw = await readBody(req, 1024 * 1024);
        let payload;
        try {
            payload = JSON.parse(raw.toString('utf8'));
        } catch (e) {
            payload = raw.toString('utf8');
        }
        const message = handleWebhook(room, payload);
        sendJson(res, 200, { ok: true, room: room, messageId: message.id });
        return true;
    }

    // 历史消息分页（HTTP 版本，便于外部集成）
    const historyMatch = pathname.match(/^\/api\/rooms\/(.+)\/messages$/);
    if (historyMatch && req.method === 'GET') {
        const room = decodeURIComponent(historyMatch[1]);
        const before = Number(query.get('before')) || 0;
        const limit = Math.min(Math.max(Number(query.get('limit')) || 30, 1), 100);
        const result = getRoomHistory(room, before, limit);
        sendJson(res, 200, result);
        return true;
    }

    // 服务端导出
    const exportMatch = pathname.match(/^\/api\/rooms\/(.+)\/export$/);
    if (exportMatch && req.method === 'GET') {
        const room = decodeURIComponent(exportMatch[1]);
        const format = (query.get('format') || 'html').toLowerCase();
        const rows = stmts.allRoomMessages.all(room);
        const todos = getTodos(room);
        const filename = room + '-归档-' + new Date().toISOString().slice(0, 10);
        if (format === 'md' || format === 'markdown') {
            const body = buildMarkdownExport(room, rows, todos);
            res.writeHead(200, {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(filename + '.md')
            });
            res.end(body);
        } else {
            const body = buildHtmlExport(room, rows, todos);
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(filename + '.html')
            });
            res.end(body);
        }
        return true;
    }

    // 全文搜索（FTS5）
    if (pathname === '/api/search' && req.method === 'GET') {
        const q = (query.get('q') || '').trim();
        const room = query.get('room') || '';
        const limit = Math.min(Math.max(Number(query.get('limit')) || 30, 1), 100);
        if (!q) {
            sendJson(res, 200, { results: [] });
            return true;
        }
        let rows;
        try {
            if (q.length >= 3) {
                const match = '"' + q.replace(/"/g, '""') + '"';
                if (room) {
                    rows = db.prepare(`SELECT m.* FROM messages_fts f JOIN messages m ON m.seq = f.rowid
                        WHERE messages_fts MATCH ? AND m.room = ? AND m.is_private = 0
                        ORDER BY m.seq DESC LIMIT ?`).all(match, room, limit);
                } else {
                    rows = db.prepare(`SELECT m.* FROM messages_fts f JOIN messages m ON m.seq = f.rowid
                        WHERE messages_fts MATCH ? AND m.is_private = 0
                        ORDER BY m.seq DESC LIMIT ?`).all(match, limit);
                }
            } else {
                const like = '%' + q + '%';
                if (room) {
                    rows = db.prepare(`SELECT * FROM messages WHERE is_private = 0 AND room = ? AND content LIKE ?
                        ORDER BY seq DESC LIMIT ?`).all(room, like, limit);
                } else {
                    rows = db.prepare(`SELECT * FROM messages WHERE is_private = 0 AND content LIKE ?
                        ORDER BY seq DESC LIMIT ?`).all(like, limit);
                }
            }
        } catch (e) {
            console.error('搜索失败:', e.message);
            sendJson(res, 500, { error: '搜索失败' });
            return true;
        }
        sendJson(res, 200, {
            results: rows.map(function (row) {
                const m = rowToMessage(row);
                return {
                    id: m.id,
                    seq: m.seq,
                    room: m.room,
                    username: m.username,
                    timestamp: m.timestamp,
                    created_at: row.created_at,
                    content: messageExportText(Object.assign({}, m, row)) || '',
                    type: m.type,
                    isBot: !!m.isBot
                };
            })
        });
        return true;
    }

    return false;
}

const server = http.createServer(function (req, res) {
    const parsed = new URL(req.url, 'http://localhost');
    const pathname = parsed.pathname;

    if (pathname.startsWith('/api/')) {
        handleApi(req, res, pathname, parsed.searchParams).catch(function (err) {
            console.error('API 错误:', err);
            if (!res.headersSent) sendJson(res, 500, { error: '服务器错误' });
        });
        return;
    }

    if (pathname.startsWith('/uploads/')) {
        const safeName = path.basename(decodeURIComponent(pathname));
        const filePath = path.join(UPLOAD_DIR, safeName);
        fs.readFile(filePath, function (err, data) {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const types = {
                '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
            res.end(data);
        });
        return;
    }

    let filePath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
    const resolved = path.normalize(path.join(__dirname, filePath));
    if (!resolved.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = String(path.extname(resolved)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(resolved, function (error, content) {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

// ========== WebSocket ==========
const wss = new WebSocket.Server({ server });

let users = new Map();

function generateAvatar(username) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#00CED1'
    ];
    return colors[(username && username.charCodeAt ? username.charCodeAt(0) : 0) % colors.length];
}

function broadcastToAll(data) {
    wss.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToRoom(room, data) {
    wss.clients.forEach(function (client) {
        const user = users.get(client);
        if (user && user.room === room && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToOthersInRoom(sender, room, data) {
    wss.clients.forEach(function (client) {
        const user = users.get(client);
        if (user && user.room === room && client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function broadcastToUser(targetUsername, data) {
    wss.clients.forEach(function (client) {
        const user = users.get(client);
        if (user && user.username === targetUsername && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function getRoomUsers(room) {
    const seen = new Set();
    const roomUsers = [];
    users.forEach(function (user) {
        if (user && user.room === room && !seen.has(user.username)) {
            seen.add(user.username);
            roomUsers.push({
                username: user.username || 'Guest',
                avatar: user.avatar || generateAvatar('Guest')
            });
        }
    });
    return roomUsers;
}

function updateMessagePayload(seq, mutate) {
    const row = stmts.messageBySeq.get(seq);
    if (!row) return null;
    let extra = {};
    try {
        extra = JSON.parse(row.payload || '{}');
    } catch (e) {
        extra = {};
    }
    mutate(extra);
    stmts.updatePayload.run(JSON.stringify(extra), seq);
    return rowToMessage(Object.assign({}, row, { payload: JSON.stringify(extra) }));
}

const USERNAME_RE = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

wss.on('connection', function (ws) {
    let username = '';
    let avatar = '';
    let currentRoom = '大厅';

    ws.on('message', function (message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('解析消息失败:', e);
            return;
        }

        try {
            if (data.type === 'login') {
                const requested = String(data.username || '').trim();
                if (requested.length < 2 || requested.length > 20 || !USERNAME_RE.test(requested)) {
                    ws.send(JSON.stringify({ type: 'loginFailed', message: '昵称不合法（2-20 位中文、英文、数字或下划线）' }));
                    return;
                }
                username = requested;
                currentRoom = data.room || '大厅';
                ensureRoom(currentRoom);

                const existing = stmts.getUser.get(username);
                avatar = data.avatar || (existing && existing.avatar) || generateAvatar(username);
                stmts.upsertUser.run(username, avatar, existing ? existing.created_at : Date.now(), Date.now());

                users.set(ws, { username: username, avatar: avatar, room: currentRoom });

                const history = getRoomHistory(currentRoom, null, 50);
                const privateRows = stmts.privateHistory.all(username, username, 100).reverse();
                const privateMessages = privateRows.map(rowToMessage);
                const merged = history.messages.concat(privateMessages)
                    .sort(function (a, b) { return a.seq - b.seq; });

                broadcastToRoom(currentRoom, {
                    type: 'system',
                    message: username + ' 加入了 ' + currentRoom,
                    users: getRoomUsers(currentRoom)
                });

                ws.send(JSON.stringify({
                    type: 'loginSuccess',
                    username: username,
                    avatar: avatar,
                    room: currentRoom,
                    rooms: getRoomNames(),
                    messages: merged,
                    hasMore: history.hasMore,
                    pinnedMessages: getPinnedMap(currentRoom),
                    todos: getTodos(currentRoom),
                    botName: bot.name
                }));

            } else if (data.type === 'loadHistory') {
                const room = data.room || currentRoom;
                const before = Number(data.before) || 0;
                const limit = Math.min(Math.max(Number(data.limit) || 30, 1), 100);
                if (room !== currentRoom) return;
                const history = getRoomHistory(room, before, limit);
                ws.send(JSON.stringify({
                    type: 'history',
                    room: room,
                    messages: history.messages,
                    hasMore: history.hasMore
                }));

            } else if (data.type === 'message') {
                const messageData = saveMessage({
                    room: currentRoom,
                    type: 'message',
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    extra: { reads: {}, reactions: {} }
                });
                broadcastToRoom(currentRoom, messageData);
                maybeBotReply(currentRoom, messageData);

            } else if (data.type === 'imageMessage') {
                const messageData = saveMessage({
                    room: currentRoom,
                    type: 'imageMessage',
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    extra: { imageUrl: data.imageUrl, reads: {}, reactions: {} }
                });
                broadcastToRoom(currentRoom, messageData);

            } else if (data.type === 'fileMessage') {
                const messageData = saveMessage({
                    room: currentRoom,
                    type: 'fileMessage',
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    extra: {
                        fileUrl: data.fileUrl,
                        fileName: data.fileName,
                        fileSize: data.fileSize,
                        reads: {},
                        reactions: {}
                    }
                });
                broadcastToRoom(currentRoom, messageData);

            } else if (data.type === 'privateFileMessage') {
                const messageData = saveMessage({
                    room: currentRoom,
                    type: 'privateFileMessage',
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    toUser: data.toUser,
                    isPrivate: true,
                    extra: {
                        fileUrl: data.fileUrl,
                        fileName: data.fileName,
                        fileSize: data.fileSize
                    }
                });
                broadcastToUser(data.toUser, messageData);
                ws.send(JSON.stringify(messageData));

            } else if (data.type === 'privateMessage') {
                const messageData = saveMessage({
                    room: currentRoom,
                    type: 'privateMessage',
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    toUser: data.toUser,
                    isPrivate: true
                });
                broadcastToUser(data.toUser, messageData);
                ws.send(JSON.stringify(messageData));

            } else if (data.type === 'recall') {
                const seq = Number(data.messageId);
                const row = stmts.messageBySeq.get(seq);
                if (row && row.username === username && row.room === currentRoom && !row.is_private) {
                    stmts.deleteMessage.run(seq);
                    try {
                        stmts.deleteFts.run(seq);
                    } catch (e) {
                        console.error('FTS 删除失败:', e.message);
                    }
                    stmts.deletePinned.run(String(seq));
                    broadcastToRoom(currentRoom, {
                        type: 'messageRecalled',
                        messageId: String(seq),
                        username: username
                    });
                }

            } else if (data.type === 'readMessage') {
                const seq = Number(data.messageId);
                const row = stmts.messageBySeq.get(seq);
                if (row && row.username !== username && row.room === currentRoom) {
                    updateMessagePayload(seq, function (extra) {
                        extra.reads = extra.reads || {};
                        extra.reads[username] = true;
                    });
                    broadcastToRoom(currentRoom, {
                        type: 'messageRead',
                        messageId: String(seq),
                        reader: username
                    });
                }

            } else if (data.type === 'createRoom') {
                const roomName = String(data.roomName || '').trim();
                if (roomName && roomName.length <= 30) {
                    ensureRoom(roomName);
                    broadcastToAll({ type: 'roomCreated', room: roomName });
                }

            } else if (data.type === 'joinRoom') {
                const oldRoom = currentRoom;
                const newRoom = data.room || '大厅';
                ensureRoom(newRoom);

                currentRoom = newRoom;
                const userData = users.get(ws);
                if (userData) userData.room = currentRoom;

                broadcastToRoom(oldRoom, {
                    type: 'system',
                    message: username + ' 离开了 ' + oldRoom,
                    users: getRoomUsers(oldRoom)
                });
                broadcastToRoom(newRoom, {
                    type: 'system',
                    message: username + ' 加入了 ' + newRoom,
                    users: getRoomUsers(newRoom)
                });

                const history = getRoomHistory(newRoom, null, 50);
                ws.send(JSON.stringify({
                    type: 'joinedRoom',
                    room: newRoom,
                    messages: history.messages,
                    hasMore: history.hasMore,
                    users: getRoomUsers(newRoom),
                    pinnedMessages: getPinnedMap(newRoom),
                    todos: getTodos(newRoom)
                }));

            } else if (data.type === 'typing') {
                broadcastToOthersInRoom(ws, currentRoom, { type: 'typing', username: username });
            } else if (data.type === 'stopTyping') {
                broadcastToOthersInRoom(ws, currentRoom, { type: 'stopTyping', username: username });

            } else if (data.type === 'updateProfile') {
                const newUsername = String(data.newUsername || '').trim();
                const newAvatar = data.newAvatar;
                const oldUsername = username;

                if (newUsername && (newUsername.length < 2 || newUsername.length > 20 || !USERNAME_RE.test(newUsername))) {
                    ws.send(JSON.stringify({ type: 'profileUpdated', username: username, avatar: avatar }));
                    return;
                }
                if (newUsername) username = newUsername;
                if (newAvatar) avatar = newAvatar;

                const userData = users.get(ws);
                if (userData) {
                    userData.username = username;
                    userData.avatar = avatar;
                }

                if (username !== oldUsername) {
                    const existing = stmts.getUser.get(username);
                    stmts.upsertUser.run(username, avatar, Date.now(), Date.now());
                    stmts.renameMessages.run(username, avatar, oldUsername);
                    if (existing) {
                        // 保留旧昵称记录的最近在线时间即可，不额外处理
                    }
                    broadcastToRoom(currentRoom, {
                        type: 'system',
                        message: oldUsername + ' 修改了昵称为 ' + username,
                        users: getRoomUsers(currentRoom)
                    });
                }

                ws.send(JSON.stringify({ type: 'profileUpdated', username: username, avatar: avatar }));

            } else if (data.type === 'addReaction') {
                const seq = Number(data.messageId);
                const row = stmts.messageBySeq.get(seq);
                if (row && row.room === currentRoom) {
                    const updated = updateMessagePayload(seq, function (extra) {
                        extra.reactions = extra.reactions || {};
                        if (extra.reactions[data.username] === data.emoji) {
                            delete extra.reactions[data.username];
                        } else {
                            extra.reactions[data.username] = data.emoji;
                        }
                    });
                    if (updated) {
                        broadcastToRoom(currentRoom, {
                            type: 'reactionAdded',
                            messageId: String(seq),
                            reactions: updated.reactions || {}
                        });
                    }
                }

            } else if (data.type === 'pinMessage') {
                const messageId = String(data.messageId);
                stmts.pinMessage.run(currentRoom, messageId, data.content || '', data.username || username, Date.now());
                broadcastToRoom(currentRoom, {
                    type: 'pinMessage',
                    messageId: messageId,
                    content: data.content,
                    username: data.username
                });

            } else if (data.type === 'unpinMessage') {
                const messageId = String(data.messageId);
                stmts.unpinMessage.run(currentRoom, messageId);
                broadcastToRoom(currentRoom, { type: 'unpinMessage', messageId: messageId });

            } else if (data.type === 'createTodo') {
                const title = String(data.title || '').trim().slice(0, 200);
                if (!title) return;
                const id = 't_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
                stmts.insertTodo.run(id, currentRoom, title, String(data.assignee || '').slice(0, 20), String(data.dueAt || '').slice(0, 30), username, Date.now());
                broadcastToRoom(currentRoom, { type: 'todos', todos: getTodos(currentRoom) });

            } else if (data.type === 'toggleTodo') {
                const row = stmts.todoById.get(String(data.id));
                if (row && row.room === currentRoom) {
                    const done = row.done ? 0 : 1;
                    stmts.toggleTodo.run(done, done ? username : '', done ? Date.now() : null, row.id);
                    broadcastToRoom(currentRoom, { type: 'todos', todos: getTodos(currentRoom) });
                }

            } else if (data.type === 'deleteTodo') {
                const row = stmts.todoById.get(String(data.id));
                if (row && row.room === currentRoom && row.created_by === username) {
                    stmts.deleteTodo.run(row.id);
                    broadcastToRoom(currentRoom, { type: 'todos', todos: getTodos(currentRoom) });
                }

            } else if (data.type === 'callOffer') {
                broadcastToUser(data.toUser, {
                    type: 'callOffer',
                    from: username,
                    avatar: avatar,
                    callType: data.callType,
                    callId: Date.now().toString()
                });
            } else if (data.type === 'callAnswer') {
                broadcastToUser(data.toUser, { type: 'callAnswer', from: username, callId: data.callId });
            } else if (data.type === 'callReject') {
                broadcastToUser(data.toUser, { type: 'callReject', from: username, callId: data.callId });
            } else if (data.type === 'callEnd') {
                broadcastToUser(data.toUser, { type: 'callEnd', from: username });

            } else if (data.type === 'webrtcOffer' || data.type === 'webrtcAnswer' || data.type === 'webrtcIceCandidate') {
                broadcastToUser(data.toUser, Object.assign({}, data, { from: username }));

            } else if (data.type === 'locationMessage') {
                const messageData = saveMessage({
                    room: currentRoom,
                    type: 'locationMessage',
                    username: username,
                    avatar: avatar,
                    content: data.content || '[位置共享]',
                    extra: {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        reads: {},
                        reactions: {}
                    }
                });
                broadcastToRoom(currentRoom, messageData);
            }
        } catch (e) {
            console.error('处理消息失败:', e);
        }
    });

    ws.on('close', function () {
        if (username) {
            users.delete(ws);
            stmts.upsertUser.run(username, avatar, Date.now(), Date.now());
            broadcastToRoom(currentRoom, {
                type: 'system',
                message: username + ' 离开了 ' + currentRoom,
                users: getRoomUsers(currentRoom)
            });
        }
    });
});

server.listen(PORT, '0.0.0.0', function () {
    console.log('服务器运行在 http://0.0.0.0:' + PORT);
    console.log('本地访问: http://localhost:' + PORT);
    console.log('数据库: ' + DB_PATH);
    console.log('机器人: ' + bot.name + '（FAQ ' + bot.faqCount + ' 条）');
    if (bot.faqFiles.length) {
        console.log('FAQ 来源: ' + bot.faqFiles.join(', '));
    }
    console.log('Webhook: POST /api/webhook/<房间名>');
});
