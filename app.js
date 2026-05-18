
document.addEventListener('DOMContentLoaded', function() {
    let ws;
    let currentUsername = '';
    let currentAvatar = '';
    let typingTimeout;
    let isPrivateMode = false;
    let privateTarget = null;
    let currentRoom = '大厅';
    let isDarkMode = false;
    let replyingTo = null;
    let mentionMode = false;
    let mentionFilter = '';

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
    const themeBtn = document.getElementById('themeBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchPanel = document.getElementById('searchPanel');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const replyBox = document.getElementById('replyBox');
    const replyBoxText = document.getElementById('replyBoxText');
    const replyBoxClose = document.getElementById('replyBoxClose');
    const mentionSuggestions = document.getElementById('mentionSuggestions');

    let rooms = {};
    let onlineUsers = [];
    let allMessages = [];
    const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '👍', '👎', '👏', '🙌'];

    function initTheme() {
        const savedTheme = localStorage.getItem('chatTheme');
        if (savedTheme === 'dark') {
            isDarkMode = true;
            document.body.classList.add('dark-mode');
            themeBtn.textContent = '☀️';
        } else {
            isDarkMode = false;
            document.body.classList.remove('dark-mode');
            themeBtn.textContent = '🌙';
        }
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            themeBtn.textContent = '☀️';
            localStorage.setItem('chatTheme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            themeBtn.textContent = '🌙';
            localStorage.setItem('chatTheme', 'light');
        }
    }

    themeBtn.addEventListener('click', toggleTheme);

    function toggleSearch() {
        searchPanel.classList.toggle('active');
        if (searchPanel.classList.contains('active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            searchResults.innerHTML = '';
        }
    }

    searchBtn.addEventListener('click', toggleSearch);

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length === 0) {
            searchResults.innerHTML = '';
            return;
        }

        const results = allMessages.filter(msg => 
            msg.content && msg.content.toLowerCase().includes(query)
        );

        searchResults.innerHTML = '';
        if (results.length === 0) {
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">没有找到匹配的聊天记录</div>';
            return;
        }

        results.slice(0, 20).forEach(msg => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = '<div class="search-result-author">' + msg.username + '</div><div class="search-result-content">' + msg.content + '</div>';
            item.onclick = () => {
                scrollToMessage(msg.id);
                toggleSearch();
            };
            searchResults.appendChild(item);
        });
    });

    function scrollToMessage(messageId) {
        const msgElement = messagesArea.querySelector('[data-message-id="' + messageId + '"]');
        if (msgElement) {
            msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            msgElement.style.background = 'rgba(102, 126, 234, 0.2)';
            setTimeout(() => {
                msgElement.style.background = '';
            }, 2000);
        }
    }

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
        if (!mentionSuggestions.contains(e.target) && e.target !== messageInput) {
            mentionSuggestions.classList.remove('active');
            mentionMode = false;
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
        const timestamp = formatTime(now);

        const messageData = {
            type: 'imageMessage',
            imageUrl: imageUrl,
            timestamp: timestamp
        };

        if (replyingTo) {
            messageData.replyTo = replyingTo;
            clearReply();
        }

        if (isPrivateMode && privateTarget) {
            messageData.type = 'privateMessage';
            messageData.toUser = privateTarget;
            messageData.content = '[图片]';
        }

        ws.send(JSON.stringify(messageData));
    }

    function formatTime(date) {
        return date.getFullYear() + '-' +
               String(date.getMonth() + 1).padStart(2, '0') + '-' +
               String(date.getDate()).padStart(2, '0') + ' ' +
               String(date.getHours()).padStart(2, '0') + ':' +
               String(date.getMinutes()).padStart(2, '0') + ':' +
               String(date.getSeconds()).padStart(2, '0');
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
        if (e.key === 'Enter' && !mentionMode) sendMessage();
    });

    messageInput.addEventListener('input', () => {
        const value = messageInput.value;
        const lastAtIndex = value.lastIndexOf('@');

        if (lastAtIndex !== -1 && (lastAtIndex === 0 || value[lastAtIndex - 1] === ' ')) {
            const afterAt = value.substring(lastAtIndex + 1);
            if (!afterAt.includes(' ')) {
                mentionMode = true;
                mentionFilter = afterAt.toLowerCase();
                showMentionSuggestions();
            } else {
                mentionMode = false;
                mentionSuggestions.classList.remove('active');
            }
        } else {
            mentionMode = false;
            mentionSuggestions.classList.remove('active');
        }

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

    function showMentionSuggestions() {
        mentionSuggestions.innerHTML = '';
        const filteredUsers = onlineUsers.filter(user => 
            user.username !== currentUsername &&
            user.username.toLowerCase().includes(mentionFilter)
        );

        if (filteredUsers.length === 0) {
            mentionSuggestions.classList.remove('active');
            return;
        }

        filteredUsers.forEach(user => {
            const suggestion = document.createElement('div');
            suggestion.className = 'mention-suggestion';
            suggestion.innerHTML = '<div class="avatar" style="background-color: ' + (user.avatar || generateAvatarColor(user.username)) + '">' + (user.username.charAt(0) || '?').toUpperCase() + '</div><span>' + user.username + '</span>';
            suggestion.onclick = () => {
                const value = messageInput.value;
                const lastAtIndex = value.lastIndexOf('@');
                messageInput.value = value.substring(0, lastAtIndex) + '@' + user.username + ' ';
                mentionMode = false;
                mentionSuggestions.classList.remove('active');
                messageInput.focus();
            };
            mentionSuggestions.appendChild(suggestion);
        });

        mentionSuggestions.classList.add('active');
    }

    replyBoxClose.addEventListener('click', clearReply);

    function setReply(messageId, author, content) {
        replyingTo = { id: messageId, author: author, content: content };
        replyBox.classList.add('active');
        replyBoxText.textContent = author + ': ' + content;
    }

    function clearReply() {
        replyingTo = null;
        replyBox.classList.remove('active');
        replyBoxText.textContent = '';
    }

    groupChatBtn.addEventListener('click', () => {
        isPrivateMode = false;
        privateTarget = null;
        groupChatBtn.classList.add('active');
        privateChatBtn.classList.remove('active');
        privateChatPanel.classList.remove('active');
        messageInput.placeholder = '在 ' + currentRoom + ' 发消息...';
        messagesArea.innerHTML = '';
        allMessages.forEach(msg => {
            if (!msg.isPrivate || msg.toUser === currentUsername || msg.username === currentUsername) {
                addMessage(msg);
            }
        });
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
        ws = new WebSocket('ws://' + window.location.host);

        ws.onopen = () => {
            loginScreen.style.display = 'none';
            ws.send(JSON.stringify({
                type: 'login',
                username: username,
                avatar: '',
                room: currentRoom
            }));
            messageInput.focus();
            initTheme();
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
                        allMessages.push(msg);
                        addMessage(msg);
                    });
                }
                scrollToBottom();
                break;
            case 'message':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'imageMessage':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'privateMessage':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'system':
                addSystemMessage(data.message);
                if (data.users) {
                    onlineUsers = data.users;
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
                messageInput.placeholder = '在 ' + currentRoom + ' 发消息...';
                messagesArea.innerHTML = '';
                allMessages = [];
                if (data.messages) {
                    data.messages.forEach(msg => {
                        allMessages.push(msg);
                        addMessage(msg);
                    });
                }
                if (data.users) {
                    onlineUsers = data.users;
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
        messageDiv.className = 'message ' + (data.username === currentUsername ? 'own' : 'other');
        messageDiv.dataset.messageId = data.id;

        if (data.replyTo) {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'message-reply';
            replyDiv.innerHTML = '<div class="message-reply-author">' + data.replyTo.author + '</div><div>' + data.replyTo.content + '</div>';
            messageDiv.appendChild(replyDiv);
        }

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        let content = data.content || '';
        content = content.replace(/@(\w+)/g, '<span class="mention-highlight">@$1</span>');

        if (data.type === 'imageMessage' && data.imageUrl) {
            const img = document.createElement('img');
            img.src = data.imageUrl;
            img.alt = '发送的图片';
            img.onclick = () => window.open(data.imageUrl, '_blank');
            bubble.appendChild(img);
        } else {
            bubble.innerHTML = content;
        }

        const info = document.createElement('div');
        info.className = 'message-info';

        if (data.isPrivate) {
            info.innerHTML = data.username + ' ' + data.timestamp + ' <span class="private-badge">私</span>';
        } else {
            info.textContent = data.username + ' ' + data.timestamp;
        }

        if (data.username === currentUsername) {
            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const replyBtn = document.createElement('button');
            replyBtn.className = 'message-action-btn reply';
            replyBtn.textContent = '回复';
            replyBtn.onclick = () => {
                const displayContent = data.content || '[图片]';
                setReply(data.id, data.username, displayContent);
                messageInput.focus();
            };
            actions.appendChild(replyBtn);

            const recallBtn = document.createElement('button');
            recallBtn.className = 'message-action-btn recall';
            recallBtn.textContent = '撤回';
            recallBtn.onclick = () => recallMessage(data.id);
            actions.appendChild(recallBtn);

            info.appendChild(actions);

            if (!data.isPrivate) {
                const readStatus = document.createElement('span');
                readStatus.className = 'read-status';
                readStatus.id = 'read-' + data.id;
                readStatus.textContent = '未读';
                info.appendChild(readStatus);
            }
        } else {
            const actions = document.createElement('div');
            actions.className = 'message-actions';

            const replyBtn = document.createElement('button');
            replyBtn.className = 'message-action-btn reply';
            replyBtn.textContent = '回复';
            replyBtn.onclick = () => {
                const displayContent = data.content || '[图片]';
                setReply(data.id, data.username, displayContent);
                messageInput.focus();
            };
            actions.appendChild(replyBtn);

            info.appendChild(actions);
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

        const messageEl = messagesArea.querySelector('[data-message-id="' + messageId + '"]');
        if (messageEl) {
            messageEl.classList.add('recalled');
            const bubble = messageEl.querySelector('.message-bubble');
            bubble.textContent = '此消息已被撤回';
        }

        const msgIndex = allMessages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            allMessages.splice(msgIndex, 1);
        }
    }

    function updateMessageReadStatus(messageId, reader) {
        const readStatus = document.getElementById('read-' + messageId);
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

    function updateRoomList(roomListData) {
        rooms = {};
        roomListData.forEach(room => {
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
            roomItem.className = 'room-item ' + (room === currentRoom ? 'active' : '');
            roomItem.innerHTML = '<span>' + room + '</span>';
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

        const privateMessages = allMessages.filter(msg =>
            (msg.type === 'privateMessage') &&
            ((msg.toUser === username && msg.username === currentUsername) ||
             (msg.toUser === currentUsername && msg.username === username))
        );

        privateMessages.forEach(msg => {
            addMessage(msg);
        });
    }

    function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;

        const now = new Date();
        const timestamp = formatTime(now);

        const messageData = {
            type: isPrivateMode && privateTarget ? 'privateMessage' : 'message',
            content: content,
            timestamp: timestamp
        };

        if (replyingTo) {
            messageData.replyTo = replyingTo;
            clearReply();
        }

        if (isPrivateMode && privateTarget) {
            messageData.toUser = privateTarget;
        }

        ws.send(JSON.stringify(messageData));

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
    initTheme();
});
