
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 3000;

const server = http.createServer((req, res) => {
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

wss.on('connection', (ws) => {
    let username = '';

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'login') {
                username = data.username;
                users.set(ws, username);
                broadcast({
                    type: 'system',
                    message: `${username} 加入了聊天`,
                    users: Array.from(users.values())
                });
            } else if (data.type === 'message') {
                broadcast({
                    type: 'message',
                    username: username,
                    content: data.content,
                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                });
            }
        } catch (e) {
            console.error('解析消息失败:', e);
        }
    });

    ws.on('close', () => {
        if (username) {
            users.delete(ws);
            broadcast({
                type: 'system',
                message: `${username} 离开了聊天`,
                users: Array.from(users.values())
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

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
