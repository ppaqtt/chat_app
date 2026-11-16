
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const Database = require('better-sqlite3');

const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = process.env.CHAT_DB || path.join(__dirname, 'chat.db');

const MAX_MESSAGES = 200;          // 每个房间内存中保留的消息数
const HISTORY_LIMIT = 50;          // 登录/切换房间时下发的历史消息数
const SYNC_LIMIT = 500;            // 单次离线补发的上限
const RETENTION_DAYS = 7;          // 服务端消息保留天数

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.zip': 'application/zip'
};

const CONTENT_TYPE_EXT = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
    'text/plain': '.txt'
};

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ========== 数据库 ==========
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
        name TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT NOT NULL,
        room_seq INTEGER NOT NULL,
        id TEXT NOT NULL,
        type TEXT NOT NULL,
        username TEXT,
        avatar TEXT,
        content TEXT,
        timestamp TEXT,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_room_seq ON messages(room, room_seq);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

    CREATE TABLE IF NOT EXISTS room_sequences (
        room TEXT PRIMARY KEY,
        seq INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pinned_messages (
        message_id TEXT PRIMARY KEY,
        room TEXT NOT NULL,
        content TEXT,
        username TEXT,
        created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        room TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        time TEXT,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_announcements_room ON announcements(room, created_at);

    CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        room TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_votes_room ON votes(room, created_at);
`);

db.prepare('INSERT OR IGNORE INTO rooms (name, created_at) VALUES (?, ?)').run('大厅', Date.now());

function pruneOldData() {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    db.prepare('DELETE FROM messages WHERE created_at < ?').run(cutoff);
    db.prepare('DELETE FROM pinned_messages WHERE message_id NOT IN (SELECT id FROM messages)').run();
}

pruneOldData();
const pruneTimer = setInterval(pruneOldData, 60 * 60 * 1000);
if (pruneTimer.unref) pruneTimer.unref();

// ========== 内存状态 ==========
let users = new Map();
let rooms = {};
let messages = {};

db.prepare('SELECT name FROM rooms ORDER BY created_at ASC').all().forEach(row => {
    rooms[row.name] = [];
});

function ensureRoom(room) {
    if (!rooms[room]) {
        rooms[room] = [];
        db.prepare('INSERT OR IGNORE INTO rooms (name, created_at) VALUES (?, ?)').run(room, Date.now());
    }
    return rooms[room];
}

function getRoomMessages(room) {
    if (!messages[room]) {
        const rows = db.prepare('SELECT payload FROM messages WHERE room = ? ORDER BY room_seq DESC LIMIT ?').all(room, MAX_MESSAGES);
        messages[room] = rows.reverse().map(row => {
            try {
                return JSON.parse(row.payload);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
    }
    return messages[room];
}

const maxRoomSeqStmt = db.prepare('SELECT COALESCE(MAX(room_seq), 0) AS seq FROM messages WHERE room = ?');
const getRoomSeqStmt = db.prepare('SELECT seq FROM room_sequences WHERE room = ?');
const saveRoomSeqStmt = db.prepare(`
    INSERT INTO room_sequences (room, seq) VALUES (?, ?)
    ON CONFLICT(room) DO UPDATE SET seq = excluded.seq
`);
const insertMessageStmt = db.prepare(`
    INSERT INTO messages (room, room_seq, id, type, username, avatar, content, timestamp, payload, created_at)
    VALUES (@room, @room_seq, @id, @type, @username, @avatar, @content, @timestamp, @payload, @created_at)
`);
const roomSeqCounters = new Map();

function nextRoomSeq(room) {
    let counter = roomSeqCounters.get(room);
    if (typeof counter !== 'number') {
        const saved = getRoomSeqStmt.get(room);
        counter = saved ? saved.seq : maxRoomSeqStmt.get(room).seq;
    }
    const next = counter + 1;
    roomSeqCounters.set(room, next);
    saveRoomSeqStmt.run(room, next);
    return next;
}

function storeRoomMessage(room, messageData) {
    const roomMessages = getRoomMessages(room);
    const roomSeq = nextRoomSeq(room);
    const message = Object.assign({}, messageData, { room, roomSeq });

    insertMessageStmt.run({
        room,
        room_seq: roomSeq,
        id: message.id,
        type: message.type,
        username: message.username || '',
        avatar: message.avatar || '',
        content: message.content || '',
        timestamp: message.timestamp || '',
        payload: JSON.stringify(message),
        created_at: Date.now()
    });

    roomMessages.push(message);
    if (roomMessages.length > MAX_MESSAGES) {
        roomMessages.splice(0, roomMessages.length - MAX_MESSAGES);
    }
    return message;
}

function getPinnedMessages(room) {
    const result = {};
    db.prepare('SELECT message_id, content, username FROM pinned_messages WHERE room = ? ORDER BY created_at ASC').all(room)
        .forEach(row => {
            result[row.message_id] = { content: row.content, username: row.username };
        });
    return result;
}

function getAnnouncements(room) {
    return db.prepare('SELECT id, content, author, time FROM announcements WHERE room = ? ORDER BY created_at ASC').all(room);
}

function getVotes(room) {
    return db.prepare('SELECT payload FROM votes WHERE room = ? ORDER BY created_at ASC').all(room)
        .map(row => {
            try {
                return JSON.parse(row.payload);
            } catch (e) {
                return null;
            }
        })
        .filter(Boolean);
}

function getVote(room, voteId) {
    const row = db.prepare('SELECT payload FROM votes WHERE room = ? AND id = ?').get(room, voteId);
    if (!row) return null;
    try {
        return JSON.parse(row.payload);
    } catch (e) {
        return null;
    }
}

function sendMissingMessages(ws, room, lastSeq) {
    if (typeof lastSeq !== 'number' || !Number.isFinite(lastSeq)) return;

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
        SELECT payload FROM messages
        WHERE room = ? AND room_seq > ? AND created_at >= ?
        ORDER BY room_seq ASC LIMIT ?
    `).all(room, lastSeq, cutoff, SYNC_LIMIT);

    const missing = rows.map(row => {
        try {
            return JSON.parse(row.payload);
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    if (missing.length > 0) {
        ws.send(JSON.stringify({
            type: 'syncMessages',
            room,
            messages: missing,
            truncated: missing.length >= SYNC_LIMIT
        }));
    }
}

// ========== HTTP ==========
function getUploadExtension(filename, contentType) {
    const ext = path.extname(filename || '').toLowerCase();
    if (ext && /^\.[a-z0-9]{1,5}$/.test(ext)) return ext;

    const mime = String(contentType || '').split(';')[0].trim().toLowerCase();
    return CONTENT_TYPE_EXT[mime] || '.bin';
}

const server = http.createServer((req, res) => {
    if (req.url === '/api/upload' && req.method === 'POST') {
        let data = [];
        req.on('data', chunk => {
            data.push(chunk);
        });
        req.on('end', () => {
            const buffer = Buffer.concat(data);
            const boundary = req.headers['content-type']?.split('boundary=')[1];

            if (boundary) {
                const parts = buffer.toString('binary').split('--' + boundary);

                for (let part of parts) {
                    if (part.includes('filename=')) {
                        const headerEnd = part.indexOf('\r\n\r\n');
                        if (headerEnd === -1) continue;

                        const header = part.slice(0, headerEnd);
                        const filenameMatch = header.match(/filename="([^"]*)"/i);
                        const typeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
                        const ext = getUploadExtension(filenameMatch ? filenameMatch[1] : '', typeMatch ? typeMatch[1] : '');
                        const filename = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + ext;

                        let body = part.slice(headerEnd + 4);
                        if (body.endsWith('\r\n')) {
                            body = body.slice(0, -2);
                        }
                        const content = Buffer.from(body, 'binary');
                        fs.writeFileSync(path.join(UPLOAD_DIR, filename), content);

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ url: '/uploads/' + filename }));
                        return;
                    }
                }
            }

            res.writeHead(400);
            res.end('Upload failed');
        });
        return;
    }

    if (req.url.startsWith('/uploads/')) {
        const fileName = path.basename(decodeURIComponent(req.url.split('?')[0]));
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
                res.end(data);
            }
        });
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('&lt;h1&gt;404 Not Found&lt;/h1&gt;', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const wss = new WebSocket.Server({ server });

function generateAvatar(username) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#00CED1'
    ];
    return colors[(username && username.charCodeAt ? username.charCodeAt(0) : 0) % colors.length];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DM_PREFIX = '__dm__:';

