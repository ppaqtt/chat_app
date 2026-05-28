
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const url = require('url');

const PORT = 3000;
const UPLOAD_DIR = './uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
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
                        const filename = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.jpg';
                        const contentMatch = part.split('\r\n\r\n');
                        if (contentMatch && contentMatch[1]) {
                            const content = Buffer.from(contentMatch[1], 'binary');
                            fs.writeFileSync(path.join(UPLOAD_DIR, filename), content);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ url: '/uploads/' + filename }));
                            return;
                        }
                    }
                }
            }
            
            res.writeHead(400);
            res.end('Upload failed');
        });
        return;
    }

    if (req.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                const ext = path.extname(filePath);
                const contentType = ext === '.png' ? 'image/png' : 
                                   ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                                   ext === '.gif' ? 'image/gif' : 'image/*';
                res.writeHead(200, { 'Content-Type': contentType });
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
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

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

let users = new Map();
let rooms = { '大厅': [] };
let messages = {};
let pinnedMessages = {};
const MAX_MESSAGES = 200;

function getRoomMessages(room) {
    if (!messages[room]) {
        messages[room] = [];
    }
    return messages[room];
}

function generateAvatar(username) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#00CED1'
    ];
    return colors[(username && username.charCodeAt ? username.charCodeAt(0) : 0) % colors.length];
}

wss.on('connection', (ws) => {
    let username = '';
    let avatar = '';
    let currentRoom = '大厅';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'login') {
                username = data.username || 'Guest';
                avatar = data.avatar || generateAvatar(username);
                currentRoom = data.room || '大厅';
                
                users.set(ws, { username, avatar, room: currentRoom });
                
                if (!rooms[currentRoom]) {
                    rooms[currentRoom] = [];
                }
                rooms[currentRoom].push(username);
                
                const userList = getRoomUsers(currentRoom);
                const roomMessages = getRoomMessages(currentRoom).slice(-50);
                
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
                    pinnedMessages: pinnedMessages
                }));
                
            } else if (data.type === 'message') {
                const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const roomMsgs = getRoomMessages(currentRoom);
                const messageData = {
                    type: 'message',
                    id: Date.now().toString(),
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    timestamp: timestamp,
                    room: currentRoom,
                    isPrivate: false,
                    reads: {}
                };
                
                roomMsgs.push(messageData);
                if (roomMsgs.length > MAX_MESSAGES) {
                    roomMsgs.shift();
                }
                
                broadcastToRoom(currentRoom, messageData);
                
            } else if (data.type === 'imageMessage') {
                const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const roomMsgs = getRoomMessages(currentRoom);
                const messageData = {
                    type: 'imageMessage',
                    id: Date.now().toString(),
                    username: username,
                    avatar: avatar,
                    imageUrl: data.imageUrl,
                    timestamp: timestamp,
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {}
                };
                
                roomMsgs.push(messageData);
                if (roomMsgs.length > MAX_MESSAGES) {
                    roomMsgs.shift();
                }
                
                broadcastToRoom(currentRoom, messageData);
                
            } else if (data.type === 'fileMessage') {
                const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const roomMsgs = getRoomMessages(currentRoom);
                const messageData = {
                    type: 'fileMessage',
                    id: Date.now().toString(),
                    username: username,
                    avatar: avatar,
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    content: data.content,
                    timestamp: timestamp,
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {}
                };
                
                roomMsgs.push(messageData);
                if (roomMsgs.length > MAX_MESSAGES) {
                    roomMsgs.shift();
                }
                
                broadcastToRoom(currentRoom, messageData);
                
            } else if (data.type === 'privateFileMessage') {
                const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const messageData = {
                    type: 'privateFileMessage',
                    id: Date.now().toString(),
                    username: username,
                    avatar: avatar,
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    content: data.content,
                    timestamp: timestamp,
                    toUser: data.toUser,
                    isPrivate: true
                };
                
                broadcastToUser(data.toUser, messageData);
                ws.send(JSON.stringify(messageData));
                
            } else if (data.type === 'privateMessage') {
                const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const messageData = {
                    type: 'privateMessage',
                    id: Date.now().toString(),
                    username: username,
                    avatar: avatar,
                    content: data.content || '',
                    timestamp: timestamp,
                    toUser: data.toUser,
                    isPrivate: true
                };
                
                broadcastToUser(data.toUser, messageData);
                ws.send(JSON.stringify(messageData));
                
            } else if (data.type === 'recall') {
                const messageId = data.messageId;
                const roomMsgs = getRoomMessages(currentRoom);
                const messageIndex = roomMsgs.findIndex(m => m.id === messageId && m.username === username);
                
                if (messageIndex !== -1) {
                    roomMsgs.splice(messageIndex, 1);
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
                const roomName = data.roomName;
                if (roomName && !rooms[roomName]) {
                    rooms[roomName] = [];
                    broadcastToAll({
                        type: 'roomCreated',
                        room: roomName
                    });
                }
                
            } else if (data.type === 'joinRoom') {
                const oldRoom = currentRoom;
                const newRoom = data.room || '大厅';
                
                if (rooms[oldRoom]) {
                    rooms[oldRoom] = rooms[oldRoom].filter(u => u !== username);
                }
                
                if (!rooms[newRoom]) {
                    rooms[newRoom] = [];
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
                    messages: getRoomMessages(newRoom).slice(-50),
                    users: getRoomUsers(newRoom)
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
                const reactingUsername = data.username;

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

                    broadcastToRoom(currentRoom, {
                        type: 'reactionAdded',
                        messageId: messageId,
                        reactions: message.reactions
                    });
                }
            } else if (data.type === 'pinMessage') {
                const messageId = data.messageId;
                pinnedMessages[messageId] = {
                    content: data.content,
                    username: data.username
                };

                broadcastToRoom(currentRoom, {
                    type: 'pinMessage',
                    messageId: messageId,
                    content: data.content,
                    username: data.username
                });

            } else if (data.type === 'unpinMessage') {
                const messageId = data.messageId;
                delete pinnedMessages[messageId];

                broadcastToRoom(currentRoom, {
                    type: 'unpinMessage',
                    messageId: messageId
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
            } else if (data.type === 'locationMessage') {
                const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                const roomMsgs = getRoomMessages(currentRoom);
                const messageData = {
                    type: 'locationMessage',
                    id: Date.now().toString(),
                    username: username,
                    avatar: avatar,
                    content: data.content || '[位置共享]',
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timestamp: timestamp,
                    room: currentRoom,
                    isPrivate: false,
                    reads: {},
                    reactions: {}
                };

                roomMsgs.push(messageData);
                if (roomMsgs.length > MAX_MESSAGES) {
                    roomMsgs.shift();
                }

                broadcastToRoom(currentRoom, messageData);
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

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

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
});
