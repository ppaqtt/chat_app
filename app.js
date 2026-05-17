
document.addEventListener('DOMContentLoaded', function() {
    let ws;
    let currentUsername = '';
    let currentAvatar = '';
    let typingTimeout;
    let isPrivateMode = false;
    let privateTarget = null;
    let currentRoom = '大厅';

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
    const groupChatBtn = document.getElementById('groupChatBtn');
    const privateChatBtn = document.getElementById('privateChatBtn');
    const privateChatPanel = document.getElementById('privateChatPanel');
    const privateChatUsers = document.getElementById('privateChatUsers');
    const imageBtn = document.getElementById('imageBtn');
    const imageInput = document.getElementById('imageInput');
    const roomPanel = document.getElementById('roomPanel');
    const roomList = document.getElementById('roomList');
    const newRoomInput = document.getElementById('newRoomInput');
    const createRoomBtn = document.getElementById('createRoomBtn');
    
    let rooms = {};
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
    
    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', handleImageUpload);
    
    async function handleImageUpload() {
        const file = imageInput.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append('file', file);
    
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.url) {
                sendImageMessage(data.url);
            }
        } catch (error) {
            console.error('上传失败:', error);
            alert('图片上传失败');
        }
        
        imageInput.value = '';
    }
    
    function sendImageMessage(imageUrl) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
        if (isPrivateMode && privateTarget) {
            ws.send(JSON.stringify({
                type: 'privateMessage',
                content: '[图片]',
                imageUrl: imageUrl,
                toUser: privateTarget,
                timestamp: timestamp
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'imageMessage',
                imageUrl: imageUrl,
                timestamp: timestamp
            }));
        }
    }
    
    createRoomBtn.addEventListener('click', () => {
        const roomName = newRoomInput.value.trim();
        if (roomName) {
            ws.send(JSON.stringify({
                type: 'createRoom',
                roomName: roomName
            }));
            newRoomInput.value = '';
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
    
    groupChatBtn.addEventListener('click', () => {
        isPrivateMode = false;
        privateTarget = null;
        groupChatBtn.classList.add('active');
        privateChatBtn.classList.remove('active');
        privateChatPanel.classList.remove('active');
        messageInput.placeholder = `在 ${currentRoom} 发消息...`;
        messagesArea.innerHTML = '';
    });
    
    privateChatBtn.addEventListener('click', () => {
        isPrivateMode = true;
        groupChatBtn.classList.remove('active');
        privateChatBtn.classList.add('active');
        privateChatPanel.classList.toggle('active');
    });
    
    document.getElementById('roomBtn').addEventListener('click', () => {
        const roomPanel = document.getElementById('roomPanel');
        roomPanel.classList.toggle('active');
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
                username: username,
                avatar: '',
                room: currentRoom
            }));
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
        switch(data.type) {
            case 'loginSuccess':
                currentUsername = data.username;
                currentAvatar = data.avatar;
                currentRoom = data.room || '大厅';
                if (data.rooms) {
                    updateRoomList(data.rooms);
                }
                if (data.messages) {
                    data.messages.forEach(msg => {
                        addMessage(msg);
                    });
                }
                scrollToBottom();
                break;
            case 'message':
                addMessage(data);
                scrollToBottom();
                break;
            case 'imageMessage':
                addMessage(data);
                scrollToBottom();
                break;
            case 'privateMessage':
                addMessage(data);
                scrollToBottom();
                break;
            case 'system':
                addSystemMessage(data.message);
                if (data.users) {
                    updateUsersList(data.users);
                }
                scrollToBottom();
                break;
            case 'typing':
                if (data.username !== currentUsername) {
                    showTypingIndicator(data.username);
                }
                break;
            case 'stopTyping':
                hideTypingIndicator();
                break;
            case 'messageRecalled':
                recallMessage(data.messageId, data.username);
                break;
            case 'messageRead':
                updateMessageReadStatus(data.messageId, data.reader);
                break;
            case 'roomCreated':
                addRoomToList(data.room);
                break;
            case 'joinedRoom':
                currentRoom = data.room;
                messageInput.placeholder = `在 ${currentRoom} 发消息...`;
                messagesArea.innerHTML = '';
                if (data.messages) {
                    data.messages.forEach(msg => {
                        addMessage(msg);
                    });
                }
                if (data.users) {
                    updateUsersList(data.users);
                }
                updateRoomList(Object.keys(rooms));
                scrollToBottom();
                break;
        }
    }
    
    function addMessage(data) {
        if (isPrivateMode && privateTarget) {
            if (data.type !== 'privateMessage' || (data.toUser !== privateTarget && data.username !== privateTarget)) {
                return;
            }
        }
    
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${data.username === currentUsername ? 'own' : 'other'}`;
        messageDiv.dataset.messageId = data.id;
    
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (data.type === 'imageMessage' && data.imageUrl) {
            const img = document.createElement('img');
            img.src = data.imageUrl;
            img.alt = '发送的图片';
            img.onclick = () => window.open(data.imageUrl, '_blank');
            bubble.appendChild(img);
        } else {
            bubble.textContent = data.content;
        }
    
        const info = document.createElement('div');
        info.className = 'message-info';
        
        if (data.isPrivate) {
            info.innerHTML = `${data.username} ${data.timestamp} <span class="private-badge">私</span>`;
        } else {
            info.textContent = `${data.username} ${data.timestamp}`;
        }
    
        if (data.username === currentUsername) {
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            
            const recallBtn = document.createElement('button');
            recallBtn.className = 'message-action-btn recall';
            recallBtn.textContent = '撤回';
            recallBtn.onclick = () => recallMessage(data.id);
            actions.appendChild(recallBtn);
            
            info.appendChild(actions);
            
            if (!data.isPrivate) {
                const readStatus = document.createElement('span');
                readStatus.className = 'read-status';
                readStatus.id = `read-${data.id}`;
                readStatus.textContent = '未读';
                info.appendChild(readStatus);
            }
        }
    
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(info);
        messagesArea.appendChild(messageDiv);
    
        if (data.username !== currentUsername && !data.isPrivate) {
            ws.send(JSON.stringify({
                type: 'readMessage',
                messageId: data.id
            }));
        }
    }
    
    function recallMessage(messageId, username) {
        if (username === currentUsername || !username) {
            ws.send(JSON.stringify({
                type: 'recall',
                messageId: messageId
            }));
        }
        
        const messageEl = messagesArea.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            messageEl.classList.add('recalled');
            const bubble = messageEl.querySelector('.message-bubble');
            bubble.textContent = '此消息已被撤回';
        }
    }
    
    function updateMessageReadStatus(messageId, reader) {
        const readStatus = document.getElementById(`read-${messageId}`);
        if (readStatus) {
            readStatus.textContent = '已读';
            readStatus.classList.add('read');
        }
    }
    
    function addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
    
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
    
        messageDiv.appendChild(bubble);
        messagesArea.appendChild(messageDiv);
    }
    
    function updateRoomList(roomList) {
        rooms = {};
        roomList.forEach(room => {
            rooms[room] = true;
        });
        renderRoomList();
    }
    
    function addRoomToList(room) {
        rooms[room] = true;
        renderRoomList();
    }
    
    function renderRoomList() {
        roomList.innerHTML = '';
        Object.keys(rooms).forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = `room-item ${room === currentRoom ? 'active' : ''}`;
            roomItem.innerHTML = `<span>${room}</span>`;
            roomItem.onclick = () => {
                if (room !== currentRoom) {
                    ws.send(JSON.stringify({
                        type: 'joinRoom',
                        room: room
                    }));
                    roomPanel.classList.remove('active');
                }
            };
            roomList.appendChild(roomItem);
        });
    }
    
    function updateUsersList(users) {
        if (!Array.isArray(users)) {
            usersList.innerHTML = '<span>在线：0 人</span>';
            return;
        }
        
        usersList.innerHTML = '<span>在线：' + users.length + ' 人</span>';
        
        privateChatUsers.innerHTML = '';
        users.forEach(user => {
            if (!user || !user.username || user.username === currentUsername) {
                return;
            }
            
            const tag = document.createElement('span');
            tag.className = 'user-tag';
            tag.textContent = user.username;
            usersList.appendChild(tag);

            const userDiv = document.createElement('div');
            userDiv.className = 'private-chat-user';
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar';
            avatarDiv.style.backgroundColor = user.avatar || generateAvatarColor(user.username);
            avatarDiv.textContent = (user.username.charAt(0) || '?').toUpperCase();
            
            const userInfo = document.createElement('div');
            userInfo.className = 'private-target-info';
            
            const nameSpan = document.createElement('div');
            nameSpan.className = 'private-target-name';
            nameSpan.textContent = user.username;
            
            const statusSpan = document.createElement('div');
            statusSpan.className = 'private-target-status';
            statusSpan.textContent = '在线';
            
            userInfo.appendChild(nameSpan);
            userInfo.appendChild(statusSpan);
            
            userDiv.appendChild(avatarDiv);
            userDiv.appendChild(userInfo);
            
            userDiv.onclick = () => selectPrivateChat(user.username);
            
            privateChatUsers.appendChild(userDiv);
        });
    }
    
    function selectPrivateChat(username) {
        privateTarget = username;
        privateChatPanel.classList.remove('active');
        messageInput.placeholder = '私聊 ' + username + '...';
        messagesArea.innerHTML = '';
    }
    
    function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;
    
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
        if (isPrivateMode && privateTarget) {
            ws.send(JSON.stringify({
                type: 'privateMessage',
                content: content,
                toUser: privateTarget,
                timestamp: timestamp
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'message',
                content: content,
                timestamp: timestamp
            }));
        }
    
        ws.send(JSON.stringify({
            type: 'stopTyping',
            username: currentUsername
        }));
    
        messageInput.value = '';
        messageInput.focus();
    }
    
    function showTypingIndicator(username) {
        typingIndicator.textContent = username + ' 正在输入...';
        typingIndicator.classList.add('active');
    }
    
    function hideTypingIndicator() {
        typingIndicator.classList.remove('active');
    }
    
    function generateAvatarColor(username) {
        if (!username) {
            return '#667eea';
        }
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#00CED1'
        ];
        return colors[(username.charCodeAt(0) || 0) % colors.length];
    }
    
    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
    
    initEmojiPicker();
});
