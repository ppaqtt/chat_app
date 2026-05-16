
let ws;
let currentUsername = '';
let typingTimeout;

const loginScreen = document.getElementById('loginScreen');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const usersList = document.getElementById('usersList');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const typingIndicator = document.getElementById('typingIndicator');

const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '👍', '👎', '👏', '🙌'];

function initEmojiPicker() {
    emojis.forEach(emoji => {
        const emojiItem = document.createElement('span');
        emojiItem.className = 'emoji-item';
        emojiItem.textContent = emoji;
        emojiItem.addEventListener('click', () => {
            messageInput.value += emoji;
            messageInput.focus();
            toggleEmojiPicker();
        });
        emojiPicker.appendChild(emojiItem);
    });
}

function toggleEmojiPicker() {
    emojiPicker.classList.toggle('active');
}

emojiBtn.addEventListener('click', toggleEmojiPicker);

document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.classList.remove('active');
    }
});

loginBtn.addEventListener('click', login);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

messageInput.addEventListener('input', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'typing',
            username: currentUsername
        }));
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'stopTyping',
                username: currentUsername
            }));
        }, 2000);
    }
});

function login() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('请输入昵称');
        return;
    }

    currentUsername = username;
    ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => {
        loginScreen.style.display = 'none';
        ws.send(JSON.stringify({
            type: 'login',
            username: username
        }));
        loadMessages();
        messageInput.focus();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        alert('连接失败，请刷新页面重试');
    };

    ws.onclose = () => {
        console.log('WebSocket 连接已关闭');
    };
}

function handleMessage(data) {
    if (data.type === 'message') {
        addMessage(data);
        saveMessage(data);
    } else if (data.type === 'system') {
        addSystemMessage(data.message);
        updateUsersList(data.users);
    } else if (data.type === 'typing') {
        if (data.username !== currentUsername) {
            showTypingIndicator(data.username);
        }
    } else if (data.type === 'stopTyping') {
        hideTypingIndicator();
    }
}

function addMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.username === currentUsername ? 'own' : 'other'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = data.content;

    const info = document.createElement('div');
    info.className = 'message-info';
    info.textContent = `${data.username} ${data.timestamp}`;

    messageDiv.appendChild(bubble);
    messageDiv.appendChild(info);
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

function updateUsersList(users) {
    usersList.innerHTML = `<span>在线：${users.length} 人</span>`;
    users.forEach(user => {
        const tag = document.createElement('span');
        tag.className = 'user-tag';
        tag.textContent = user;
        usersList.appendChild(tag);
    });
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    ws.send(JSON.stringify({
        type: 'message',
        content: content,
        timestamp: timestamp
    }));

    ws.send(JSON.stringify({
        type: 'stopTyping',
        username: currentUsername
    }));

    messageInput.value = '';
    messageInput.focus();
}

function showTypingIndicator(username) {
    typingIndicator.textContent = `${username} 正在输入...`;
    typingIndicator.classList.add('active');
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('active');
}

function saveMessage(data) {
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    messages.push(data);
    if (messages.length > 100) {
        messages.shift();
    }
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    messages.forEach(data => {
        if (data.type === 'message') {
            addMessage(data);
        } else if (data.type === 'system') {
            addSystemMessage(data.message);
        }
    });
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

initEmojiPicker();