function directMessageRoom(userA, userB) {
    return DM_PREFIX + [String(userA || ''), String(userB || '')].sort().join('|');
}

function storeDirectMessage(messageData) {
    return storeRoomMessage(directMessageRoom(messageData.username, messageData.toUser), messageData);
}

function getPrivateHistory(username) {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
        SELECT payload FROM messages
        WHERE room LIKE '__dm__:%' AND created_at >= ?
        ORDER BY seq DESC LIMIT 300
    `).all(cutoff);

    const history = [];
    rows.forEach(row => {
        try {
            const message = JSON.parse(row.payload);
            const participants = String(message.room || '').slice(DM_PREFIX.length).split('|');
            if (participants.includes(username)) {
                history.push(message);
            }
        } catch (e) {
            // 忽略损坏的历史数据
        }
    });
    return history.reverse();
}

function shortTime() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function fullTime() {
    return new Date().toLocaleString('zh-CN', { hour12: false });
}

function appendRoomMessage(room, type, author, data, extra) {
    const messageData = Object.assign({
        type,
        id: generateId(),
        username: author.username,
        avatar: author.avatar,
        content: data.content || '',
        timestamp: shortTime(),
        isPrivate: false,
        reads: {},
        reactions: {}
    }, data.replyTo ? { replyTo: data.replyTo } : {}, extra || {});

    broadcastToRoom(room, storeRoomMessage(room, messageData));
}

wss.on('connection', (ws) => {
    let username = '';
    let avatar = '';
    let currentRoom = '大厅';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'login') {
                username = String(data.username || 'Guest').slice(0, 20);
                avatar = data.avatar || generateAvatar(username);
                currentRoom = data.room || '大厅';
                ensureRoom(currentRoom);

                users.set(ws, { username, avatar, room: currentRoom });
                rooms[currentRoom].push(username);

                const userList = getRoomUsers(currentRoom);
                const roomMessages = getRoomMessages(currentRoom).slice(-HISTORY_LIMIT);

                broadcastToRoom(currentRoom, {
                    type: 'system',
                    message: `${username} 加入了 ${currentRoom}`,
                    users: userList
                });

                ws.send(JSON.stringify({
                    type: 'loginSuccess',
                    username: username,
                    avatar: avatar,
                    room: currentRoom,
                    rooms: Object.keys(rooms),
                    messages: roomMessages,
                    pinnedMessages: getPinnedMessages(currentRoom),
                    announcements: getAnnouncements(currentRoom),
                    votes: getVotes(currentRoom),
                    privateHistory: getPrivateHistory(username)
                }));

                // 断线重连：补发客户端缺失的区间
                sendMissingMessages(ws, currentRoom, data.lastSeq);

            } else if (data.type === 'syncMessages') {
                const room = data.room || currentRoom;
                sendMissingMessages(ws, room, data.lastSeq);

            } else if (data.type === 'message') {
                appendRoomMessage(currentRoom, 'message', { username, avatar }, data);

            } else if (data.type === 'imageMessage') {
                appendRoomMessage(currentRoom, 'imageMessage', { username, avatar }, data, {
                    imageUrl: data.imageUrl
                });

            } else if (data.type === 'fileMessage') {
                appendRoomMessage(currentRoom, 'fileMessage', { username, avatar }, data, {
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize
                });

            } else if (data.type === 'voiceMessage') {
                appendRoomMessage(currentRoom, 'voiceMessage', { username, avatar }, data, {
                    voiceUrl: data.voiceUrl,
                    duration: Number(data.duration) || 0
                });

            } else if (data.type === 'locationMessage') {
                appendRoomMessage(currentRoom, 'locationMessage', { username, avatar }, data, {
                    latitude: data.latitude,
                    longitude: data.longitude
                });

            } else if (data.type === 'privateFileMessage' || data.type === 'privateVoiceMessage') {
                if (!data.toUser) return;

                const messageData = {
                    type: data.type,
                    id: generateId(),
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    timestamp: shortTime(),
                    toUser: data.toUser,
                    isPrivate: true
                };
                if (data.type === 'privateFileMessage') {
                    messageData.fileUrl = data.fileUrl;
                    messageData.fileName = data.fileName;
                    messageData.fileSize = data.fileSize;
                } else {
                    messageData.voiceUrl = data.voiceUrl;
                    messageData.duration = Number(data.duration) || 0;
                }
                if (data.replyTo) messageData.replyTo = data.replyTo;

                const saved = storeDirectMessage(messageData);
                broadcastToUser(data.toUser, saved);
                ws.send(JSON.stringify(saved));

            } else if (data.type === 'privateMessage') {
                if (!data.toUser) return;

                const messageData = {
                    type: 'privateMessage',
                    id: generateId(),
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    timestamp: shortTime(),
                    toUser: data.toUser,
                    isPrivate: true
                };

                if (data.replyTo) messageData.replyTo = data.replyTo;

                const saved = storeDirectMessage(messageData);
                broadcastToUser(data.toUser, saved);
                ws.send(JSON.stringify(saved));

            } else if (data.type === 'recall') {
                const messageId = data.messageId;
                const roomMsgs = getRoomMessages(currentRoom);
                const messageIndex = roomMsgs.findIndex(m => m.id === messageId && m.username === username);

                if (messageIndex !== -1) {
                    roomMsgs.splice(messageIndex, 1);
                    db.prepare('DELETE FROM messages WHERE id = ? AND room = ? AND username = ?').run(messageId, currentRoom, username);
                    db.prepare('DELETE FROM pinned_messages WHERE message_id = ?').run(messageId);

                    broadcastToRoom(currentRoom, {
                        type: 'messageRecalled',
                        messageId: messageId,
                        username: username
                    });
                }

            } else if (data.type === 'readMessage') {
                const messageId = data.messageId;
                const roomMsgs = getRoomMessages(currentRoom);
                const message = roomMsgs.find(m => m.id === messageId);

                if (message && username !== message.username) {
                    message.reads = message.reads || {};
                    message.reads[username] = true;
                    broadcastToRoom(currentRoom, {
                        type: 'messageRead',
                        messageId: messageId,
                        reader: username
                    });
                }

            } else if (data.type === 'createRoom') {
                const roomName = String(data.roomName || '').trim().slice(0, 50);
                if (roomName && !rooms[roomName]) {
                    ensureRoom(roomName);
                    broadcastToAll({
                        type: 'roomCreated',
                        room: roomName
                    });
                }

            } else if (data.type === 'joinRoom') {
                const oldRoom = currentRoom;
                const newRoom = data.room || '大厅';
                ensureRoom(newRoom);

                if (rooms[oldRoom]) {
                    rooms[oldRoom] = rooms[oldRoom].filter(u => u !== username);
                }
                rooms[newRoom].push(username);

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

                ws.send(JSON.stringify({
                    type: 'joinedRoom',
                    room: newRoom,
                    messages: getRoomMessages(newRoom).slice(-HISTORY_LIMIT),
                    users: getRoomUsers(newRoom),
                    pinnedMessages: getPinnedMessages(newRoom),
                    announcements: getAnnouncements(newRoom),
                    votes: getVotes(newRoom)
                }));

            } else if (data.type === 'typing') {
                broadcastToOthersInRoom(ws, currentRoom, {
                    type: 'typing',
                    username: username
                });
            } else if (data.type === 'stopTyping') {
                broadcastToOthersInRoom(ws, currentRoom, {
                    type: 'stopTyping',
                    username: username
                });
            } else if (data.type === 'updateProfile') {
                const newUsername = data.newUsername;
                const newAvatar = data.newAvatar;

                const oldUsername = username;

                if (newUsername) {
                    username = newUsername;
                }
                if (newAvatar) {
                    avatar = newAvatar;
                }

                const userData = users.get(ws);
                if (userData) {
                    userData.username = username;
                    userData.avatar = avatar;
                }

                if (rooms[currentRoom]) {
                    const userIndex = rooms[currentRoom].indexOf(oldUsername);
                    if (userIndex !== -1) {
                        rooms[currentRoom][userIndex] = username;
                    }
                }

                if (oldUsername !== username) {
                    db.prepare(`
                        UPDATE messages SET username = ?, payload = json_set(payload, '$.username', ?)
                        WHERE room = ? AND username = ?
                    `).run(username, username, currentRoom, oldUsername);
                }
                if (newAvatar) {
                    db.prepare(`
                        UPDATE messages SET avatar = ?, payload = json_set(payload, '$.avatar', ?)
                        WHERE room = ? AND username = ?
                    `).run(avatar, avatar, currentRoom, username);
                }

                const roomMsgs = getRoomMessages(currentRoom);
                roomMsgs.forEach(msg => {
                    if (msg.username === oldUsername) {
                        msg.username = username;
                        msg.avatar = avatar;
                    }
                });

                ws.send(JSON.stringify({
                    type: 'profileUpdated',
                    username: username,
                    avatar: avatar
                }));

                broadcastToRoom(currentRoom, {
                    type: 'system',
                    message: oldUsername + ' 修改了昵称为 ' + username,
                    users: getRoomUsers(currentRoom)
                });
            } else if (data.type === 'addReaction') {
                const messageId = data.messageId;
                const emoji = data.emoji;
                const reactingUsername = username;

                const roomMsgs = getRoomMessages(currentRoom);
                const message = roomMsgs.find(m => m.id === messageId);

                if (message) {
                    if (!message.reactions) {
                        message.reactions = {};
                    }

                    if (message.reactions[reactingUsername] === emoji) {
                        delete message.reactions[reactingUsername];
                    } else {
                        message.reactions[reactingUsername] = emoji;
                    }

                    db.prepare(`
                        UPDATE messages SET payload = json_set(payload, '$.reactions', json(?))
                        WHERE id = ? AND room = ?
                    `).run(JSON.stringify(message.reactions), messageId, currentRoom);

                    broadcastToRoom(currentRoom, {
                        type: 'reactionAdded',
                        messageId: messageId,
                        reactions: message.reactions
                    });
                }
            } else if (data.type === 'pinMessage') {
                const messageId = data.messageId;
                db.prepare(`
                    INSERT OR REPLACE INTO pinned_messages (message_id, room, content, username, created_at)
                    VALUES (?, ?, ?, ?, ?)
                `).run(messageId, currentRoom, data.content || '', username, Date.now());

                broadcastToRoom(currentRoom, {
                    type: 'pinMessage',
                    messageId: messageId,
                    content: data.content,
                    username: username
                });

            } else if (data.type === 'unpinMessage') {
                const messageId = data.messageId;
                db.prepare('DELETE FROM pinned_messages WHERE message_id = ? AND room = ?').run(messageId, currentRoom);

                broadcastToRoom(currentRoom, {
                    type: 'unpinMessage',
                    messageId: messageId
                });

            } else if (data.type === 'createAnnouncement') {
                const content = String(data.content || '').trim();
                if (!content) return;

                const announcement = {
                    id: generateId(),
                    content,
                    author: username,
                    time: fullTime()
                };
                db.prepare(`
                    INSERT INTO announcements (id, room, content, author, time, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(announcement.id, currentRoom, announcement.content, announcement.author, announcement.time, Date.now());

                broadcastToRoom(currentRoom, {
                    type: 'newAnnouncement',
                    announcement
                });

            } else if (data.type === 'updateAnnouncement') {
                const row = db.prepare('SELECT author FROM announcements WHERE id = ? AND room = ?').get(data.id, currentRoom);
                const content = String(data.content || '').trim();
                if (row && row.author === username && content) {
                    db.prepare('UPDATE announcements SET content = ? WHERE id = ? AND room = ?').run(content, data.id, currentRoom);
                    broadcastToRoom(currentRoom, {
                        type: 'announcements',
                        announcements: getAnnouncements(currentRoom)
                    });
                }

            } else if (data.type === 'deleteAnnouncement') {
                const row = db.prepare('SELECT author FROM announcements WHERE id = ? AND room = ?').get(data.id, currentRoom);
                if (row && row.author === username) {
                    db.prepare('DELETE FROM announcements WHERE id = ? AND room = ?').run(data.id, currentRoom);
                    broadcastToRoom(currentRoom, {
                        type: 'announcements',
                        announcements: getAnnouncements(currentRoom)
                    });
                }

            } else if (data.type === 'createVote') {
                const title = String(data.title || '').trim();
                const options = Array.isArray(data.options)
                    ? data.options.map(o => String(o).trim()).filter(Boolean).slice(0, 10)
                    : [];
                if (!title || options.length < 2) return;

                const vote = {
                    id: generateId(),
                    title,
                    options,
                    multiSelect: !!data.multiSelect,
                    deadline: data.deadline || null,
                    creator: username,
                    votes: options.map(() => []),
                    voters: {}
                };
                db.prepare('INSERT INTO votes (id, room, payload, created_at) VALUES (?, ?, ?, ?)')
                    .run(vote.id, currentRoom, JSON.stringify(vote), Date.now());

                broadcastToRoom(currentRoom, {
                    type: 'votes',
                    votes: getVotes(currentRoom)
                });

            } else if (data.type === 'submitVote') {
                const vote = getVote(currentRoom, data.voteId);
                if (!vote) return;
                if (vote.deadline && new Date(vote.deadline) < new Date()) return;

                vote.voters = vote.voters || {};
                if (vote.voters[username]) return;

                let selected = Array.isArray(data.options)
                    ? [...new Set(data.options.map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < vote.options.length))]
                    : [];
                if (!vote.multiSelect) selected = selected.slice(0, 1);
                if (selected.length === 0) return;

                vote.votes = vote.votes || vote.options.map(() => []);
                selected.forEach(index => {
                    if (!vote.votes[index]) vote.votes[index] = [];
                    vote.votes[index].push(username);
                });
                vote.voters[username] = true;

                db.prepare('UPDATE votes SET payload = ? WHERE id = ? AND room = ?')
                    .run(JSON.stringify(vote), vote.id, currentRoom);

                broadcastToRoom(currentRoom, {
                    type: 'votes',
                    votes: getVotes(currentRoom)
                });

            } else if (data.type === 'callOffer') {
                const callId = Date.now().toString();
                broadcastToUser(data.toUser, {
                    type: 'callOffer',
                    from: username,
                    avatar: avatar,
                    callType: data.callType,
                    callId: callId
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
            } else if (data.type === 'webrtcOffer') {
                broadcastToUser(data.toUser, {
                    type: 'webrtcOffer',
                    from: username,
                    offer: data.offer
                });
            } else if (data.type === 'webrtcAnswer') {
                broadcastToUser(data.toUser, {
                    type: 'webrtcAnswer',
                    from: username,
                    answer: data.answer
                });
            } else if (data.type === 'webrtcIceCandidate') {
                broadcastToUser(data.toUser, {
                    type: 'webrtcIceCandidate',
                    from: username,
                    candidate: data.candidate
                });
            }
        } catch (e) {
            console.error('解析消息失败:', e);
        }
    });

    ws.on('close', () => {
        if (username) {
            if (rooms[currentRoom]) {
                rooms[currentRoom] = rooms[currentRoom].filter(u => u !== username);
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
    console.log(`局域网访问: http://[您的IP地址]:${PORT}`);
    console.log(`数据已持久化到 ${DB_FILE}`);
});
