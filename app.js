
let ws;
let currentUsername = '';

const loginScreen = document.getElementById('loginScreen');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const usersList = document.getElementById('usersList');

loginBtn.addEventListener('click', login);
usernameInput.addEventListener('keypress', (e) =&gt; {
    if (e.key === 'Enter') login();
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) =&gt; {
    if (e.key === 'Enter') sendMessage();
});

function login() {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('请输入昵称');
        return;
    }

    currentUsername = username;
    ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () =&gt; {
        loginScreen.style.display = 'none';
        ws.send(JSON.stringify({
            type: 'login',
            username: username
        }));
        messageInput.focus();
    };

    ws.onmessage = (event) =&gt; {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };

    ws.onerror = (error) =&gt; {
        console.error('WebSocket 错误:', error);
        alert('连接失败，请刷新页面重试');
    };
}

function handleMessage(data) {
    if (data.type === 'message') {
        addMessage(data);
    } else if (data.type === 'system') {
        addSystemMessage(data.message);
        updateUsersList(data.users);
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
    usersList.innerHTML = `&lt;span&gt;在线：${users.length} 人&lt;/span&gt;`;
    users.forEach(user =&gt; {
        const tag = document.createElement('span');
        tag.className = 'user-tag';
        tag.textContent = user;
        usersList.appendChild(tag);
    });
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    ws.send(JSON.stringify({
        type: 'message',
        content: content
    }));

    messageInput.value = '';
    messageInput.focus();
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}
