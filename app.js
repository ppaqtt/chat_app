
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
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsClose = document.getElementById('settingsClose');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    const nicknameInput = document.getElementById('nicknameInput');
    const settingsSaveBtn = document.getElementById('settingsSaveBtn');
    const reactionSelector = document.getElementById('reactionSelector');
    const fileBtn = document.getElementById('fileBtn');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const filePreviewName = document.getElementById('filePreviewName');
    const filePreviewClose = document.getElementById('filePreviewClose');
    const filePreviewProgressBar = document.getElementById('filePreviewProgressBar');
    const pinnedMessagesBar = document.getElementById('pinnedMessagesBar');
    const pinnedMessagesList = document.getElementById('pinnedMessagesList');
    const callBtn = document.getElementById('callBtn');
    const callPanel = document.getElementById('callPanel');
    const callClose = document.getElementById('callClose');
    const callUsers = document.getElementById('callUsers');
    const incomingCallModal = document.getElementById('incomingCallModal');
    const incomingCallAvatar = document.getElementById('incomingCallAvatar');
    const incomingCallText = document.getElementById('incomingCallText');
    const incomingCallType = document.getElementById('incomingCallType');
    const acceptCallBtn = document.getElementById('acceptCallBtn');
    const rejectCallBtn = document.getElementById('rejectCallBtn');
    const activeCallBar = document.getElementById('activeCallBar');
    const activeCallStatus = document.getElementById('activeCallStatus');
    const endCallBtn = document.getElementById('endCallBtn');
    const locationBtn = document.getElementById('locationBtn');
    const atAllBtn = document.getElementById('atAllBtn');
    const quickReplyBtn = document.getElementById('quickReplyBtn');
    const quickReplyPanel = document.getElementById('quickReplyPanel');
    const quickReplyClose = document.getElementById('quickReplyClose');
    const quickReplyList = document.getElementById('quickReplyList');
    const quickReplyAdd = document.getElementById('quickReplyAdd');
    const quickReplyInput = document.getElementById('quickReplyInput');
    const forwardPanel = document.getElementById('forwardPanel');
    const forwardClose = document.getElementById('forwardClose');
    const forwardTargetList = document.getElementById('forwardTargetList');
    const starredBtn = document.getElementById('starredBtn');
    const starredPanel = document.getElementById('starredPanel');
    const starredClose = document.getElementById('starredClose');
    const starredList = document.getElementById('starredList');
    const backgroundBtn = document.getElementById('backgroundBtn');
    const backgroundPanel = document.getElementById('backgroundPanel');
    const backgroundClose = document.getElementById('backgroundClose');
    const backgroundOptions = document.getElementById('backgroundOptions');
    const bgUploadInput = document.getElementById('bgUploadInput');
    const bgUploadBtn = document.getElementById('bgUploadBtn');
    const searchFilterUser = document.getElementById('searchFilterUser');
    const searchFilterStarred = document.getElementById('searchFilterStarred');
    const exportBtn = document.getElementById('exportBtn');
    const blockedPanel = document.getElementById('blockedPanel');
    const blockedList = document.getElementById('blockedList');
    const blockedClose = document.getElementById('blockedClose');
    const statsBtn = document.getElementById('statsBtn');
    const statsPanel = document.getElementById('statsPanel');
    const statsClose = document.getElementById('statsClose');
    const reminderBtn = document.getElementById('reminderBtn');
    const reminderPanel = document.getElementById('reminderPanel');
    const reminderClose = document.getElementById('reminderClose');
    const reminderTimeInput = document.getElementById('reminderTimeInput');
    const reminderContentInput = document.getElementById('reminderContentInput');
    const addReminderBtn = document.getElementById('addReminderBtn');
    const reminderList = document.getElementById('reminderList');
    const shortcutsHint = document.getElementById('shortcutsHint');
    const soundToggle = document.getElementById('soundToggle');
    const soundTypeSelect = document.getElementById('soundTypeSelect');
    const totalMessagesCount = document.getElementById('totalMessagesCount');
    const todayMessagesCount = document.getElementById('todayMessagesCount');
    const avgMsgLength = document.getElementById('avgMsgLength');
    const yourMessagesCount = document.getElementById('yourMessagesCount');
    const onlineTimeValue = document.getElementById('onlineTimeValue');
    const announcementBtn = document.getElementById('announcementBtn');
    const announcementPanel = document.getElementById('announcementPanel');
    const announcementClose = document.getElementById('announcementClose');
    const announcementInput = document.getElementById('announcementInput');
    const announcementCreateBtn = document.getElementById('announcementCreateBtn');
    const announcementList = document.getElementById('announcementList');
    const announcementBanner = document.getElementById('announcementBanner');
    const announcementAuthor = document.getElementById('announcementAuthor');
    const announcementText = document.getElementById('announcementText');
    const announcementActions = document.getElementById('announcementActions');
    const announcementCloseBanner = document.getElementById('announcementCloseBanner');
    const voteBtn = document.getElementById('voteBtn');
    const votePanel = document.getElementById('votePanel');
    const voteClose = document.getElementById('voteClose');
    const voteTitleInput = document.getElementById('voteTitleInput');
    const voteOptions = document.getElementById('voteOptions');
    const addVoteOptionBtn = document.getElementById('addVoteOptionBtn');
    const voteMultiSelect = document.getElementById('voteMultiSelect');
    const voteDeadlineInput = document.getElementById('voteDeadlineInput');
    const voteCreateBtn = document.getElementById('voteCreateBtn');
    const voteList = document.getElementById('voteList');
    const userProfileCard = document.getElementById('userProfileCard');
    const profileCardClose = document.getElementById('profileCardClose');
    const profileCardAvatar = document.getElementById('profileCardAvatar');
    const profileCardName = document.getElementById('profileCardName');
    const profileCardStatus = document.getElementById('profileCardStatus');
    const profileMsgCount = document.getElementById('profileMsgCount');
    const profileJoinTime = document.getElementById('profileJoinTime');
    const profileLastOnline = document.getElementById('profileLastOnline');
    const profilePrivateChatBtn = document.getElementById('profilePrivateChatBtn');
    const profileBlockBtn = document.getElementById('profileBlockBtn');
    const tagSelector = document.getElementById('tagSelector');
    const tagSelectorOptions = document.getElementById('tagSelectorOptions');
    const tagCustomInput = document.getElementById('tagCustomInput');
    const tagCustomAddBtn = document.getElementById('tagCustomAddBtn');
    const tagFilterBtn = document.getElementById('tagFilterBtn');
    const tagFilterPanel = document.getElementById('tagFilterPanel');
    const tagFilterOptions = document.getElementById('tagFilterOptions');

    let newAvatarUrl = '';
    let editingMessageId = null;
    let forwardingMessageId = null;
    let starredMessages = [];
    let quickReplies = [];
    let customBackground = '';
    let blockedUsers = [];
    let activeReactionMessageId = null;
    let pendingFile = null;
    let pinnedMessages = {};
    let currentCall = null;
    let callTimer = null;
    let callSeconds = 0;
    let peerConnection = null;
    let localStream = null;
    let remoteStream = null;
    let audioContext = null;
    let analyser = null;
    let audioLevel = 0;
    let videoContainer = null;
    let localVideo = null;
    let remoteVideo = null;
    let audioToggleBtn = null;
    let videoToggleBtn = null;
    let volumeIndicator = null;
    let callVideoWindow = null;
    let audioEnabled = true;
    let videoEnabled = true;
    let iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];

    let rooms = {};
    let onlineUsers = [];
    let allMessages = [];
    let reminders = [];
    let soundEnabled = true;
    let currentSoundType = 'chime';
    let onlineStartTime = null;
    let onlineTimerInterval = null;
    let currentQuickReplyIndex = -1;
    let notificationPermission = false;
    let announcements = [];
    let currentAnnouncement = null;
    let votes = [];
    let currentVoteOption = null;
    let currentTagMessageId = null;
    let customTags = [];
    let currentTagFilter = 'all';
    let profileTargetUser = null;
    let userJoinTimes = {};

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

    function toggleSettings() {
        settingsPanel.classList.toggle('active');
        if (settingsPanel.classList.contains('active')) {
            updateAvatarPreview();
            nicknameInput.value = currentUsername;
        }
    }

    settingsBtn.addEventListener('click', toggleSettings);

    settingsClose.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });

    function updateAvatarPreview() {
        if (currentAvatar && !currentAvatar.startsWith('#')) {
            avatarPreview.innerHTML = '<img src="' + currentAvatar + '" alt="头像">';
        } else {
            avatarPreview.textContent = (currentUsername.charAt(0) || '?').toUpperCase();
            avatarPreview.style.backgroundColor = currentAvatar || generateAvatarColor(currentUsername);
        }
    }

    avatarUploadBtn.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', async function() {
        const file = avatarInput.files[0];
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
                newAvatarUrl = data.url;
                updateAvatarPreview();
            }
        } catch (error) {
            console.error('头像上传失败:', error);
            alert('头像上传失败');
        }

        avatarInput.value = '';
    });

    settingsSaveBtn.addEventListener('click', () => {
        const newNickname = nicknameInput.value.trim();
        
        if (newNickname && newNickname !== currentUsername) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'updateProfile',
                    newUsername: newNickname,
                    newAvatar: newAvatarUrl
                }));
            }
            
            const oldUsername = currentUsername;
            currentUsername = newNickname;
            
            allMessages.forEach(msg => {
                if (msg.username === oldUsername) {
                    msg.username = newNickname;
                }
            });
            
            if (newAvatarUrl) {
                currentAvatar = newAvatarUrl;
            }
            
            refreshMessages();
            updateAvatarPreview();
            
            alert('设置已保存！');
            settingsPanel.classList.remove('active');
        } else if (!newNickname) {
            alert('请输入昵称');
        } else {
            if (newAvatarUrl) {
                currentAvatar = newAvatarUrl;
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'updateProfile',
                        newUsername: currentUsername,
                        newAvatar: newAvatarUrl
                    }));
                }
                updateAvatarPreview();
                alert('头像已更新！');
                settingsPanel.classList.remove('active');
            } else {
                alert('没有修改任何设置');
            }
        }
        
        newAvatarUrl = '';
    });

    function refreshMessages() {
        messagesArea.innerHTML = '';
        allMessages.forEach(msg => {
            addMessage(msg);
        });
        scrollToBottom();
    }

    function showReactionSelector(messageId, targetElement) {
        activeReactionMessageId = messageId;
        const rect = targetElement.getBoundingClientRect();
        const messagesRect = messagesArea.getBoundingClientRect();
        
        reactionSelector.style.left = (rect.left - messagesRect.left) + 'px';
        reactionSelector.style.top = 'auto';
        reactionSelector.style.bottom = '80px';
        reactionSelector.classList.add('active');
    }

    document.querySelectorAll('.reaction-selector-item').forEach(item => {
        item.addEventListener('click', () => {
            const emoji = item.dataset.emoji;
            if (activeReactionMessageId && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'addReaction',
                    messageId: activeReactionMessageId,
                    emoji: emoji,
                    username: currentUsername
                }));

                const messageEl = messagesArea.querySelector('[data-message-id="' + activeReactionMessageId + '"]');
                if (messageEl) {
                    animateReaction(messageEl, emoji);
                }

                reactionSelector.classList.remove('active');
                activeReactionMessageId = null;
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!reactionSelector.contains(e.target) && !e.target.classList.contains('react')) {
            reactionSelector.classList.remove('active');
            activeReactionMessageId = null;
        }
    });

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

    searchInput.addEventListener('input', performSearch);
    searchFilterUser.addEventListener('change', performSearch);
    searchFilterStarred.addEventListener('change', performSearch);

    function updateSearchFilterUsers() {
        if (!searchFilterUser) return;
        searchFilterUser.innerHTML = '<option value="">全部用户</option>';
        const usernames = new Set();
        allMessages.forEach(msg => {
            if (msg.username) {
                usernames.add(msg.username);
            }
        });
        usernames.forEach(username => {
            const option = document.createElement('option');
            option.value = username;
            option.textContent = username;
            searchFilterUser.appendChild(option);
        });
    }

    searchBtn.addEventListener('click', () => {
        toggleSearch();
        if (searchPanel.classList.contains('active')) {
            updateSearchFilterUsers();
        }
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
            initExtraFeatures();
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
                userJoinTimes[currentUsername] = formatTime(new Date());
                if (data.rooms) {
                    updateRoomList(data.rooms);
                }
                if (data.messages) {
                    data.messages.forEach(msg => {
                        if (msg.username && !userJoinTimes[msg.username]) {
                            userJoinTimes[msg.username] = msg.timestamp || formatTime(new Date());
                        }
                        allMessages.push(msg);
                        addMessage(msg);
                    });
                }
                if (data.announcements) {
                    announcements = data.announcements;
                    if (announcements.length > 0) {
                        showAnnouncementBanner(announcements[announcements.length - 1]);
                    }
                }
                if (data.votes) {
                    votes = data.votes;
                }
                scrollToBottom();
                break;
            case 'message':
                allMessages.push(data);
                addMessage(data);
                if (data.username !== currentUsername) {
                    playSound(currentSoundType);
                }
                updateStats();
                scrollToBottom();
                break;
            case 'imageMessage':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'fileMessage':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'privateMessage':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'privateFileMessage':
                allMessages.push(data);
                addMessage(data);
                scrollToBottom();
                break;
            case 'locationMessage':
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
                if (data.announcements) {
                    announcements = data.announcements;
                    if (announcements.length > 0) {
                        showAnnouncementBanner(announcements[announcements.length - 1]);
                    } else {
                        announcementBanner.classList.remove('active');
                    }
                } else {
                    announcementBanner.classList.remove('active');
                }
                if (data.votes) {
                    votes = data.votes;
                } else {
                    votes = [];
                }
                updateRoomList(Object.keys(rooms));
                scrollToBottom();
                break;
            case 'reactionAdded':
                updateMessageReactions(data.messageId, data.reactions);
                break;
            case 'pinMessage':
                handlePinMessage(data);
                break;
            case 'unpinMessage':
                handleUnpinMessage(data);
                break;
            case 'pinnedMessages':
                handlePinnedMessages(data);
                break;
            case 'callOffer':
                handleIncomingCall(data);
                break;
            case 'callAnswer':
                handleCallAnswer(data);
                break;
            case 'callReject':
                handleCallRejected(data);
                break;
            case 'callEnd':
                handleCallEnded(data);
                break;
            case 'webrtcOffer':
                handleWebRTCOffer(data);
                break;
            case 'webrtcAnswer':
                handleWebRTCAnswer(data);
                break;
            case 'webrtcIceCandidate':
                handleWebRTCIceCandidate(data);
                break;
            case 'announcements':
            case 'newAnnouncement':
            case 'updateAnnouncement':
            case 'deleteAnnouncement':
                handleAnnouncement(data);
                break;
            case 'votes':
            case 'newVote':
            case 'updateVote':
                handleVote(data);
                break;
        }
    }

    function handlePinMessage(data) {
        const messageId = data.messageId;
        pinnedMessages[messageId] = {
            content: data.content,
            username: data.username
        };

        const msgIndex = allMessages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            allMessages[msgIndex].pinned = true;
        }

        const msgElement = messagesArea.querySelector('[data-message-id="' + messageId + '"]');
        if (msgElement) {
            msgElement.classList.add('pinned');
            const pinBtn = msgElement.querySelector('.message-action-btn.pin');
            if (pinBtn) {
                pinBtn.textContent = '取消置顶';
            }
        }

        updatePinnedMessagesBar();
    }

    function handleUnpinMessage(data) {
        const messageId = data.messageId;
        delete pinnedMessages[messageId];

        const msgIndex = allMessages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            allMessages[msgIndex].pinned = false;
        }

        const msgElement = messagesArea.querySelector('[data-message-id="' + messageId + '"]');
        if (msgElement) {
            msgElement.classList.remove('pinned');
            const pinBtn = msgElement.querySelector('.message-action-btn.pin');
            if (pinBtn) {
                pinBtn.textContent = '置顶';
            }
        }

        updatePinnedMessagesBar();
    }

    function handlePinnedMessages(data) {
        if (data.pinnedMessages) {
            pinnedMessages = data.pinnedMessages;
            updatePinnedMessagesBar();

            Object.keys(pinnedMessages).forEach(id => {
                const msgElement = messagesArea.querySelector('[data-message-id="' + id + '"]');
                if (msgElement) {
                    msgElement.classList.add('pinned');
                    const pinBtn = msgElement.querySelector('.message-action-btn.pin');
                    if (pinBtn) {
                        pinBtn.textContent = '取消置顶';
                    }
                }
            });
        }
    }

    // ========== 通话事件处理 ==========
    function handleIncomingCall(data) {
        if (currentCall) {
            ws.send(JSON.stringify({
                type: 'callReject',
                toUser: data.from,
                callId: data.callId
            }));
            return;
        }

        currentCall = {
            from: data.from,
            callId: data.callId,
            type: data.callType,
            status: 'incoming'
        };

        incomingCallAvatar.textContent = (data.from.charAt(0) || '?').toUpperCase();
        incomingCallAvatar.style.backgroundColor = data.avatar || generateAvatarColor(data.from);
        incomingCallText.textContent = data.from;
        incomingCallType.textContent = data.callType === 'video' ? '视频通话' : '语音通话';
        incomingCallModal.classList.add('active');
    }

    function handleCallAnswer(data) {
        if (currentCall && currentCall.target === data.from) {
            currentCall.status = 'connected';
            activeCallBar.classList.add('active');
            startCallTimer();
        }
    }

    function handleCallRejected(data) {
        if (currentCall) {
            alert(data.from + ' 拒绝了通话');
            endCurrentCall();
        }
    }

    function handleCallEnded(data) {
        if (currentCall) {
            alert('通话已结束');
            endCurrentCall();
        }
    }

    function updateMessageReactions(messageId, reactions) {
        const messageEl = messagesArea.querySelector('[data-message-id="' + messageId + '"]');
        if (!messageEl) return;

        let reactionsDiv = messageEl.querySelector('.message-reactions');
        if (!reactionsDiv) {
            reactionsDiv = document.createElement('div');
            reactionsDiv.className = 'message-reactions';
            messageEl.appendChild(reactionsDiv);
        }

        reactionsDiv.innerHTML = '';

        const reactionGroups = {};
        Object.keys(reactions).forEach(username => {
            const emoji = reactions[username];
            if (!reactionGroups[emoji]) {
                reactionGroups[emoji] = [];
            }
            reactionGroups[emoji].push(username);
        });

        Object.keys(reactionGroups).forEach(emoji => {
            const users = reactionGroups[emoji];
            const reaction = document.createElement('div');
            reaction.className = 'message-reaction';
            reaction.innerHTML = '<span class="reaction-emoji">' + emoji + '</span><span class="reaction-count">' + users.length + '</span>';
            reaction.title = users.join(', ');

            reaction.onclick = (e) => {
                e.stopPropagation();
            };

            reactionsDiv.appendChild(reaction);
        });

        const msgIndex = allMessages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            allMessages[msgIndex].reactions = reactions;
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

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        if (data.avatar && !data.avatar.startsWith('#')) {
            const img = document.createElement('img');
            img.src = data.avatar;
            img.alt = data.username;
            avatarDiv.appendChild(img);
        } else {
            avatarDiv.textContent = (data.username.charAt(0) || '?').toUpperCase();
            avatarDiv.style.backgroundColor = data.avatar || generateAvatarColor(data.username);
        }

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
        } else if ((data.type === 'fileMessage' || data.type === 'privateFileMessage') && data.fileUrl) {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'message-file';
            fileDiv.onclick = () => window.open(data.fileUrl, '_blank');

            const fileIcon = document.createElement('span');
            fileIcon.className = 'message-file-icon';
            fileIcon.textContent = '📄';

            const fileInfo = document.createElement('div');
            fileInfo.className = 'message-file-info';

            const fileName = document.createElement('div');
            fileName.className = 'message-file-name';
            fileName.textContent = data.fileName;

            const fileSize = document.createElement('div');
            fileSize.className = 'message-file-size';
            fileSize.textContent = formatFileSize(data.fileSize);

            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileSize);

            fileDiv.appendChild(fileIcon);
            fileDiv.appendChild(fileInfo);

            bubble.innerHTML = content;
            bubble.appendChild(fileDiv);
        } else if ((data.type === 'locationMessage') && data.latitude && data.longitude) {
            bubble.innerHTML = content;

            const locationDiv = document.createElement('div');
            locationDiv.className = 'message-location';
            locationDiv.onclick = () => {
                window.open('https://uri.amap.com/marker?position=' + data.longitude + ',' + data.latitude + '&name=位置&coordinate=wgs84&callnative=0', '_blank');
            };

            const mapDiv = document.createElement('div');
            mapDiv.className = 'message-location-map';
            mapDiv.innerHTML = '<img src="https://restapi.amap.com/v3/staticmap?location=' + data.longitude + ',' + data.latitude + '&zoom=15&size=300x150&markers=mid,0xFF0000,A:' + data.longitude + ',' + data.latitude + '&key=your-amap-key" alt="位置地图" onerror="this.parentElement.innerHTML=\'📍\'">';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'message-location-info';
            infoDiv.innerHTML = '<span>📍</span> ' + data.latitude.toFixed(4) + ', ' + data.longitude.toFixed(4);

            locationDiv.appendChild(mapDiv);
            locationDiv.appendChild(infoDiv);
            bubble.appendChild(locationDiv);
        } else {
            bubble.innerHTML = content;
        }

        const info = document.createElement('div');
        info.className = 'message-info';

        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'message-username';
        usernameSpan.dataset.username = data.username;
        usernameSpan.textContent = data.username;
        info.appendChild(usernameSpan);

        const timestampSpan = document.createElement('span');
        timestampSpan.textContent = ' ' + data.timestamp;
        info.appendChild(timestampSpan);

        if (data.edited) {
            const editedSpan = document.createElement('span');
            editedSpan.textContent = ' (已编辑)';
            info.appendChild(editedSpan);
        }

        if (data.isPrivate) {
            const privateBadge = document.createElement('span');
            privateBadge.className = 'private-badge';
            privateBadge.textContent = '私';
            info.appendChild(privateBadge);
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

            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn edit';
            editBtn.textContent = '编辑';
            editBtn.onclick = () => startEditMessage(data.id);
            actions.appendChild(editBtn);

            const forwardBtn = document.createElement('button');
            forwardBtn.className = 'message-action-btn forward';
            forwardBtn.textContent = '转发';
            forwardBtn.onclick = () => showForwardPanel(data.id);
            actions.appendChild(forwardBtn);

            const starBtn = document.createElement('button');
            starBtn.className = 'message-action-btn star';
            starBtn.textContent = isStarred(data.id) ? '★' : '☆';
            starBtn.onclick = () => toggleStarMessage(data.id);
            actions.appendChild(starBtn);

            const recallBtn = document.createElement('button');
            recallBtn.className = 'message-action-btn recall';
            recallBtn.textContent = '撤回';
            recallBtn.onclick = () => recallMessage(data.id);
            actions.appendChild(recallBtn);

            const reactBtn = document.createElement('button');
            reactBtn.className = 'message-action-btn react';
            reactBtn.textContent = '反应';
            reactBtn.onclick = (e) => {
                showReactionSelector(data.id, e.target);
            };
            actions.appendChild(reactBtn);

            const tagBtn = document.createElement('button');
            tagBtn.className = 'message-action-btn tag';
            tagBtn.textContent = '标签';
            tagBtn.onclick = (e) => {
                e.stopPropagation();
                showTagSelector(data.id, e.target);
            };
            actions.appendChild(tagBtn);

            const translateBtn = document.createElement('button');
            translateBtn.className = 'message-action-btn translate';
            translateBtn.textContent = '翻译';
            translateBtn.onclick = () => {
                translateMessage(data.id, data.content);
            };
            actions.appendChild(translateBtn);

            if (!data.isPrivate) {
                const pinBtn = document.createElement('button');
                pinBtn.className = 'message-action-btn pin';
                pinBtn.textContent = data.pinned ? '取消置顶' : '置顶';
                pinBtn.onclick = () => {
                    togglePinMessage(data.id, data.content, data.username);
                };
                actions.appendChild(pinBtn);
            }

            info.appendChild(actions);

            if (!data.isPrivate) {
                const readStatus = document.createElement('span');
                readStatus.className = 'read-status';
                readStatus.id = 'read-' + data.id;

                if (data.reads && Object.keys(data.reads).length > 0) {
                    const readCount = Object.keys(data.reads).length;
                    readStatus.textContent = '已读 ' + readCount + ' 人';
                    readStatus.classList.add('read');
                    readStatus.onclick = () => showReadList(data.id, data.reads);
                } else {
                    readStatus.textContent = '未读';
                }

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

            const forwardBtn = document.createElement('button');
            forwardBtn.className = 'message-action-btn forward';
            forwardBtn.textContent = '转发';
            forwardBtn.onclick = () => showForwardPanel(data.id);
            actions.appendChild(forwardBtn);

            const starBtn = document.createElement('button');
            starBtn.className = 'message-action-btn star';
            starBtn.textContent = isStarred(data.id) ? '★' : '☆';
            starBtn.onclick = () => toggleStarMessage(data.id);
            actions.appendChild(starBtn);

            const blockBtn = document.createElement('button');
            blockBtn.className = 'message-action-btn block';
            blockBtn.textContent = blockedUsers.includes(data.username) ? '取消拉黑' : '拉黑';
            blockBtn.onclick = () => toggleBlockUser(data.username);
            actions.appendChild(blockBtn);

            const reactBtn = document.createElement('button');
            reactBtn.className = 'message-action-btn react';
            reactBtn.textContent = '反应';
            reactBtn.onclick = (e) => {
                showReactionSelector(data.id, e.target);
            };
            actions.appendChild(reactBtn);

            const tagBtn = document.createElement('button');
            tagBtn.className = 'message-action-btn tag';
            tagBtn.textContent = '标签';
            tagBtn.onclick = (e) => {
                e.stopPropagation();
                showTagSelector(data.id, e.target);
            };
            actions.appendChild(tagBtn);

            const translateBtn = document.createElement('button');
            translateBtn.className = 'message-action-btn translate';
            translateBtn.textContent = '翻译';
            translateBtn.onclick = () => {
                translateMessage(data.id, data.content);
            };
            actions.appendChild(translateBtn);

            if (!data.isPrivate) {
                const pinBtn = document.createElement('button');
                pinBtn.className = 'message-action-btn pin';
                pinBtn.textContent = data.pinned ? '取消置顶' : '置顶';
                pinBtn.onclick = () => {
                    togglePinMessage(data.id, data.content, data.username);
                };
                actions.appendChild(pinBtn);
            }

            info.appendChild(actions);
        }

        if (data.pinned) {
            messageDiv.classList.add('pinned');
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(info);
        messagesArea.appendChild(messageDiv);

        if (data.reactions && Object.keys(data.reactions).length > 0) {
            updateMessageReactions(data.id, data.reactions);
        }

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
            animateRecall(messageEl);
        }

        const msgIndex = allMessages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            allMessages.splice(msgIndex, 1);
        }
    }

    function updateMessageReadStatus(messageId, reader) {
        const readStatus = document.getElementById('read-' + messageId);
        if (readStatus) {
            const msgIndex = allMessages.findIndex(m => m.id === messageId);
            if (msgIndex !== -1) {
                allMessages[msgIndex].reads = allMessages[msgIndex].reads || {};
                allMessages[msgIndex].reads[reader] = true;
                const readCount = Object.keys(allMessages[msgIndex].reads).length;
                readStatus.textContent = '已读 ' + readCount + ' 人';
                readStatus.classList.add('read');
                readStatus.onclick = () => showReadList(messageId, allMessages[msgIndex].reads);
            }
        }
    }

    function showReadList(messageId, reads) {
        const readStatus = document.getElementById('read-' + messageId);
        if (!readStatus) return;

        const existingList = document.querySelector('.read-users-list');
        if (existingList) {
            existingList.remove();
            return;
        }

        const readers = Object.keys(reads);
        if (readers.length === 0) return;

        const listDiv = document.createElement('div');
        listDiv.className = 'read-users-list';
        listDiv.style.cssText = 'position: absolute; right: 10px; top: -' + (30 + readers.length * 25) + 'px; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; box-shadow: 0 2px 8px var(--shadow-color); z-index: 100; min-width: 150px;';

        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600;';
        titleDiv.textContent = '已读用户 (' + readers.length + ')';
        listDiv.appendChild(titleDiv);

        readers.forEach(reader => {
            const userDiv = document.createElement('div');
            userDiv.style.cssText = 'font-size: 13px; color: var(--text-color); padding: 4px 0; display: flex; align-items: center; gap: 6px;';
            userDiv.innerHTML = '<span style="color: #4CAF50;">✓</span> ' + reader;
            listDiv.appendChild(userDiv);
        });

        readStatus.style.position = 'relative';
        readStatus.appendChild(listDiv);

        setTimeout(() => {
            document.addEventListener('click', function closeList(e) {
                if (!listDiv.contains(e.target) && e.target !== readStatus) {
                    listDiv.remove();
                    document.removeEventListener('click', closeList);
                }
            });
        }, 100);
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

    function togglePinMessage(messageId, content, username) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            if (pinnedMessages[messageId]) {
                ws.send(JSON.stringify({
                    type: 'unpinMessage',
                    messageId: messageId
                }));
            } else {
                ws.send(JSON.stringify({
                    type: 'pinMessage',
                    messageId: messageId,
                    content: content,
                    username: username
                }));
            }
        }
    }

    function updatePinnedMessagesBar() {
        const pinnedIds = Object.keys(pinnedMessages);

        if (pinnedIds.length === 0) {
            pinnedMessagesBar.classList.remove('active');
            return;
        }

        pinnedMessagesBar.classList.add('active');
        pinnedMessagesList.innerHTML = '';

        pinnedIds.forEach(id => {
            const msg = pinnedMessages[id];
            if (!msg) return;

            const item = document.createElement('div');
            item.className = 'pinned-message-item';
            item.innerHTML = '<span>📌</span><span class="pinned-message-preview">' + msg.username + ': ' + msg.content + '</span>';

            item.onclick = () => {
                const msgElement = messagesArea.querySelector('[data-message-id="' + id + '"]');
                if (msgElement) {
                    msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    msgElement.style.background = 'rgba(231, 76, 60, 0.3)';
                    setTimeout(() => {
                        msgElement.style.background = '';
                    }, 2000);
                }
            };

            pinnedMessagesList.appendChild(item);
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

            const blockBtn = document.createElement('button');
            blockBtn.className = 'block-user-btn';
            blockBtn.textContent = blockedUsers.includes(user.username) ? '取消拉黑' : '拉黑';
            blockBtn.onclick = (e) => {
                e.stopPropagation();
                toggleBlockUser(user.username);
            };
            userDiv.appendChild(blockBtn);

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

        let finalContent = content;

        if (shouldTriggerAI(content)) {
            processAIRequest(content, (response) => {
                if (response) {
                    addAIMessage(response);
                }
            });
        }

        if (isPrivateMode && encryptionEnabled && privateTarget) {
            finalContent = encryptMessage(content);
            const messageData = {
                type: 'privateMessage',
                content: finalContent,
                timestamp: timestamp,
                isEncrypted: true
            };

            if (replyingTo) {
                messageData.replyTo = replyingTo;
                clearReply();
            }

            messageData.toUser = privateTarget;
            ws.send(JSON.stringify(messageData));
        } else {
            const messageData = {
                type: isPrivateMode && privateTarget ? 'privateMessage' : 'message',
                content: finalContent,
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
        }

        ws.send(JSON.stringify({
            type: 'stopTyping',
            username: currentUsername
        }));

        learnFromMessage(content);

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

    function detectLanguage(text) {
        const chineseRegex = /[\u4e00-\u9fa5]/;
        const koreanRegex = /[\uAC00-\uD7AF]/;
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
        const arabicRegex = /[\u0600-\u06FF]/;
        const russianRegex = /[\u0400-\u04FF]/;

        if (chineseRegex.test(text)) return 'zh';
        if (koreanRegex.test(text)) return 'ko';
        if (japaneseRegex.test(text)) return 'ja';
        if (arabicRegex.test(text)) return 'ar';
        if (russianRegex.test(text)) return 'ru';
        return 'en';
    }

    function simpleTranslate(text, fromLang) {
        const translations = {
            'zh': {
                '你好': 'Hello',
                '谢谢': 'Thank you',
                '早上好': 'Good morning',
                '晚上好': 'Good evening',
                '再见': 'Goodbye',
                '对不起': 'I\'m sorry',
                '我爱你': 'I love you',
                '很高兴见到你': 'Nice to meet you',
                '请问': 'May I ask',
                '多少钱': 'How much'
            },
            'en': {
                'hello': '你好',
                'thank you': '谢谢',
                'good morning': '早上好',
                'good evening': '晚上好',
                'goodbye': '再见',
                'i\'m sorry': '对不起',
                'i love you': '我爱你',
                'nice to meet you': '很高兴见到你'
            }
        };

        const lowerText = text.toLowerCase().trim();

        if (fromLang === 'zh' && translations['zh'][lowerText]) {
            return translations['zh'][lowerText];
        }

        if (fromLang === 'en' && translations['en'][lowerText]) {
            return translations['en'][lowerText];
        }

        return null;
    }

    function translateMessage(messageId, content) {
        if (!content) return;

        const messageEl = messagesArea.querySelector('[data-message-id="' + messageId + '"]');
        if (!messageEl) return;

        let existingTranslation = messageEl.querySelector('.message-translation');
        if (existingTranslation) {
            existingTranslation.remove();
            return;
        }

        const fromLang = detectLanguage(content);
        let translatedText = '';

        const simpleTrans = simpleTranslate(content, fromLang);
        if (simpleTrans) {
            translatedText = simpleTrans;
        } else {
            const targetLang = fromLang === 'zh' ? 'English' : '中文';
            translatedText = `[模拟翻译 - ${targetLang}]\n${content}`;
        }

        const translationDiv = document.createElement('div');
        translationDiv.className = 'message-translation';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'message-translation-label';
        labelDiv.textContent = fromLang === 'zh' ? '英文翻译' : '中文翻译';

        const textDiv = document.createElement('div');
        textDiv.textContent = translatedText;

        translationDiv.appendChild(labelDiv);
        translationDiv.appendChild(textDiv);

        messageEl.appendChild(translationDiv);
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function scrollToBottom() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    fileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        pendingFile = file;
        filePreviewName.textContent = file.name;
        filePreview.classList.add('active');
        filePreviewProgressBar.style.width = '0%';

        uploadAndSendFile(file);
    });

    filePreviewClose.addEventListener('click', () => {
        filePreview.classList.remove('active');
        pendingFile = null;
        fileInput.value = '';
    });

    async function uploadAndSendFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    filePreviewProgressBar.style.width = percent + '%';
                }
            });

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    if (data.url) {
                        sendFileMessage(data.url, file.name, file.size);
                    }
                    filePreview.classList.remove('active');
                    pendingFile = null;
                    fileInput.value = '';
                }
            };

            xhr.onerror = () => {
                console.error('文件上传失败');
                alert('文件上传失败');
                filePreview.classList.remove('active');
                pendingFile = null;
                fileInput.value = '';
            };

            xhr.open('POST', '/api/upload');
            xhr.send(formData);

        } catch (error) {
            console.error('文件上传失败:', error);
            alert('文件上传失败');
            filePreview.classList.remove('active');
            pendingFile = null;
            fileInput.value = '';
        }
    }

    function sendFileMessage(fileUrl, fileName, fileSize) {
        const now = new Date();
        const timestamp = formatTime(now);

        const messageData = {
            type: 'fileMessage',
            fileUrl: fileUrl,
            fileName: fileName,
            fileSize: fileSize,
            timestamp: timestamp
        };

        if (replyingTo) {
            messageData.replyTo = replyingTo;
            clearReply();
        }

        if (isPrivateMode && privateTarget) {
            messageData.type = 'privateFileMessage';
            messageData.toUser = privateTarget;
            messageData.content = '[文件] ' + fileName;
        }

        ws.send(JSON.stringify(messageData));
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ========== 位置共享功能 ==========
    locationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('你的浏览器不支持位置共享功能');
            return;
        }

        locationBtn.textContent = '⏳';
        locationBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                if (ws && ws.readyState === WebSocket.OPEN) {
                    const now = new Date();
                    const timestamp = formatTime(now);

                    const messageData = {
                        type: 'locationMessage',
                        content: '[位置共享]',
                        latitude: latitude,
                        longitude: longitude,
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
                }

                locationBtn.textContent = '📍';
                locationBtn.disabled = false;
            },
            (error) => {
                console.error('获取位置失败:', error);
                let errorMsg = '获取位置失败';
                switch (error.code) {
                    case 1: errorMsg = '用户拒绝了位置请求'; break;
                    case 2: errorMsg = '位置信息不可用'; break;
                    case 3: errorMsg = '获取位置超时'; break;
                }
                alert(errorMsg);
                locationBtn.textContent = '📍';
                locationBtn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });

    // ========== 通话功能 ==========
    callBtn.addEventListener('click', () => {
        callPanel.classList.toggle('active');
        if (callPanel.classList.contains('active')) {
            renderCallUsers();
        }
    });

    callClose.addEventListener('click', () => {
        callPanel.classList.remove('active');
    });

    function renderCallUsers() {
        callUsers.innerHTML = '';
        onlineUsers.forEach(user => {
            if (!user || !user.username || user.username === currentUsername) return;

            const userDiv = document.createElement('div');
            userDiv.className = 'call-user';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'call-user-info';

            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar';
            avatarDiv.style.backgroundColor = user.avatar || generateAvatarColor(user.username);
            avatarDiv.textContent = (user.username.charAt(0) || '?').toUpperCase();

            const nameSpan = document.createElement('span');
            nameSpan.className = 'call-user-name';
            nameSpan.textContent = user.username;

            infoDiv.appendChild(avatarDiv);
            infoDiv.appendChild(nameSpan);

            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'call-buttons';

            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'call-btn voice';
            voiceBtn.textContent = '语音';
            voiceBtn.onclick = () => initiateCall(user.username, 'voice');

            const videoBtn = document.createElement('button');
            videoBtn.className = 'call-btn video';
            videoBtn.textContent = '视频';
            videoBtn.onclick = () => initiateCall(user.username, 'video');

            buttonsDiv.appendChild(voiceBtn);
            buttonsDiv.appendChild(videoBtn);

            userDiv.appendChild(infoDiv);
            userDiv.appendChild(buttonsDiv);
            callUsers.appendChild(userDiv);
        });

        if (callUsers.children.length === 0) {
            callUsers.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">暂无其他在线用户</div>';
        }
    }

    function initiateCall(targetUser, callType) {
        if (currentCall) {
            alert('你正在通话中，请先结束当前通话');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'callOffer',
                toUser: targetUser,
                callType: callType
            }));

            currentCall = { target: targetUser, type: callType, status: 'calling' };
            callPanel.classList.remove('active');

            activeCallBar.classList.add('active');
            activeCallStatus.textContent = '正在呼叫 ' + targetUser + '...';
        }
    }

    acceptCallBtn.addEventListener('click', () => {
        acceptCall();
    });

    rejectCallBtn.addEventListener('click', () => {
        rejectCall();
    });

    endCallBtn.addEventListener('click', () => {
        if (ws && ws.readyState === WebSocket.OPEN && currentCall) {
            const target = currentCall.target || currentCall.from;
            ws.send(JSON.stringify({
                type: 'callEnd',
                toUser: target
            }));
        }
        endCurrentCall();
    });

    function endCurrentCall() {
        currentCall = null;
        activeCallBar.classList.remove('active');
        incomingCallModal.classList.remove('active');
        if (callTimer) {
            clearInterval(callTimer);
            callTimer = null;
        }
        callSeconds = 0;
    }

    function startCallTimer() {
        callSeconds = 0;
        if (callTimer) clearInterval(callTimer);
        callTimer = setInterval(() => {
            callSeconds++;
            const min = Math.floor(callSeconds / 60);
            const sec = callSeconds % 60;
            const target = currentCall ? (currentCall.target || currentCall.from) : '';
            activeCallStatus.textContent = '与 ' + target + ' 通话中 ' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
        }, 1000);
    }

    function initExtraFeatures() {
        loadExtraFeaturesFromStorage();
        bindExtraFeatureEvents();
        applyCustomBackground();
        renderQuickReplies();
        initStats();
        initReminders();
        initSoundSettings();
        initKeyboardShortcuts();
        startOnlineTimer();
    }

    // ========== 消息统计功能 ==========
    function initStats() {
        statsBtn.addEventListener('click', () => {
            statsPanel.classList.toggle('active');
            if (statsPanel.classList.contains('active')) {
                updateStats();
            }
        });

        statsClose.addEventListener('click', () => {
            statsPanel.classList.remove('active');
        });

        updateStats();
    }

    function updateStats() {
        const today = new Date().toDateString();
        let todayMessages = 0;
        let myMessages = 0;
        let totalLength = 0;
        let messageCount = 0;

        allMessages.forEach(msg => {
            if (msg.timestamp) {
                const msgDate = new Date(msg.timestamp.replace(' ', 'T')).toDateString();
                if (msgDate === today) {
                    todayMessages++;
                }
            }

            if (msg.username === currentUsername) {
                myMessages++;
            }

            if (msg.content) {
                totalLength += msg.content.length;
                messageCount++;
            }
        });

        totalMessagesCount.textContent = allMessages.length;
        todayMessagesCount.textContent = todayMessages;
        yourMessagesCount.textContent = myMessages;
        avgMsgLength.textContent = messageCount > 0 ? Math.round(totalLength / messageCount) : 0;
    }

    function startOnlineTimer() {
        if (!onlineStartTime) {
            onlineStartTime = new Date();
        }

        if (onlineTimerInterval) {
            clearInterval(onlineTimerInterval);
        }

        updateOnlineTimeDisplay();

        onlineTimerInterval = setInterval(() => {
            updateOnlineTimeDisplay();
        }, 1000);
    }

    function updateOnlineTimeDisplay() {
        if (!onlineStartTime) return;

        const now = new Date();
        const diff = Math.floor((now - onlineStartTime) / 1000);

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        onlineTimeValue.textContent = String(hours).padStart(2, '0') + ':' +
                                      String(minutes).padStart(2, '0') + ':' +
                                      String(seconds).padStart(2, '0');
    }

    // ========== 定时提醒功能 ==========
    function initReminders() {
        loadRemindersFromStorage();

        reminderBtn.addEventListener('click', () => {
            reminderPanel.classList.toggle('active');
            if (reminderPanel.classList.contains('active')) {
                renderReminders();
            }
        });

        reminderClose.addEventListener('click', () => {
            reminderPanel.classList.remove('active');
        });

        addReminderBtn.addEventListener('click', addReminder);

        reminderContentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addReminder();
        });

        checkReminders();
    }

    function loadRemindersFromStorage() {
        const saved = localStorage.getItem('chatReminders');
        if (saved) {
            reminders = JSON.parse(saved);
            reminders = reminders.filter(r => !r.completed);
        }
    }

    function saveRemindersToStorage() {
        localStorage.setItem('chatReminders', JSON.stringify(reminders));
    }

    function addReminder() {
        const time = reminderTimeInput.value;
        const content = reminderContentInput.value.trim();

        if (!time) {
            alert('请选择提醒时间');
            return;
        }

        if (!content) {
            alert('请输入提醒内容');
            return;
        }

        const reminder = {
            id: Date.now(),
            time: time,
            content: content,
            completed: false
        };

        reminders.push(reminder);
        saveRemindersToStorage();
        renderReminders();

        reminderTimeInput.value = '';
        reminderContentInput.value = '';
    }

    function renderReminders() {
        reminderList.innerHTML = '';

        if (reminders.length === 0) {
            reminderList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">暂无提醒</div>';
            return;
        }

        reminders.forEach(reminder => {
            const item = document.createElement('div');
            item.className = 'reminder-item';
            item.innerHTML = `
                <div class="reminder-info">
                    <div class="reminder-time">${reminder.time}</div>
                    <div class="reminder-content">${reminder.content}</div>
                </div>
                <button class="reminder-delete" data-id="${reminder.id}">×</button>
            `;

            item.querySelector('.reminder-delete').addEventListener('click', () => {
                deleteReminder(reminder.id);
            });

            reminderList.appendChild(item);
        });
    }

    function deleteReminder(id) {
        reminders = reminders.filter(r => r.id !== id);
        saveRemindersToStorage();
        renderReminders();
    }

    function checkReminders() {
        setInterval(() => {
            const now = new Date();
            const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

            reminders.forEach(reminder => {
                if (reminder.time === currentTime && !reminder.completed) {
                    triggerReminder(reminder);
                    reminder.completed = true;
                    saveRemindersToStorage();
                }
            });
        }, 1000);
    }

    function triggerReminder(reminder) {
        if (soundEnabled) {
            playSound('bell');
        }

        if (notificationPermission) {
            sendNotification('⏰ 定时提醒', reminder.content);
        }

        alert('⏰ 提醒：' + reminder.content);
    }

    // ========== 消息提醒声音 ==========
    function initSoundSettings() {
        loadSoundSettings();

        soundToggle.addEventListener('change', () => {
            soundEnabled = soundToggle.checked;
            saveSoundSettings();
        });

        soundTypeSelect.addEventListener('change', () => {
            currentSoundType = soundTypeSelect.value;
            saveSoundSettings();
            playSound(currentSoundType);
        });
    }

    function loadSoundSettings() {
        const saved = localStorage.getItem('chatSoundSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            soundEnabled = settings.enabled !== false;
            currentSoundType = settings.type || 'chime';

            if (soundToggle) soundToggle.checked = soundEnabled;
            if (soundTypeSelect) soundTypeSelect.value = currentSoundType;
        }
    }

    function saveSoundSettings() {
        localStorage.setItem('chatSoundSettings', JSON.stringify({
            enabled: soundEnabled,
            type: currentSoundType
        }));
    }

    function playSound(type) {
        if (!soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch(type) {
                case 'chime':
                    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                    break;

                case 'ding':
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;

                case 'pop':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;

                case 'bell':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                    break;
            }
        } catch (error) {
            console.error('播放声音失败:', error);
        }
    }

    // ========== 快捷键支持 ==========
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }

            if (e.key === 'Escape') {
                closeAllPanels();
            }

            if (e.key === '/' && document.activeElement !== messageInput && document.activeElement !== searchInput) {
                e.preventDefault();
                toggleSearch();
            }

            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                toggleSettings();
            }

            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                toggleShortcutsHint();
            }

            if (e.key === 'ArrowUp' && quickReplyPanel.classList.contains('active')) {
                e.preventDefault();
                navigateQuickReplies(-1);
            }

            if (e.key === 'ArrowDown' && quickReplyPanel.classList.contains('active')) {
                e.preventDefault();
                navigateQuickReplies(1);
            }
        });
    }

    function closeAllPanels() {
        settingsPanel.classList.remove('active');
        searchPanel.classList.remove('active');
        statsPanel.classList.remove('active');
        reminderPanel.classList.remove('active');
        quickReplyPanel.classList.remove('active');
        starredPanel.classList.remove('active');
        backgroundPanel.classList.remove('active');
        blockedPanel.classList.remove('active');
        shortcutsHint.classList.remove('active');
        announcementPanel.classList.remove('active');
        votePanel.classList.remove('active');
        tagFilterPanel.classList.remove('active');
        tagSelector.classList.remove('active');
        userProfileCard.classList.remove('active');
    }

    function toggleShortcutsHint() {
        shortcutsHint.classList.toggle('active');
        if (shortcutsHint.classList.contains('active')) {
            setTimeout(() => {
                shortcutsHint.classList.remove('active');
            }, 3000);
        }
    }

    function navigateQuickReplies(direction) {
        if (quickReplies.length === 0) return;

        const items = quickReplyList.querySelectorAll('.quick-reply-item');
        if (items.length === 0) return;

        items.forEach(item => item.classList.remove('selected'));

        currentQuickReplyIndex += direction;

        if (currentQuickReplyIndex < 0) {
            currentQuickReplyIndex = quickReplies.length - 1;
        } else if (currentQuickReplyIndex >= quickReplies.length) {
            currentQuickReplyIndex = 0;
        }

        if (items[currentQuickReplyIndex]) {
            items[currentQuickReplyIndex].classList.add('selected');
            items[currentQuickReplyIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // ========== 消息日期分隔 ==========
    function addDateDivider(dateStr, targetElement) {
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = `
            <div class="date-divider-line"></div>
            <span class="date-divider-text">${dateStr}</span>
            <div class="date-divider-line"></div>
        `;

        divider.querySelector('.date-divider-text').addEventListener('click', () => {
            divider.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        targetElement.appendChild(divider);
    }

    function shouldShowDateDivider(currentMsg, previousMsg) {
        if (!previousMsg || !currentMsg.timestamp || !previousMsg.timestamp) {
            return true;
        }

        try {
            const currentDate = new Date(currentMsg.timestamp.replace(' ', 'T')).toDateString();
            const previousDate = new Date(previousMsg.timestamp.replace(' ', 'T')).toDateString();

            return currentDate !== previousDate;
        } catch (e) {
            return false;
        }
    }

    function getDateDisplayString(timestamp) {
        try {
            const date = new Date(timestamp.replace(' ', 'T'));
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return '今天';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return '昨天';
            } else {
                return (date.getMonth() + 1) + '月' + date.getDate() + '日';
            }
        } catch (e) {
            return '';
        }
    }

    function refreshMessagesWithDateDividers() {
        messagesArea.innerHTML = '';
        let lastDate = null;

        allMessages.forEach((msg, index) => {
            if (isPrivateMode && privateTarget) {
                if (!msg.isPrivate || (msg.toUser !== privateTarget && msg.username !== privateTarget)) {
                    return;
                }
            } else if (msg.isPrivate && msg.toUser !== currentUsername && msg.username !== currentUsername) {
                return;
            }

            if (blockedUsers.includes(msg.username)) {
                return;
            }

            if (shouldShowDateDivider(msg, allMessages[index - 1])) {
                const dateStr = getDateDisplayString(msg.timestamp);
                if (dateStr && dateStr !== lastDate) {
                    addDateDivider(dateStr, messagesArea);
                    lastDate = dateStr;
                }
            }

            addMessage(msg);
        });

        scrollToBottom();
    }

    function loadExtraFeaturesFromStorage() {
        const savedStarred = localStorage.getItem('chatStarredMessages');
        if (savedStarred) starredMessages = JSON.parse(savedStarred);
        
        const savedQuickReplies = localStorage.getItem('chatQuickReplies');
        if (savedQuickReplies) quickReplies = JSON.parse(savedQuickReplies);
        
        const savedBg = localStorage.getItem('chatCustomBg');
        if (savedBg) customBackground = savedBg;
        
        const savedBlocked = localStorage.getItem('chatBlockedUsers');
        if (savedBlocked) blockedUsers = JSON.parse(savedBlocked);
    }

    function bindExtraFeatureEvents() {
        atAllBtn.addEventListener('click', () => {
            messageInput.value += '@all ';
            messageInput.focus();
        });

        quickReplyBtn.addEventListener('click', () => {
            renderQuickReplies();
            quickReplyPanel.classList.add('active');
        });

        quickReplyClose.addEventListener('click', () => {
            quickReplyPanel.classList.remove('active');
        });

        quickReplyAdd.addEventListener('click', addQuickReply);

        quickReplyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addQuickReply();
        });

        forwardClose.addEventListener('click', () => {
            forwardPanel.classList.remove('active');
        });

        starredBtn.addEventListener('click', () => {
            renderStarredMessages();
            starredPanel.classList.add('active');
        });

        starredClose.addEventListener('click', () => {
            starredPanel.classList.remove('active');
        });

        backgroundBtn.addEventListener('click', () => {
            renderBackgroundOptions();
            backgroundPanel.classList.add('active');
        });

        backgroundClose.addEventListener('click', () => {
            backgroundPanel.classList.remove('active');
        });

        bgUploadBtn.addEventListener('click', () => {
            bgUploadInput.click();
        });

        bgUploadInput.addEventListener('change', async function() {
            const file = bgUploadInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.url) {
                    setCustomBackground(data.url);
                }
            } catch (error) {
                console.error('背景上传失败:', error);
                alert('背景上传失败');
            }
        });

        searchFilterUser.addEventListener('change', performSearch);
        searchFilterStarred.addEventListener('change', performSearch);

        exportBtn.addEventListener('click', exportChatHistory);

        blockedClose.addEventListener('click', () => {
            blockedPanel.classList.remove('active');
        });

        initAnnouncementFeature();
        initVoteFeature();
        initProfileCardFeature();
        initTagFeature();
    }

    function addQuickReply() {
        const text = quickReplyInput.value.trim();
        if (text) {
            quickReplies.push(text);
            localStorage.setItem('chatQuickReplies', JSON.stringify(quickReplies));
            quickReplyInput.value = '';
            renderQuickReplies();
        }
    }

    function renderQuickReplies() {
        quickReplyList.innerHTML = '';
        
        if (quickReplies.length === 0) {
            quickReplyList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无快捷回复</div>';
            return;
        }
        
        quickReplies.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'quick-reply-item';
            item.innerHTML = '<span>' + text + '</span><button class="quick-reply-delete">×</button>';
            
            item.querySelector('span').onclick = () => {
                messageInput.value = text;
                quickReplyPanel.classList.remove('active');
                messageInput.focus();
            };
            
            item.querySelector('button').onclick = (e) => {
                e.stopPropagation();
                quickReplies.splice(index, 1);
                localStorage.setItem('chatQuickReplies', JSON.stringify(quickReplies));
                renderQuickReplies();
            };
            
            quickReplyList.appendChild(item);
        });
    }

    function toggleStarMessage(messageId) {
        const msg = allMessages.find(m => m.id === messageId);
        if (!msg) return;
        
        const index = starredMessages.findIndex(id => id === messageId);
        if (index !== -1) {
            starredMessages.splice(index, 1);
        } else {
            starredMessages.push(messageId);
        }
        
        localStorage.setItem('chatStarredMessages', JSON.stringify(starredMessages));
        refreshMessages();
    }

    function isStarred(messageId) {
        return starredMessages.includes(messageId);
    }

    function renderStarredMessages() {
        starredList.innerHTML = '';
        
        const msgs = allMessages.filter(m => starredMessages.includes(m.id));
        
        if (msgs.length === 0) {
            starredList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无星标消息</div>';
            return;
        }
        
        msgs.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'starred-message-item';
            const content = msg.content || (msg.fileName ? '[文件] ' + msg.fileName : '[图片]');
            item.innerHTML = '<strong>' + msg.username + ':</strong> ' + content;
            item.onclick = () => {
                const el = messagesArea.querySelector('[data-message-id="' + msg.id + '"]');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                starredPanel.classList.remove('active');
            };
            starredList.appendChild(item);
        });
    }

    function renderBackgroundOptions() {
        const presets = [
            '',
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];
        
        backgroundOptions.innerHTML = '';
        
        presets.forEach((bg, index) => {
            const option = document.createElement('div');
            option.className = 'bg-option ' + (customBackground === bg ? 'active' : '');
            if (bg) {
                option.style.background = bg;
            } else {
                option.textContent = '默认';
                option.style.background = 'var(--bg-secondary)';
            }
            option.onclick = () => setCustomBackground(bg);
            backgroundOptions.appendChild(option);
        });
    }

    function setCustomBackground(bg) {
        customBackground = bg;
        localStorage.setItem('chatCustomBg', customBackground);
        applyCustomBackground();
        renderBackgroundOptions();
    }

    function applyCustomBackground() {
        if (customBackground && customBackground.startsWith('http')) {
            document.body.style.backgroundImage = 'url("' + customBackground + '")';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        } else if (customBackground) {
            document.body.style.backgroundImage = customBackground;
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
        } else {
            document.body.style.backgroundImage = '';
            document.body.style.backgroundSize = '';
            document.body.style.backgroundPosition = '';
        }
    }

    function startEditMessage(messageId) {
        const msg = allMessages.find(m => m.id === messageId);
        if (!msg || msg.username !== currentUsername) return;
        
        editingMessageId = messageId;
        messageInput.value = msg.content || '';
        messageInput.focus();
        
        const originalSend = sendBtn.textContent;
        sendBtn.textContent = '保存';
        sendBtn.onclick = () => saveEditMessage();
        
        const originalKeypress = messageInput.onkeypress;
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !mentionMode) saveEditMessage();
        };
    }

    function saveEditMessage() {
        if (!editingMessageId) return;
        
        const newContent = messageInput.value.trim();
        if (!newContent) {
            cancelEditMessage();
            return;
        }
        
        const msgIndex = allMessages.findIndex(m => m.id === editingMessageId);
        if (msgIndex !== -1) {
            allMessages[msgIndex].content = newContent;
            allMessages[msgIndex].edited = true;
            refreshMessages();
        }
        
        cancelEditMessage();
    }

    function cancelEditMessage() {
        editingMessageId = null;
        messageInput.value = '';
        sendBtn.textContent = '发送';
        sendBtn.onclick = sendMessage;
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter' && !mentionMode) sendMessage();
        };
    }

    function showForwardPanel(messageId) {
        forwardingMessageId = messageId;
        
        forwardTargetList.innerHTML = '';
        
        Object.keys(rooms).forEach(room => {
            const item = document.createElement('div');
            item.className = 'forward-target-item';
            item.innerHTML = '<span>🏠 ' + room + '</span>';
            item.onclick = () => forwardMessage(room, 'room');
            forwardTargetList.appendChild(item);
        });
        
        onlineUsers.forEach(user => {
            if (!user || user.username === currentUsername) return;
            const item = document.createElement('div');
            item.className = 'forward-target-item';
            item.innerHTML = '<span>👤 ' + user.username + '</span>';
            item.onclick = () => forwardMessage(user.username, 'user');
            forwardTargetList.appendChild(item);
        });
        
        forwardPanel.classList.add('active');
    }

    function forwardMessage(target, type) {
        if (!forwardingMessageId) return;
        
        const msg = allMessages.find(m => m.id === forwardingMessageId);
        if (!msg) return;
        
        const forwardText = '转发自 ' + msg.username + ': ' + (msg.content || '[图片/文件]');
        
        const now = new Date();
        const timestamp = formatTime(now);
        
        const messageData = {
            type: type === 'room' ? 'message' : 'privateMessage',
            content: forwardText,
            timestamp: timestamp
        };
        
        if (type === 'user') {
            messageData.toUser = target;
        } else {
            messageData.room = target;
        }
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageData));
        }
        
        forwardPanel.classList.remove('active');
        forwardingMessageId = null;
    }

    function performSearch() {
        const keyword = searchInput.value.toLowerCase().trim();
        const filterUser = searchFilterUser.value;
        const filterStarred = searchFilterStarred.checked;
        
        searchResults.innerHTML = '';
        
        let filtered = allMessages;
        
        if (keyword) {
            filtered = filtered.filter(msg => 
                (msg.content && msg.content.toLowerCase().includes(keyword)) ||
                msg.username.toLowerCase().includes(keyword)
            );
        }
        
        if (filterUser) {
            filtered = filtered.filter(msg => msg.username === filterUser);
        }
        
        if (filterStarred) {
            filtered = filtered.filter(msg => starredMessages.includes(msg.id));
        }
        
        if (filtered.length === 0) {
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">无搜索结果</div>';
            return;
        }
        
        filtered.slice(0, 50).forEach(msg => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            const content = msg.content || (msg.fileName ? '[文件] ' + msg.fileName : '[图片]');
            item.innerHTML = '<div class="search-result-author">' + msg.username + '</div><div class="search-result-content">' + content + '</div>';
            item.onclick = () => {
                scrollToMessage(msg.id);
                toggleSearch();
            };
            searchResults.appendChild(item);
        });
    }

    function exportChatHistory() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            messages: allMessages,
            username: currentUsername
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function toggleBlockUser(username) {
        const index = blockedUsers.indexOf(username);
        if (index !== -1) {
            blockedUsers.splice(index, 1);
        } else {
            blockedUsers.push(username);
        }
        
        localStorage.setItem('chatBlockedUsers', JSON.stringify(blockedUsers));
        refreshMessages();
        renderBlockedUsers();
    }

    function renderBlockedUsers() {
        blockedList.innerHTML = '';
        
        if (blockedUsers.length === 0) {
            blockedList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无黑名单用户</div>';
            return;
        }
        
        blockedUsers.forEach(username => {
            const item = document.createElement('div');
            item.className = 'blocked-user-item';
            item.innerHTML = '<span>' + username + '</span><button>取消拉黑</button>';
            item.querySelector('button').onclick = () => toggleBlockUser(username);
            blockedList.appendChild(item);
        });
    }

    function refreshMessages() {
        refreshMessagesWithDateDividers();
    }

    function refreshMessagesOld() {
        messagesArea.innerHTML = '';
        allMessages.forEach(msg => {
            if (isPrivateMode && privateTarget) {
                if (!msg.isPrivate || (msg.toUser !== privateTarget && msg.username !== privateTarget)) {
                    return;
                }
            } else if (msg.isPrivate && msg.toUser !== currentUsername && msg.username !== currentUsername) {
                return;
            }
            
            if (blockedUsers.includes(msg.username)) {
                return;
            }
            
            addMessage(msg);
        });
    }

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                notificationPermission = permission === 'granted';
            });
        } else if ('Notification' in window && Notification.permission === 'granted') {
            notificationPermission = true;
        }
    }

    function sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: body });
        }
    }

    const originalShowCallIncoming = showCallIncoming;
    function showCallIncoming(data) {
        originalShowCallIncoming(data);
        if (document.hidden) {
            sendNotification('来电', data.from + ' 发起了通话');
        }
    }

    initEmojiPicker();
    initTheme();
    requestNotificationPermission();

    // ========== WebRTC 通话功能 ==========

    async function getMediaStream(callType) {
        try {
            const constraints = callType === 'video'
                ? { video: true, audio: true }
                : { audio: true };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (callType === 'voice') {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                startAudioLevelMonitoring();
            }

            return stream;
        } catch (error) {
            console.error('获取媒体流失败:', error);
            alert('无法获取' + (callType === 'video' ? '摄像头' : '麦克风') + '权限，请检查设置');
            return null;
        }
    }

    function startAudioLevelMonitoring() {
        if (!analyser) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function updateAudioLevel() {
            if (!analyser || !currentCall) return;

            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            audioLevel = sum / dataArray.length / 255;

            if (volumeIndicator) {
                volumeIndicator.style.width = (audioLevel * 100) + '%';
            }

            requestAnimationFrame(updateAudioLevel);
        }

        updateAudioLevel();
    }

    function createPeerConnection() {
        peerConnection = new RTCPeerConnection({ iceServers: iceServers });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
                const target = currentCall.target || currentCall.from;
                ws.send(JSON.stringify({
                    type: 'webrtcIceCandidate',
                    toUser: target,
                    candidate: event.candidate
                }));
            }
        };

        peerConnection.ontrack = (event) => {
            console.log('收到远程轨道:', event.track.kind);
            if (!remoteStream) {
                remoteStream = new MediaStream();
            }
            remoteStream.addTrack(event.track);

            if (currentCall && currentCall.type === 'video' && remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            } else if (currentCall && currentCall.type === 'voice' && audioContext) {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play().catch(err => console.error('播放远程音频失败:', err));
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE连接状态:', peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'disconnected' ||
                peerConnection.iceConnectionState === 'failed') {
                handleCallEnded({});
            }
        };

        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        return peerConnection;
    }

    async function initiateCall(targetUser, callType) {
        if (currentCall) {
            alert('你正在通话中，请先结束当前通话');
            return;
        }

        try {
            const stream = await getMediaStream(callType);
            if (!stream) return;

            localStream = stream;

            currentCall = { target: targetUser, type: callType, status: 'calling' };
            callPanel.classList.remove('active');

            createPeerConnection();

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'callOffer',
                    toUser: targetUser,
                    callType: callType
                }));

                ws.send(JSON.stringify({
                    type: 'webrtcOffer',
                    toUser: targetUser,
                    offer: offer
                }));
            }

            showCallUI(callType);

            activeCallBar.classList.add('active');
            activeCallStatus.textContent = '正在呼叫 ' + targetUser + '...';

        } catch (error) {
            console.error('发起通话失败:', error);
            alert('发起通话失败，请检查摄像头/麦克风权限');
            endCurrentCall();
        }
    }

    async function handleWebRTCOffer(data) {
        if (!currentCall || currentCall.status !== 'incoming') return;

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'webrtcAnswer',
                    toUser: data.from,
                    answer: answer
                }));
            }
        } catch (error) {
            console.error('处理WebRTC Offer失败:', error);
        }
    }

    async function handleWebRTCAnswer(data) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('WebRTC Answer已设置');
        } catch (error) {
            console.error('处理WebRTC Answer失败:', error);
        }
    }

    async function handleWebRTCIceCandidate(data) {
        try {
            if (peerConnection && data.candidate) {
                await peerConnection.addIceCandidate(new RTCCandidate(data.candidate));
            }
        } catch (error) {
            console.error('添加ICE候选失败:', error);
        }
    }

    function handleIncomingCall(data) {
        if (currentCall) {
            ws.send(JSON.stringify({
                type: 'callReject',
                toUser: data.from,
                callId: data.callId
            }));
            return;
        }

        currentCall = {
            from: data.from,
            callId: data.callId,
            type: data.callType,
            status: 'incoming'
        };

        incomingCallAvatar.textContent = (data.from.charAt(0) || '?').toUpperCase();
        incomingCallAvatar.style.backgroundColor = data.avatar || generateAvatarColor(data.from);
        incomingCallText.textContent = data.from;
        incomingCallType.textContent = data.callType === 'video' ? '视频通话' : '语音通话';
        incomingCallModal.classList.add('active');

        if (document.hidden) {
            sendNotification('来电', data.from + ' 发起了' + (data.callType === 'video' ? '视频' : '语音') + '通话');
        }
    }

    function handleCallAnswer(data) {
        if (currentCall && currentCall.target === data.from) {
            currentCall.status = 'connected';
            activeCallBar.classList.add('active');
            startCallTimer();
            activeCallStatus.textContent = '与 ' + data.from + ' 通话中 00:00';
        }
    }

    function handleCallRejected(data) {
        if (currentCall) {
            alert(data.from + ' 拒绝了通话');
            endCurrentCall();
        }
    }

    function handleCallEnded(data) {
        if (currentCall) {
            alert('通话已结束');
            endCurrentCall();
        }
    }

    async function acceptCall() {
        if (!currentCall || currentCall.status !== 'incoming') return;

        try {
            const stream = await getMediaStream(currentCall.type);
            if (!stream) return;

            localStream = stream;

            createPeerConnection();

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'callAnswer',
                    toUser: currentCall.from,
                    callId: currentCall.callId
                }));
            }

            currentCall.status = 'connected';
            incomingCallModal.classList.remove('active');

            showCallUI(currentCall.type);

            activeCallBar.classList.add('active');
            startCallTimer();
            activeCallStatus.textContent = '与 ' + currentCall.from + ' 通话中 00:00';

        } catch (error) {
            console.error('接听通话失败:', error);
            alert('接听通话失败，请检查摄像头/麦克风权限');
            rejectCall();
        }
    }

    function rejectCall() {
        if (ws && ws.readyState === WebSocket.OPEN && currentCall) {
            ws.send(JSON.stringify({
                type: 'callReject',
                toUser: currentCall.from,
                callId: currentCall.callId
            }));
        }

        cleanupCall();
        incomingCallModal.classList.remove('active');
    }

    function showCallUI(callType) {
        if (callType === 'video') {
            showVideoCallUI();
        } else {
            showVoiceCallUI();
        }
    }

    function showVideoCallUI() {
        if (callVideoWindow) {
            callVideoWindow.remove();
        }

        callVideoWindow = document.createElement('div');
        callVideoWindow.className = 'video-call-window';
        callVideoWindow.innerHTML = `
            <div class="video-call-header">
                <span class="video-call-title">视频通话</span>
                <span class="video-call-timer" id="videoCallTimer">00:00</span>
            </div>
            <div class="video-call-container">
                <div class="remote-video-container">
                    <video id="remoteVideo" autoplay playsinline></video>
                    <div class="remote-video-placeholder" id="remoteVideoPlaceholder">
                        <div class="avatar-large">?</div>
                    </div>
                </div>
                <div class="local-video-container">
                    <video id="localVideo" autoplay playsinline muted></video>
                </div>
            </div>
            <div class="video-call-controls">
                <div class="volume-indicator-container">
                    <span>音量</span>
                    <div class="volume-indicator-bar">
                        <div class="volume-indicator" id="volumeIndicator"></div>
                    </div>
                </div>
                <div class="video-call-buttons">
                    <button class="video-call-btn mute" id="audioToggleBtn" title="静音">
                        <span>🎤</span>
                    </button>
                    <button class="video-call-btn camera" id="videoToggleBtn" title="关闭摄像头">
                        <span>📹</span>
                    </button>
                    <button class="video-call-btn end" id="videoEndCallBtn" title="挂断">
                        <span>📞</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(callVideoWindow);

        localVideo = document.getElementById('localVideo');
        remoteVideo = document.getElementById('remoteVideo');
        audioToggleBtn = document.getElementById('audioToggleBtn');
        videoToggleBtn = document.getElementById('videoToggleBtn');
        volumeIndicator = document.getElementById('volumeIndicator');
        const videoEndCallBtn = document.getElementById('videoEndCallBtn');

        if (localStream) {
            localVideo.srcObject = localStream;
        }

        if (remoteStream) {
            remoteVideo.srcObject = remoteStream;
        }

        audioToggleBtn.addEventListener('click', toggleAudio);
        videoToggleBtn.addEventListener('click', toggleVideo);
        videoEndCallBtn.addEventListener('click', () => {
            if (ws && ws.readyState === WebSocket.OPEN && currentCall) {
                const target = currentCall.target || currentCall.from;
                ws.send(JSON.stringify({
                    type: 'callEnd',
                    toUser: target
                }));
            }
            endCurrentCall();
        });

        const videoCallTimer = document.getElementById('videoCallTimer');
        if (callTimer) clearInterval(callTimer);
        callTimer = setInterval(() => {
            callSeconds++;
            const min = Math.floor(callSeconds / 60);
            const sec = callSeconds % 60;
            if (videoCallTimer) {
                videoCallTimer.textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
            }
        }, 1000);
    }

    function showVoiceCallUI() {
        if (callVideoWindow) {
            callVideoWindow.remove();
        }

        const targetName = currentCall ? (currentCall.target || currentCall.from) : '';
        const avatarChar = targetName.charAt(0).toUpperCase() || '?';

        callVideoWindow = document.createElement('div');
        callVideoWindow.className = 'voice-call-window';
        callVideoWindow.innerHTML = `
            <div class="voice-call-header">
                <span class="voice-call-title">语音通话</span>
            </div>
            <div class="voice-call-avatar">
                <div class="avatar-voice">${avatarChar}</div>
            </div>
            <div class="voice-call-name">${targetName}</div>
            <div class="voice-call-status" id="voiceCallStatus">通话中</div>
            <div class="voice-call-timer" id="voiceCallTimer">00:00</div>
            <div class="volume-indicator-container">
                <span>音量</span>
                <div class="volume-indicator-bar">
                    <div class="volume-indicator" id="volumeIndicator"></div>
                </div>
            </div>
            <div class="voice-call-buttons">
                <button class="voice-call-btn mute" id="audioToggleBtn" title="静音">
                    <span>🎤</span>
                </button>
                <button class="voice-call-btn end" id="voiceEndCallBtn" title="挂断">
                    <span>📞</span>
                </button>
            </div>
        `;

        document.body.appendChild(callVideoWindow);

        audioToggleBtn = document.getElementById('audioToggleBtn');
        volumeIndicator = document.getElementById('volumeIndicator');
        const voiceEndCallBtn = document.getElementById('voiceEndCallBtn');

        audioToggleBtn.addEventListener('click', toggleAudio);
        voiceEndCallBtn.addEventListener('click', () => {
            if (ws && ws.readyState === WebSocket.OPEN && currentCall) {
                const target = currentCall.target || currentCall.from;
                ws.send(JSON.stringify({
                    type: 'callEnd',
                    toUser: target
                }));
            }
            endCurrentCall();
        });

        const voiceCallTimer = document.getElementById('voiceCallTimer');
        if (callTimer) clearInterval(callTimer);
        callTimer = setInterval(() => {
            callSeconds++;
            const min = Math.floor(callSeconds / 60);
            const sec = callSeconds % 60;
            if (voiceCallTimer) {
                voiceCallTimer.textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
            }
        }, 1000);
    }

    function toggleAudio() {
        if (!localStream) return;

        audioEnabled = !audioEnabled;
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = audioEnabled;
        }

        if (audioToggleBtn) {
            if (audioEnabled) {
                audioToggleBtn.classList.remove('disabled');
                audioToggleBtn.querySelector('span').textContent = '🎤';
                audioToggleBtn.title = '静音';
            } else {
                audioToggleBtn.classList.add('disabled');
                audioToggleBtn.querySelector('span').textContent = '🔇';
                audioToggleBtn.title = '取消静音';
            }
        }
    }

    function toggleVideo() {
        if (!localStream || currentCall.type !== 'video') return;

        videoEnabled = !videoEnabled;
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = videoEnabled;
        }

        if (videoToggleBtn) {
            if (videoEnabled) {
                videoToggleBtn.classList.remove('disabled');
                videoToggleBtn.querySelector('span').textContent = '📹';
                videoToggleBtn.title = '关闭摄像头';
                if (localVideo) {
                    localVideo.style.opacity = '1';
                }
            } else {
                videoToggleBtn.classList.add('disabled');
                videoToggleBtn.querySelector('span').textContent = '📷';
                videoToggleBtn.title = '开启摄像头';
                if (localVideo) {
                    localVideo.style.opacity = '0.3';
                }
            }
        }
    }

    function endCurrentCall() {
        cleanupCall();

        if (callVideoWindow) {
            callVideoWindow.remove();
            callVideoWindow = null;
        }

        activeCallBar.classList.remove('active');
        incomingCallModal.classList.remove('active');
    }

    function cleanupCall() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            remoteStream = null;
        }

        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }

        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        analyser = null;
        audioLevel = 0;
        currentCall = null;

        if (callTimer) {
            clearInterval(callTimer);
            callTimer = null;
        }
        callSeconds = 0;

        localVideo = null;
        remoteVideo = null;
        audioToggleBtn = null;
        videoToggleBtn = null;
        volumeIndicator = null;
        audioEnabled = true;
        videoEnabled = true;
    }

    // ========== 群公告功能 ==========
    function initAnnouncementFeature() {
        announcementBtn.addEventListener('click', () => {
            announcementPanel.classList.toggle('active');
            if (announcementPanel.classList.contains('active')) {
                renderAnnouncementList();
            }
        });

        announcementClose.addEventListener('click', () => {
            announcementPanel.classList.remove('active');
        });

        announcementCloseBanner.addEventListener('click', () => {
            announcementBanner.classList.remove('active');
        });

        announcementCreateBtn.addEventListener('click', createAnnouncement);

        announcementInput.addEventListener('keypress', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                createAnnouncement();
            }
        });
    }

    function createAnnouncement() {
        const content = announcementInput.value.trim();
        if (!content) {
            alert('请输入公告内容');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'createAnnouncement',
                content: content,
                author: currentUsername
            }));

            announcementInput.value = '';
        }
    }

    function handleAnnouncement(data) {
        if (data.announcements) {
            announcements = data.announcements;
            if (announcements.length > 0) {
                showAnnouncementBanner(announcements[announcements.length - 1]);
            }
            renderAnnouncementList();
        } else if (data.announcement) {
            announcements.push(data.announcement);
            showAnnouncementBanner(data.announcement);
            renderAnnouncementList();
        }
    }

    function showAnnouncementBanner(announcement) {
        currentAnnouncement = announcement;
        announcementAuthor.textContent = announcement.author;
        announcementText.textContent = announcement.content;

        announcementActions.innerHTML = '';
        if (announcement.author === currentUsername) {
            const editBtn = document.createElement('button');
            editBtn.className = 'announcement-edit';
            editBtn.textContent = '编辑';
            editBtn.onclick = () => editAnnouncement(announcement.id);
            announcementActions.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'announcement-delete';
            deleteBtn.textContent = '删除';
            deleteBtn.onclick = () => deleteAnnouncement(announcement.id);
            announcementActions.appendChild(deleteBtn);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'announcement-close-banner';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => {
            announcementBanner.classList.remove('active');
        };
        announcementActions.appendChild(closeBtn);

        announcementBanner.classList.add('active');
    }

    function editAnnouncement(id) {
        const announcement = announcements.find(a => a.id === id);
        if (!announcement || announcement.author !== currentUsername) return;

        const newContent = prompt('编辑公告', announcement.content);
        if (newContent && newContent.trim()) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'updateAnnouncement',
                    id: id,
                    content: newContent.trim()
                }));
            }
        }
    }

    function deleteAnnouncement(id) {
        if (!confirm('确定要删除此公告吗？')) return;

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'deleteAnnouncement',
                id: id
            }));
        }
    }

    function renderAnnouncementList() {
        announcementList.innerHTML = '';

        if (announcements.length === 0) {
            announcementList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">暂无公告</div>';
            return;
        }

        announcements.slice().reverse().forEach(announcement => {
            const item = document.createElement('div');
            item.className = 'announcement-item';
            item.innerHTML = `
                <div class="announcement-item-header">
                    <span class="announcement-item-author">${announcement.author}</span>
                    <span class="announcement-item-time">${announcement.time || ''}</span>
                </div>
                <div class="announcement-item-content">${announcement.content}</div>
                ${announcement.author === currentUsername ? `
                    <div class="announcement-item-actions">
                        <button class="announcement-item-btn" onclick="editAnnouncement('${announcement.id}')">编辑</button>
                        <button class="announcement-item-btn delete" onclick="deleteAnnouncement('${announcement.id}')">删除</button>
                    </div>
                ` : ''}
            `;
            announcementList.appendChild(item);
        });
    }

    // ========== 投票功能 ==========
    function initVoteFeature() {
        voteBtn.addEventListener('click', () => {
            votePanel.classList.toggle('active');
            if (votePanel.classList.contains('active')) {
                renderVoteList();
            }
        });

        voteClose.addEventListener('click', () => {
            votePanel.classList.remove('active');
        });

        addVoteOptionBtn.addEventListener('click', () => {
            addVoteOption();
        });

        voteCreateBtn.addEventListener('click', createVote);

        updateRemoveButtons();
    }

    function addVoteOption() {
        const optionCount = voteOptions.querySelectorAll('.vote-option-item').length;
        if (optionCount >= 10) {
            alert('最多只能添加10个选项');
            return;
        }

        const optionItem = document.createElement('div');
        optionItem.className = 'vote-option-item';
        optionItem.innerHTML = `
            <input type="text" placeholder="选项 ${optionCount + 1}" maxlength="50">
            <button class="remove-option">×</button>
        `;
        voteOptions.appendChild(optionItem);
        updateRemoveButtons();

        optionItem.querySelector('input').focus();
    }

    function updateRemoveButtons() {
        const optionItems = voteOptions.querySelectorAll('.vote-option-item');
        optionItems.forEach((item, index) => {
            const removeBtn = item.querySelector('.remove-option');
            if (optionItems.length <= 2) {
                removeBtn.style.visibility = 'hidden';
            } else {
                removeBtn.style.visibility = 'visible';
                removeBtn.onclick = () => {
                    item.remove();
                    updateRemoveButtons();
                    updateOptionPlaceholders();
                };
            }
        });
    }

    function updateOptionPlaceholders() {
        const optionItems = voteOptions.querySelectorAll('.vote-option-item');
        optionItems.forEach((item, index) => {
            const input = item.querySelector('input');
            input.placeholder = `选项 ${index + 1}`;
        });
    }

    function createVote() {
        const title = voteTitleInput.value.trim();
        if (!title) {
            alert('请输入投票标题');
            return;
        }

        const optionInputs = voteOptions.querySelectorAll('.vote-option-item input');
        const options = [];
        optionInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push(value);
            }
        });

        if (options.length < 2) {
            alert('请至少添加2个选项');
            return;
        }

        const isMulti = voteMultiSelect.checked;
        const deadline = voteDeadlineInput.value || null;

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'createVote',
                title: title,
                options: options,
                multiSelect: isMulti,
                deadline: deadline,
                creator: currentUsername
            }));

            voteTitleInput.value = '';
            optionInputs[0].value = '';
            optionInputs[1].value = '';
            while (optionInputs.length > 2) {
                optionInputs[optionInputs.length - 1].parentElement.remove();
            }
            voteMultiSelect.checked = false;
            voteDeadlineInput.value = '';
        }
    }

    function handleVote(data) {
        if (data.votes) {
            votes = data.votes;
            renderVoteList();
        } else if (data.vote) {
            const existingIndex = votes.findIndex(v => v.id === data.vote.id);
            if (existingIndex !== -1) {
                votes[existingIndex] = data.vote;
            } else {
                votes.push(data.vote);
            }
            renderVoteList();
        }
    }

    function renderVoteList() {
        voteList.innerHTML = '';

        if (votes.length === 0) {
            voteList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">暂无投票</div>';
            return;
        }

        votes.slice().reverse().forEach(vote => {
            const item = document.createElement('div');
            item.className = 'vote-item';
            item.dataset.voteId = vote.id;

            const isEnded = vote.deadline && new Date(vote.deadline) < new Date();
            const hasVoted = vote.voters && vote.voters[currentUsername];

            let optionsHtml = '';
            vote.options.forEach((option, index) => {
                const voters = vote.votes && vote.votes[index] ? vote.votes[index] : [];
                const voteCount = voters.length;
                const totalVotes = Object.values(vote.votes || {}).reduce((sum, arr) => sum + arr.length, 0);
                const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const isSelected = hasVoted && voters.includes(currentUsername);

                optionsHtml += `
                    <div class="vote-option ${isSelected ? 'selected' : ''}" data-option="${index}">
                        <input type="${vote.multiSelect ? 'checkbox' : 'radio'}" 
                               name="vote-${vote.id}" 
                               ${hasVoted || isEnded ? 'disabled' : ''} 
                               ${isSelected ? 'checked' : ''}>
                        <span class="vote-option-text">${option}</span>
                        <div class="vote-option-bar">
                            <div class="vote-option-bar-fill" style="width: ${hasVoted ? percent : 0}%"></div>
                        </div>
                        <span class="vote-option-percent">${hasVoted ? percent + '%' : '-'}</span>
                    </div>
                    ${hasVoted && voters.length > 0 ? `<div class="vote-option-voters">投票者: ${voters.join(', ')}</div>` : ''}
                `;
            });

            item.innerHTML = `
                <div class="vote-item-header">
                    <div>
                        <div class="vote-item-title">${vote.title}</div>
                        <div class="vote-item-meta">创建者: ${vote.creator} | 截止: ${vote.deadline || '无限制'}</div>
                    </div>
                    <span class="vote-item-status ${isEnded ? 'ended' : ''}">${isEnded ? '已结束' : '进行中'}</span>
                </div>
                <div class="vote-options-list">${optionsHtml}</div>
                ${!isEnded && !hasVoted ? '<button class="vote-action">投票</button>' : ''}
                ${vote.voters ? `<div class="vote-voters-list">总投票人数: ${Object.keys(vote.voters).length}</div>` : ''}
            `;

            if (!isEnded && !hasVoted) {
                const voteBtn = item.querySelector('.vote-action');
                voteBtn.onclick = () => submitVote(vote.id, vote.multiSelect);
            }

            const optionDivs = item.querySelectorAll('.vote-option');
            optionDivs.forEach(div => {
                div.onclick = (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const checkbox = div.querySelector('input');
                    if (!checkbox.disabled) {
                        if (vote.multiSelect) {
                            checkbox.checked = !checkbox.checked;
                            div.classList.toggle('selected');
                        } else {
                            optionDivs.forEach(d => d.classList.remove('selected'));
                            div.classList.add('selected');
                            checkbox.checked = true;
                        }
                    }
                };
            });

            voteList.appendChild(item);
        });
    }

    function submitVote(voteId, multiSelect) {
        const voteItem = voteList.querySelector(`[data-vote-id="${voteId}"]`);
        if (!voteItem) return;

        const selectedOptions = [];
        const checkboxes = voteItem.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
        checkboxes.forEach(checkbox => {
            const optionDiv = checkbox.closest('.vote-option');
            const optionIndex = parseInt(optionDiv.dataset.option);
            selectedOptions.push(optionIndex);
        });

        if (selectedOptions.length === 0) {
            alert('请选择至少一个选项');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'submitVote',
                voteId: voteId,
                options: selectedOptions,
                username: currentUsername
            }));
        }
    }

    // ========== 用户资料卡功能 ==========
    function initProfileCardFeature() {
        profileCardClose.addEventListener('click', () => {
            userProfileCard.classList.remove('active');
            profileTargetUser = null;
        });

        profilePrivateChatBtn.addEventListener('click', () => {
            if (profileTargetUser) {
                userProfileCard.classList.remove('active');
                selectPrivateChat(profileTargetUser);
                privateChatBtn.click();
            }
        });

        profileBlockBtn.addEventListener('click', () => {
            if (profileTargetUser) {
                toggleBlockUser(profileTargetUser);
                updateProfileBlockButton();
            }
        });

        document.addEventListener('click', (e) => {
            if (!userProfileCard.contains(e.target) && !e.target.classList.contains('message-username')) {
                userProfileCard.classList.remove('active');
                profileTargetUser = null;
            }
        });

        messagesArea.addEventListener('click', (e) => {
            const usernameEl = e.target.closest('.message-username');
            if (usernameEl) {
                const username = usernameEl.dataset.username;
                if (username && username !== currentUsername) {
                    showUserProfileCard(username, e.target);
                }
            }
        });
    }

    function showUserProfileCard(username, targetElement) {
        profileTargetUser = username;

        const user = onlineUsers.find(u => u.username === username);
        const isOnline = !!user;

        profileCardAvatar.textContent = (username.charAt(0) || '?').toUpperCase();
        if (user && user.avatar && !user.avatar.startsWith('#')) {
            profileCardAvatar.innerHTML = `<img src="${user.avatar}" alt="${username}">`;
        } else {
            profileCardAvatar.style.backgroundColor = generateAvatarColor(username);
        }

        profileCardName.textContent = username;
        profileCardStatus.textContent = isOnline ? '在线' : '离线';
        profileCardStatus.className = 'profile-card-status' + (isOnline ? '' : ' offline');

        const userMessages = allMessages.filter(m => m.username === username);
        profileMsgCount.textContent = userMessages.length;

        profileJoinTime.textContent = userJoinTimes[username] || '-';

        const lastOnline = user ? '现在' : (userJoinTimes[username] || '未知');
        profileLastOnline.textContent = lastOnline;

        updateProfileBlockButton();

        const rect = targetElement.getBoundingClientRect();
        const cardWidth = 280;
        let left = rect.left;
        if (left + cardWidth > window.innerWidth) {
            left = window.innerWidth - cardWidth - 20;
        }

        userProfileCard.style.left = left + 'px';
        userProfileCard.style.top = (rect.bottom + 10) + 'px';
        userProfileCard.classList.add('active');
    }

    function updateProfileBlockButton() {
        if (blockedUsers.includes(profileTargetUser)) {
            profileBlockBtn.textContent = '✅ 取消拉黑';
            profileBlockBtn.classList.add('blocked');
        } else {
            profileBlockBtn.textContent = '🚫 拉黑';
            profileBlockBtn.classList.remove('blocked');
        }
    }

    // ========== 消息标签功能 ==========
    function initTagFeature() {
        tagFilterBtn.addEventListener('click', () => {
            tagFilterPanel.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!tagFilterPanel.contains(e.target) && e.target !== tagFilterBtn) {
                tagFilterPanel.classList.remove('active');
            }
        });

        tagFilterOptions.addEventListener('click', (e) => {
            const option = e.target.closest('.tag-filter-option');
            if (option) {
                currentTagFilter = option.dataset.filter;
                document.querySelectorAll('.tag-filter-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                tagFilterPanel.classList.remove('active');
                applyTagFilter();
            }
        });

        tagSelectorOptions.addEventListener('click', (e) => {
            const option = e.target.closest('.tag-option');
            if (option) {
                addTagToMessage(option.dataset.tag, option.dataset.color);
            }
        });

        tagCustomAddBtn.addEventListener('click', () => {
            const customTag = tagCustomInput.value.trim();
            if (customTag) {
                addTagToMessage(customTag, 'custom');
                tagCustomInput.value = '';
            }
        });

        tagCustomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                tagCustomAddBtn.click();
            }
        });

        document.addEventListener('click', (e) => {
            if (!tagSelector.contains(e.target) && !e.target.classList.contains('message-action-btn.tag')) {
                tagSelector.classList.remove('active');
                currentTagMessageId = null;
            }
        });
    }

    function showTagSelector(messageId, targetElement) {
        currentTagMessageId = messageId;
        const rect = targetElement.getBoundingClientRect();

        tagSelector.style.left = rect.left + 'px';
        tagSelector.style.top = (rect.top - tagSelector.offsetHeight - 10) + 'px';
        tagSelector.classList.add('active');
    }

    function addTagToMessage(tag, color) {
        if (!currentTagMessageId) return;

        const msgIndex = allMessages.findIndex(m => m.id === currentTagMessageId);
        if (msgIndex !== -1) {
            allMessages[msgIndex].tags = allMessages[msgIndex].tags || [];

            if (!allMessages[msgIndex].tags.find(t => t.tag === tag)) {
                allMessages[msgIndex].tags.push({ tag, color });
            }

            updateMessageTags(currentTagMessageId, allMessages[msgIndex].tags);
        }

        tagSelector.classList.remove('active');
        currentTagMessageId = null;
    }

    function updateMessageTags(messageId, tags) {
        const msgElement = messagesArea.querySelector(`[data-message-id="${messageId}"]`);
        if (!msgElement) return;

        let tagsDiv = msgElement.querySelector('.message-tags');
        if (!tagsDiv) {
            tagsDiv = document.createElement('div');
            tagsDiv.className = 'message-tags';
            msgElement.appendChild(tagsDiv);
        }

        tagsDiv.innerHTML = '';
        tags.forEach(tagObj => {
            const tagSpan = document.createElement('span');
            tagSpan.className = `message-tag ${tagObj.color}`;
            tagSpan.textContent = tagObj.tag;
            tagsDiv.appendChild(tagSpan);
        });

        if (tags.length > 0) {
            msgElement.classList.add('with-tag');
        }
    }

    function applyTagFilter() {
        const messages = messagesArea.querySelectorAll('.message');
        messages.forEach(msgEl => {
            const messageId = msgEl.dataset.messageId;
            const msg = allMessages.find(m => m.id === messageId);

            if (currentTagFilter === 'all') {
                msgEl.style.display = '';
            } else {
                const hasTag = msg && msg.tags && msg.tags.some(t => t.color === currentTagFilter);
                msgEl.style.display = hasTag ? '' : 'none';
            }
        });
    }

    // ========== 消息防骚扰功能 ==========
    let filterKeywords = [];
    let sensitiveWords = [];
    let reportHistory = [];
    let showFilterNotice = true;
    let pendingReportMessageId = null;

    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const filterClose = document.getElementById('filterClose');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const filterKeywordsContent = document.getElementById('filterKeywordsContent');
    const filterSensitiveContent = document.getElementById('filterSensitiveContent');
    const filterReportsContent = document.getElementById('filterReportsContent');
    const filterKeywordsList = document.getElementById('filterKeywordsList');
    const filterKeywordInput = document.getElementById('filterKeywordInput');
    const addFilterKeywordBtn = document.getElementById('addFilterKeywordBtn');
    const showFilterNoticeToggle = document.getElementById('showFilterNotice');
    const sensitiveWordsList = document.getElementById('sensitiveWordsList');
    const reportHistoryList = document.getElementById('reportHistoryList');

    const defaultSensitiveWords = ['色情', '赌博', '暴力', '毒品', '诈骗', '反动', '邪教'];

    function initFilterFeature() {
        loadFilterSettings();
        renderFilterKeywords();
        renderSensitiveWords();
        renderReportHistory();

        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });

        filterClose.addEventListener('click', () => {
            filterPanel.classList.remove('active');
        });

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                filterKeywordsContent.style.display = 'none';
                filterSensitiveContent.style.display = 'none';
                filterReportsContent.style.display = 'none';

                if (tabName === 'keywords') {
                    filterKeywordsContent.style.display = 'block';
                } else if (tabName === 'sensitive') {
                    filterSensitiveContent.style.display = 'block';
                } else if (tabName === 'reports') {
                    filterReportsContent.style.display = 'block';
                }
            });
        });

        addFilterKeywordBtn.addEventListener('click', addFilterKeyword);
        filterKeywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addFilterKeyword();
        });

        showFilterNoticeToggle.addEventListener('change', () => {
            showFilterNotice = showFilterNoticeToggle.checked;
            saveFilterSettings();
        });
    }

    function loadFilterSettings() {
        const savedKeywords = localStorage.getItem('filterKeywords');
        if (savedKeywords) filterKeywords = JSON.parse(savedKeywords);

        const savedSensitive = localStorage.getItem('sensitiveWords');
        if (savedSensitive) sensitiveWords = JSON.parse(savedSensitive);

        const savedReports = localStorage.getItem('reportHistory');
        if (savedReports) reportHistory = JSON.parse(savedReports);

        const savedNotice = localStorage.getItem('showFilterNotice');
        if (savedNotice !== null) showFilterNotice = savedNotice === 'true';
        showFilterNoticeToggle.checked = showFilterNotice;
    }

    function saveFilterSettings() {
        localStorage.setItem('filterKeywords', JSON.stringify(filterKeywords));
        localStorage.setItem('sensitiveWords', JSON.stringify(sensitiveWords));
        localStorage.setItem('reportHistory', JSON.stringify(reportHistory));
        localStorage.setItem('showFilterNotice', showFilterNotice.toString());
    }

    function addFilterKeyword() {
        const keyword = filterKeywordInput.value.trim();
        if (!keyword) return;

        if (!filterKeywords.includes(keyword)) {
            filterKeywords.push(keyword);
            saveFilterSettings();
            renderFilterKeywords();
        }

        filterKeywordInput.value = '';
    }

    function removeFilterKeyword(keyword) {
        filterKeywords = filterKeywords.filter(k => k !== keyword);
        saveFilterSettings();
        renderFilterKeywords();
    }

    function renderFilterKeywords() {
        filterKeywordsList.innerHTML = '';
        filterKeywords.forEach(keyword => {
            const span = document.createElement('span');
            span.className = 'filter-keyword';
            span.innerHTML = `${keyword} <span class="delete-keyword" data-keyword="${keyword}">×</span>`;
            span.querySelector('.delete-keyword').addEventListener('click', () => removeFilterKeyword(keyword));
            filterKeywordsList.appendChild(span);
        });
    }

    function renderSensitiveWords() {
        sensitiveWordsList.innerHTML = '';
        defaultSensitiveWords.forEach(word => {
            const isEnabled = sensitiveWords.includes(word);
            const div = document.createElement('div');
            div.style.cssText = 'display: inline-block; margin: 4px; cursor: pointer; padding: 4px 10px; border-radius: 12px; font-size: 12px; transition: all 0.2s;' +
                (isEnabled ? 'background: var(--primary-color); color: white;' : 'background: var(--bg-secondary); color: var(--text-secondary);');
            div.textContent = (isEnabled ? '✓ ' : '') + word;
            div.addEventListener('click', () => toggleSensitiveWord(word, div));
            sensitiveWordsList.appendChild(div);
        });
    }

    function toggleSensitiveWord(word, element) {
        if (sensitiveWords.includes(word)) {
            sensitiveWords = sensitiveWords.filter(w => w !== word);
            element.style.background = 'var(--bg-secondary)';
            element.style.color = 'var(--text-secondary)';
            element.textContent = word;
        } else {
            sensitiveWords.push(word);
            element.style.background = 'var(--primary-color)';
            element.style.color = 'white';
            element.textContent = '✓ ' + word;
        }
        saveFilterSettings();
    }

    function renderReportHistory() {
        if (reportHistory.length === 0) {
            reportHistoryList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无举报记录</div>';
            return;
        }

        reportHistoryList.innerHTML = '';
        reportHistory.slice().reverse().forEach(report => {
            const item = document.createElement('div');
            item.className = 'report-history-item';
            item.innerHTML = `
                <div class="report-history-content">${report.content}</div>
                <div class="report-history-meta">
                    <span>举报人: ${report.reporter}</span>
                    <span>${report.time}</span>
                </div>
                <div style="margin-top: 6px;">
                    <span class="report-history-status ${report.status}">${getReportStatusText(report.status)}</span>
                </div>
            `;
            reportHistoryList.appendChild(item);
        });
    }

    function getReportStatusText(status) {
        const statusMap = {
            'pending': '待处理',
            'resolved': '已处理',
            'rejected': '已驳回'
        };
        return statusMap[status] || status;
    }

    function containsSensitiveContent(text) {
        const allFilters = [...filterKeywords, ...sensitiveWords];
        for (const keyword of allFilters) {
            if (text.includes(keyword)) {
                return keyword;
            }
        }
        return null;
    }

    function filterMessageContent(text) {
        let filtered = text;
        const allFilters = [...filterKeywords, ...sensitiveWords];
        allFilters.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(keyword.length));
        });
        return filtered;
    }

    // ========== 消息举报功能 ==========
    const reportPanel = document.getElementById('reportPanel');
    const reportClose = document.getElementById('reportClose');
    const reportAuthor = document.getElementById('reportAuthor');
    const reportContent = document.getElementById('reportContent');
    const reportDescription = document.getElementById('reportDescription');
    const reportSubmitBtn = document.getElementById('reportSubmitBtn');

    function initReportFeature() {
        reportClose.addEventListener('click', () => {
            reportPanel.classList.remove('active');
        });

        reportSubmitBtn.addEventListener('click', submitReport);

        document.querySelectorAll('.message').forEach(msgEl => {
            msgEl.addEventListener('mouseenter', () => {
                const actions = msgEl.querySelector('.message-actions');
                if (actions) actions.style.display = 'flex';
            });
        });
    }

    function showReportPanel(messageId) {
        const msg = allMessages.find(m => m.id === messageId);
        if (!msg) return;

        pendingReportMessageId = messageId;
        reportAuthor.textContent = msg.username;
        reportContent.textContent = msg.content;
        reportDescription.value = '';

        document.querySelectorAll('input[name="reportReason"]')[0].checked = true;

        reportPanel.classList.add('active');
    }

    function submitReport() {
        if (!pendingReportMessageId) return;

        const msg = allMessages.find(m => m.id === pendingReportMessageId);
        if (!msg) return;

        const reason = document.querySelector('input[name="reportReason"]:checked').value;
        const description = reportDescription.value.trim();

        const report = {
            id: Date.now(),
            messageId: pendingReportMessageId,
            reporter: currentUsername,
            reportedUser: msg.username,
            content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
            reason: reason,
            description: description,
            status: 'pending',
            time: new Date().toLocaleString()
        };

        reportHistory.push(report);
        saveFilterSettings();
        renderReportHistory();

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'report',
                report: report
            }));
        }

        reportPanel.classList.remove('active');
        alert('举报已提交，感谢您的反馈！');
        pendingReportMessageId = null;
    }

    // ========== 多设备同步功能 ==========
    let currentDeviceId = '';
    let devices = [];
    let syncInterval = null;

    const devicesBtn = document.getElementById('devicesBtn');
    const devicesPanel = document.getElementById('devicesPanel');
    const devicesClose = document.getElementById('devicesClose');
    const currentDeviceIcon = document.getElementById('currentDeviceIcon');
    const currentDeviceName = document.getElementById('currentDeviceName');
    const devicesList = document.getElementById('devicesList');
    const syncAllBtn = document.getElementById('syncAllBtn');
    const newDeviceNotification = document.getElementById('newDeviceNotification');
    const newDeviceContent = document.getElementById('newDeviceContent');
    const trustDeviceBtn = document.getElementById('trustDeviceBtn');
    const ignoreDeviceBtn = document.getElementById('ignoreDeviceBtn');

    function generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceName = '未知设备';
        let deviceIcon = '💻';

        if (/mobile/i.test(ua)) {
            if (/iphone/i.test(ua)) {
                deviceName = 'iPhone';
                deviceIcon = '📱';
            } else if (/android/i.test(ua)) {
                deviceName = 'Android手机';
                deviceIcon = '📱';
            } else {
                deviceName = '手机设备';
                deviceIcon = '📱';
            }
        } else if (/tablet|ipad/i.test(ua)) {
            deviceName = '平板设备';
            deviceIcon = '📱';
        } else {
            if (/mac/i.test(ua)) {
                deviceName = 'Mac电脑';
                deviceIcon = '💻';
            } else if (/windows/i.test(ua)) {
                deviceName = 'Windows电脑';
                deviceIcon = '🖥️';
            } else if (/linux/i.test(ua)) {
                deviceName = 'Linux设备';
                deviceIcon = '🖥️';
            } else {
                deviceName = '电脑设备';
                deviceIcon = '💻';
            }
        }

        return { name: deviceName, icon: deviceIcon };
    }

    function initDevicesFeature() {
        loadDevicesData();
        registerCurrentDevice();

        devicesBtn.addEventListener('click', () => {
            devicesPanel.classList.toggle('active');
            if (devicesPanel.classList.contains('active')) {
                renderDevicesList();
            }
        });

        devicesClose.addEventListener('click', () => {
            devicesPanel.classList.remove('active');
        });

        syncAllBtn.addEventListener('click', syncAllDevices);

        trustDeviceBtn.addEventListener('click', trustNewDevice);
        ignoreDeviceBtn.addEventListener('click', () => {
            newDeviceNotification.classList.remove('active');
        });

        startDeviceSync();
    }

    function loadDevicesData() {
        const savedDeviceId = localStorage.getItem('deviceId');
        currentDeviceId = savedDeviceId || generateDeviceId();
        localStorage.setItem('deviceId', currentDeviceId);

        const savedDevices = localStorage.getItem('devices');
        if (savedDevices) devices = JSON.parse(savedDevices);

        const deviceInfo = getDeviceInfo();
        currentDeviceIcon.textContent = deviceInfo.icon;
        currentDeviceName.textContent = deviceInfo.name;
    }

    function registerCurrentDevice() {
        const deviceInfo = getDeviceInfo();
        const existingIndex = devices.findIndex(d => d.id === currentDeviceId);

        const deviceData = {
            id: currentDeviceId,
            name: deviceInfo.name,
            icon: deviceInfo.icon,
            lastActive: new Date().toISOString(),
            trusted: true
        };

        if (existingIndex !== -1) {
            devices[existingIndex] = deviceData;
        } else {
            devices.push(deviceData);
        }

        saveDevicesData();
    }

    function saveDevicesData() {
        localStorage.setItem('devices', JSON.stringify(devices));
    }

    function renderDevicesList() {
        devicesList.innerHTML = '';

        const otherDevices = devices.filter(d => d.id !== currentDeviceId);

        if (otherDevices.length === 0) {
            devicesList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无其他设备</div>';
            return;
        }

        otherDevices.forEach(device => {
            const item = document.createElement('div');
            item.className = 'device-item';

            const lastActive = new Date(device.lastActive);
            const timeStr = getRelativeTime(lastActive);

            item.innerHTML = `
                <span class="device-icon">${device.icon}</span>
                <div class="device-item-info">
                    <div class="device-item-name">
                        ${device.name}
                        ${device.trusted ? '<span class="current-badge">已信任</span>' : ''}
                    </div>
                    <div class="device-item-meta">最后活动: ${timeStr}</div>
                </div>
                <div class="device-item-actions">
                    <button class="device-sync-btn" data-device-id="${device.id}">同步</button>
                    <button class="device-kick-btn" data-device-id="${device.id}">踢出</button>
                </div>
            `;

            item.querySelector('.device-sync-btn').addEventListener('click', () => syncDevice(device.id));
            item.querySelector('.device-kick-btn').addEventListener('click', () => kickDevice(device.id));

            devicesList.appendChild(item);
        });
    }

    function getRelativeTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return '刚刚';
        if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
        if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
        return Math.floor(diff / 86400) + '天前';
    }

    function kickDevice(deviceId) {
        if (!confirm('确定要踢出该设备吗？该设备将被强制下线。')) return;

        devices = devices.filter(d => d.id !== deviceId);
        saveDevicesData();
        renderDevicesList();

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'kickDevice',
                deviceId: deviceId,
                username: currentUsername
            }));
        }
    }

    function syncDevice(deviceId) {
        const device = devices.find(d => d.id === deviceId);
        if (!device) return;

        const syncData = {
            type: 'syncRequest',
            targetDevice: deviceId,
            sourceDevice: currentDeviceId,
            username: currentUsername
        };

        localStorage.setItem('syncData', JSON.stringify({
            messages: allMessages,
            preferences: {
                theme: isDarkMode ? 'dark' : 'light',
                soundEnabled: soundEnabled,
                soundType: currentSoundType
            },
            timestamp: new Date().toISOString()
        }));

        alert('已准备好同步数据，请在该设备上点击同步按钮接收。');

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(syncData));
        }
    }

    function syncAllDevices() {
        const syncData = {
            type: 'syncAll',
            deviceId: currentDeviceId,
            username: currentUsername,
            data: {
                messages: allMessages,
                preferences: {
                    theme: isDarkMode ? 'dark' : 'light',
                    soundEnabled: soundEnabled,
                    soundType: currentSoundType
                }
            }
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(syncData));
        }

        localStorage.setItem('syncBackup', JSON.stringify({
            messages: allMessages,
            preferences: syncData.data.preferences,
            timestamp: new Date().toISOString()
        }));

        alert('正在同步到所有设备...');
    }

    function showNewDeviceNotification(deviceInfo) {
        newDeviceContent.textContent = `检测到新设备登录: ${deviceInfo.name}`;
        newDeviceNotification.classList.add('active');

        setTimeout(() => {
            newDeviceNotification.classList.remove('active');
        }, 10000);
    }

    function trustNewDevice() {
        const untrustedDevices = devices.filter(d => !d.trusted);
        if (untrustedDevices.length > 0) {
            untrustedDevices[0].trusted = true;
            saveDevicesData();
        }

        newDeviceNotification.classList.remove('active');
    }

    function startDeviceSync() {
        syncInterval = setInterval(() => {
            registerCurrentDevice();

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'deviceHeartbeat',
                    deviceId: currentDeviceId,
                    username: currentUsername
                }));
            }
        }, 30000);
    }

    // ========== 私聊加密功能 ==========
    let encryptionEnabled = false;
    let encryptionKey = '';

    const encryptionBtn = document.getElementById('encryptionBtn');
    const encryptionPanel = document.getElementById('encryptionPanel');
    const encryptionClose = document.getElementById('encryptionClose');
    const encryptionToggle = document.getElementById('encryptionToggle');
    const encryptionKeyInput = document.getElementById('encryptionKeyInput');
    const generateKeyBtn = document.getElementById('generateKeyBtn');

    function initEncryptionFeature() {
        loadEncryptionSettings();

        encryptionBtn.addEventListener('click', () => {
            encryptionPanel.classList.toggle('active');
        });

        encryptionClose.addEventListener('click', () => {
            encryptionPanel.classList.remove('active');
        });

        encryptionToggle.addEventListener('change', () => {
            encryptionEnabled = encryptionToggle.checked;
            saveEncryptionSettings();
            updateEncryptionIndicator();
        });

        encryptionKeyInput.addEventListener('input', () => {
            encryptionKey = encryptionKeyInput.value;
            saveEncryptionSettings();
        });

        generateKeyBtn.addEventListener('click', () => {
            encryptionKey = generateRandomKey();
            encryptionKeyInput.value = encryptionKey;
            saveEncryptionSettings();
        });
    }

    function loadEncryptionSettings() {
        const saved = localStorage.getItem('encryptionSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            encryptionEnabled = settings.enabled || false;
            encryptionKey = settings.key || '';

            encryptionToggle.checked = encryptionEnabled;
            encryptionKeyInput.value = encryptionKey;
        }
    }

    function saveEncryptionSettings() {
        localStorage.setItem('encryptionSettings', JSON.stringify({
            enabled: encryptionEnabled,
            key: encryptionKey
        }));
    }

    function generateRandomKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    function encryptMessage(text) {
        if (!encryptionEnabled || !encryptionKey) return text;
        try {
            const encrypted = CryptoJS.AES.encrypt(text, encryptionKey).toString();
            return '[加密]' + encrypted;
        } catch (error) {
            console.error('加密失败:', error);
            return text;
        }
    }

    function decryptMessage(text) {
        if (!encryptionEnabled || !encryptionKey) return text;
        if (!text.startsWith('[加密]')) return text;

        try {
            const encrypted = text.substring(4);
            const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey);
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            if (!result) {
                return null;
            }
            return result;
        } catch (error) {
            console.error('解密失败:', error);
            return null;
        }
    }

    function updateEncryptionIndicator() {
        const indicator = document.querySelector('.encryption-indicator');
        if (indicator) {
            if (encryptionEnabled) {
                indicator.className = 'encryption-indicator locked';
                indicator.innerHTML = '🔒 已加密';
            } else {
                indicator.className = 'encryption-indicator unlocked';
                indicator.innerHTML = '🔓 未加密';
            }
        }
    }

    // ========== AI助手功能 ==========
    let aiEnabled = true;
    let aiRole = 'assistant';
    let aiContext = [];

    const aiBtn = document.getElementById('aiBtn');
    const aiSettingsPanel = document.getElementById('aiSettingsPanel');
    const aiSettingsClose = document.getElementById('aiSettingsClose');
    const aiEnabledToggle = document.getElementById('aiEnabledToggle');
    const aiRoleSelect = document.getElementById('aiRoleSelect');
    const aiContextCount = document.getElementById('aiContextCount');
    const aiResetContextBtn = document.getElementById('aiResetContextBtn');

    const aiResponses = {
        assistant: [
            { trigger: '你好', response: '你好！有什么我可以帮助你的吗？' },
            { trigger: '帮助', response: '我可以帮助你回答问题、提供信息、翻译文本、总结内容或协助编程。只需@我或直接发送问题即可！' },
            { trigger: '？', response: '我是AI助手，你可以向我提问任何问题，我会尽力回答。' }
        ],
        translator: [
            { trigger: '翻译', response: '请告诉我需要翻译的内容，我会尽力翻译。格式：翻译 [语言] [内容]' }
        ],
        summarizer: [
            { trigger: '总结', response: '请提供需要总结的内容，我会为你提取要点。' }
        ],
        coder: [
            { trigger: '代码', response: '我可以帮你解答编程问题。请描述你遇到的问题或需要实现的功能。' }
        ],
        helper: [
            { trigger: '怎么', response: '让我帮你分析这个问题。' }
        ]
    };

    function initAIFeature() {
        loadAISettings();

        aiBtn.addEventListener('click', () => {
            aiSettingsPanel.classList.toggle('active');
        });

        aiSettingsClose.addEventListener('click', () => {
            aiSettingsPanel.classList.remove('active');
        });

        aiEnabledToggle.addEventListener('change', () => {
            aiEnabled = aiEnabledToggle.checked;
            saveAISettings();
        });

        aiRoleSelect.addEventListener('change', () => {
            aiRole = aiRoleSelect.value;
            saveAISettings();
        });

        aiResetContextBtn.addEventListener('click', () => {
            if (confirm('确定要清空AI对话上下文吗？')) {
                aiContext = [];
                saveAISettings();
                updateAIContextCount();
                alert('上下文已清空');
            }
        });

        updateAIContextCount();
    }

    function loadAISettings() {
        const saved = localStorage.getItem('aiSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            aiEnabled = settings.enabled !== false;
            aiRole = settings.role || 'assistant';
            aiContext = settings.context || [];

            aiEnabledToggle.checked = aiEnabled;
            aiRoleSelect.value = aiRole;
        }
    }

    function saveAISettings() {
        localStorage.setItem('aiSettings', JSON.stringify({
            enabled: aiEnabled,
            role: aiRole,
            context: aiContext
        }));
    }

    function updateAIContextCount() {
        aiContextCount.textContent = aiContext.length + ' 条消息';
    }

    function shouldTriggerAI(text) {
        return text.startsWith('@AI') || 
               text.startsWith('/ai') || 
               text.startsWith('ai:') ||
               text.includes('？') && text.length < 50;
    }

    function processAIRequest(text, callback) {
        if (!aiEnabled) {
            callback(null);
            return;
        }

        const cleanText = text.replace(/^(@AI|\/ai|ai:)\s*/i, '').trim();

        aiContext.push({
            role: 'user',
            content: cleanText,
            timestamp: Date.now()
        });

        setTimeout(() => {
            const response = generateAIResponse(cleanText);

            aiContext.push({
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            });

            if (aiContext.length > 20) {
                aiContext = aiContext.slice(-20);
            }

            saveAISettings();
            updateAIContextCount();

            callback(response);
        }, 1000 + Math.random() * 1000);
    }

    function generateAIResponse(text) {
        const roleResponses = aiResponses[aiRole] || aiResponses.assistant;

        for (const item of roleResponses) {
            if (text.includes(item.trigger)) {
                return item.response;
            }
        }

        const responses = [
            '收到你的消息了，让我思考一下...',
            '这是一个有趣的问题，我正在处理中。',
            '好的，我已经理解你的问题了。',
            '让我帮你分析一下这个问题。',
            '感谢你的提问，我会尽力帮助你。'
        ];

        let response = responses[Math.floor(Math.random() * responses.length)];

        if (aiRole === 'translator' && text.length < 100) {
            response = '请提供需要翻译的完整内容，我会为你翻译。';
        } else if (aiRole === 'summarizer' && text.length > 50) {
            response = '我已经阅读了内容。主要信息是：' + text.substring(0, 50) + '...';
        } else if (aiRole === 'coder') {
            response = '关于代码问题，请提供更多细节，如使用的编程语言和具体需求。';
        }

        return response;
    }

    function addAIMessage(content) {
        const messageId = 'msg_' + Date.now();
        const timestamp = new Date().toLocaleString();

        const msg = {
            id: messageId,
            username: 'AI助手',
            content: content,
            timestamp: timestamp,
            isAI: true,
            avatar: '',
            reactions: {},
            isPrivate: false,
            toUser: null,
            tags: []
        };

        allMessages.push(msg);
        addMessage(msg);
        scrollToBottom();

        return messageId;
    }

    // ========== 初始化所有新功能 ==========
    function initNewFeatures() {
        initFilterFeature();
        initReportFeature();
        initDevicesFeature();
        initEncryptionFeature();
        initAIFeature();
        initSmartRecommendations();
        initBubbleStyles();
        initPreviewFeature();
        initUserColors();
        initBackupFeature();
    }

    // 在消息操作按钮中添加新按钮
    function addNewMessageActionButtons(actionsDiv, messageId) {
        const reportBtn = document.createElement('button');
        reportBtn.className = 'message-action-btn report';
        reportBtn.textContent = '🚨';
        reportBtn.title = '举报';
        reportBtn.onclick = (e) => {
            e.stopPropagation();
            showReportPanel(messageId);
        };
        actionsDiv.insertBefore(reportBtn, actionsDiv.firstChild);
    }

    // 修改消息内容处理
    function processMessageContent(content, isEncrypted = false) {
        if (isEncrypted) {
            const decrypted = decryptMessage(content);
            if (decrypted) {
                return decrypted;
            } else {
                return {
                    text: '[解密失败，显示密文] ' + content,
                    failed: true
                };
            }
        }

        if (containsSensitiveContent(content)) {
            return {
                text: filterMessageContent(content),
                filtered: true
            };
        }

        return {
            text: content,
            filtered: false
        };
    }

    // ========== 修改现有消息显示函数以支持新功能 ==========
    const originalAddMessage = addMessage;

    addMessage = function(msg) {
        if (msg.isPrivate && privateTarget) {
            if (msg.toUser !== privateTarget && msg.username !== privateTarget) {
                return;
            }
        }

        if (blockedUsers.includes(msg.username)) {
            return;
        }

        const messageDiv = document.createElement('div');

        let messageClass = msg.username === currentUsername ? 'own' : 'other';
        if (msg.type === 'system') messageClass = 'system';
        if (msg.isAI) messageClass += ' ai';
        if (msg.isEncrypted) messageClass += ' encrypted';
        if (msg.decryptionFailed) messageClass += ' decryption-failed';

        messageDiv.className = 'message ' + messageClass;
        messageDiv.dataset.messageId = msg.id;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        if (msg.isAI) avatarDiv.classList.add('ai-avatar');

        if (msg.avatar && !msg.avatar.startsWith('#')) {
            avatarDiv.innerHTML = '<img src="' + msg.avatar + '" alt="avatar">';
        } else {
            const avatarColor = msg.avatar || generateAvatarColor(msg.username);
            avatarDiv.style.backgroundColor = avatarColor;
            avatarDiv.textContent = (msg.username.charAt(0) || '?').toUpperCase();
        }

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';

        const contentResult = processMessageContent(msg.content, msg.isEncrypted);

        if (msg.decryptionFailed) {
            bubbleDiv.innerHTML = '<span class="decryption-failed-icon">⚠️</span>' + contentResult.text;
        } else {
            bubbleDiv.textContent = contentResult.text;
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'message-info';
        infoDiv.innerHTML = `
            <span>${msg.username}</span>
            <span>${msg.timestamp}</span>
        `;

        if (msg.edited) {
            const editedSpan = document.createElement('span');
            editedSpan.className = 'edited';
            editedSpan.textContent = '(已编辑)';
            infoDiv.appendChild(editedSpan);
        }

        if (msg.readCount && msg.readCount > 0) {
            const readSpan = document.createElement('span');
            readSpan.className = 'read-count';
            readSpan.textContent = '已读 ' + msg.readCount;
            infoDiv.appendChild(readSpan);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        if (msg.username === currentUsername) {
            const recallBtn = document.createElement('button');
            recallBtn.className = 'message-action-btn recall';
            recallBtn.textContent = '撤回';
            recallBtn.onclick = () => recallMessage(msg.id);
            actionsDiv.appendChild(recallBtn);

            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn edit';
            editBtn.textContent = '编辑';
            editBtn.onclick = () => editMessage(msg.id);
            actionsDiv.appendChild(editBtn);
        }

        const reactBtn = document.createElement('button');
        reactBtn.className = 'message-action-btn react';
        reactBtn.textContent = '👍';
        reactBtn.onclick = (e) => {
            e.stopPropagation();
            showReactionSelector(msg.id, reactBtn);
        };
        actionsDiv.appendChild(reactBtn);

        const starBtn = document.createElement('button');
        starBtn.className = 'message-action-btn star';
        starBtn.textContent = '⭐';
        starBtn.onclick = () => toggleStar(msg.id);
        actionsDiv.appendChild(starBtn);

        addNewMessageActionButtons(actionsDiv, msg.id);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(infoDiv);
        messageDiv.appendChild(actionsDiv);

        if (msg.tags && msg.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'message-tags';
            msg.tags.forEach(tagObj => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'message-tag ' + tagObj.color;
                tagSpan.textContent = tagObj.tag;
                tagsDiv.appendChild(tagSpan);
            });
            messageDiv.appendChild(tagsDiv);
            messageDiv.classList.add('with-tag');
        }

        if (msg.reactions && Object.keys(msg.reactions).length > 0) {
            const reactionsDiv = document.createElement('div');
            reactionsDiv.className = 'message-reactions';

            for (const [emoji, users] of Object.entries(msg.reactions)) {
                const reactionSpan = document.createElement('span');
                reactionSpan.className = 'message-reaction';
                reactionSpan.innerHTML = `<span class="reaction-emoji">${emoji}</span><span class="reaction-count">${users.length}</span>`;
                reactionSpan.onclick = () => showReactionUsers(msg.id, emoji);
                reactionsDiv.appendChild(reactionSpan);
            }

            messageDiv.appendChild(reactionsDiv);
        }

        messagesArea.appendChild(messageDiv);

        const isOwn = msg.username === currentUsername;
        addMessageAnimation(messageDiv, isOwn);
        addSentIndicator(messageDiv);

        messageDiv.addEventListener('click', () => {
            actionsDiv.style.display = 'flex';
        });
    };

    // ========== 智能推荐功能 ==========
    let userMessageHistory = [];
    let frequentReplies = {};
    let recommendationEnabled = true;

    const smartRecommendations = document.getElementById('smartRecommendations');
    const recommendationsList = document.getElementById('recommendationsList');

    function initSmartRecommendations() {
        loadRecommendationData();

        messageInput.addEventListener('input', debounce(() => {
            const text = messageInput.value.trim();
            if (text.length > 0 && recommendationEnabled) {
                showRecommendations(text);
            } else {
                hideRecommendations();
            }
        }, 300));

        messageInput.addEventListener('focus', () => {
            const text = messageInput.value.trim();
            if (text.length > 0 && recommendationEnabled) {
                showRecommendations(text);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.smart-recommendations') && !e.target.closest('#messageInput')) {
                hideRecommendations();
            }
        });
    }

    function loadRecommendationData() {
        const saved = localStorage.getItem('userMessageHistory');
        if (saved) {
            userMessageHistory = JSON.parse(saved);
        }

        const savedReplies = localStorage.getItem('frequentReplies');
        if (savedReplies) {
            frequentReplies = JSON.parse(savedReplies);
        }
    }

    function saveRecommendationData() {
        localStorage.setItem('userMessageHistory', JSON.stringify(userMessageHistory.slice(-100)));
        localStorage.setItem('frequentReplies', JSON.stringify(frequentReplies));
    }

    function showRecommendations(text) {
        const recommendations = [];

        const frequentMatches = Object.entries(frequentReplies)
            .filter(([reply]) => reply.toLowerCase().includes(text.toLowerCase()))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([reply]) => ({ type: 'frequent', text: reply }));

        recommendations.push(...frequentMatches);

        const contextMatches = findContextuallySimilar(text);
        recommendations.push(...contextMatches.slice(0, 2));

        if (recommendations.length === 0) {
            const commonReplies = [
                '好的，明白了！',
                '收到，谢谢！',
                '这个主意不错 👍',
                '有道理！'
            ];
            recommendations.push({
                type: 'frequent',
                text: commonReplies[Math.floor(Math.random() * commonReplies.length)]
            });
        }

        renderRecommendations(recommendations);
        smartRecommendations.classList.add('active');
    }

    function hideRecommendations() {
        smartRecommendations.classList.remove('active');
    }

    function renderRecommendations(recommendations) {
        recommendationsList.innerHTML = '';

        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item ' + (rec.type === 'similar' ? 'similar' : 'frequent');
            item.textContent = rec.text;
            item.onclick = () => {
                messageInput.value = rec.text;
                hideRecommendations();
                messageInput.focus();
            };
            recommendationsList.appendChild(item);
        });
    }

    function findContextuallySimilar(text) {
        const similarMessages = allMessages
            .filter(msg => msg.content.length > 5 && msg.content.length < 100)
            .filter(msg => {
                const words = text.toLowerCase().split(/\s+/);
                return words.some(word => msg.content.toLowerCase().includes(word));
            })
            .slice(-10);

        return similarMessages.map(msg => ({
            type: 'similar',
            text: msg.content
        }));
    }

    function learnFromMessage(text) {
        if (text.length > 3 && text.length < 50) {
            userMessageHistory.push({
                text: text,
                timestamp: Date.now()
            });

            if (userMessageHistory.length > 2) {
                const lastMsg = userMessageHistory[userMessageHistory.length - 2];
                const currentMsg = userMessageHistory[userMessageHistory.length - 1];

                if (!frequentReplies[currentMsg.text]) {
                    frequentReplies[currentMsg.text] = 0;
                }
                frequentReplies[currentMsg.text]++;

                if (frequentReplies[currentMsg.text] > 1) {
                    saveRecommendationData();
                }
            }
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========== 消息气泡样式功能 ==========
    let currentBubbleTheme = 'default';
    let customBubbleColor = '#667eea';
    let bubbleRadius = 16;
    let bubbleShadowEnabled = true;
    let animationsEnabled = true;
    let slideAnimEnabled = true;
    let emojiAnimEnabled = true;

    function initBubbleStyles() {
        loadBubbleSettings();
        setupBubbleStyleListeners();
        applyBubbleStyles();
    }

    function loadBubbleSettings() {
        const saved = localStorage.getItem('bubbleSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            currentBubbleTheme = settings.theme || 'default';
            customBubbleColor = settings.color || '#667eea';
            bubbleRadius = settings.radius || 16;
            bubbleShadowEnabled = settings.shadow !== false;
            animationsEnabled = settings.animations !== false;
            slideAnimEnabled = settings.slideAnim !== false;
            emojiAnimEnabled = settings.emojiAnim !== false;
        }
    }

    function saveBubbleSettings() {
        localStorage.setItem('bubbleSettings', JSON.stringify({
            theme: currentBubbleTheme,
            color: customBubbleColor,
            radius: bubbleRadius,
            shadow: bubbleShadowEnabled,
            animations: animationsEnabled,
            slideAnim: slideAnimEnabled,
            emojiAnim: emojiAnimEnabled
        }));
    }

    function setupBubbleStyleListeners() {
        const styleBtn = document.getElementById('styleBtn');
        const stylePanel = document.getElementById('styleSettingsPanel');
        const styleClose = document.getElementById('styleSettingsClose');

        styleBtn.addEventListener('click', () => {
            stylePanel.classList.toggle('active');
        });

        styleClose.addEventListener('click', () => {
            stylePanel.classList.remove('active');
        });

        document.querySelectorAll('.bubble-theme-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.bubble-theme-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentBubbleTheme = option.dataset.theme;
                saveBubbleSettings();
                applyBubbleStyles();
            });
        });

        const colorPicker = document.getElementById('bubbleColorPicker');
        const colorText = document.getElementById('bubbleColorText');

        colorPicker.addEventListener('input', (e) => {
            customBubbleColor = e.target.value;
            colorText.value = e.target.value;
            saveBubbleSettings();
            applyBubbleStyles();
        });

        colorText.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                customBubbleColor = value;
                colorPicker.value = value;
                saveBubbleSettings();
                applyBubbleStyles();
            }
        });

        const radiusSlider = document.getElementById('bubbleRadiusSlider');
        const radiusValue = document.getElementById('bubbleRadiusValue');

        radiusSlider.addEventListener('input', (e) => {
            bubbleRadius = parseInt(e.target.value);
            radiusValue.textContent = bubbleRadius + 'px';
            saveBubbleSettings();
            applyBubbleStyles();
        });

        document.getElementById('bubbleShadowToggle').addEventListener('change', (e) => {
            bubbleShadowEnabled = e.target.checked;
            saveBubbleSettings();
            applyBubbleStyles();
        });

        document.getElementById('animationToggle').addEventListener('change', (e) => {
            animationsEnabled = e.target.checked;
            saveBubbleSettings();
            applyBubbleStyles();
        });

        document.getElementById('slideAnimToggle').addEventListener('change', (e) => {
            slideAnimEnabled = e.target.checked;
            saveBubbleSettings();
        });

        document.getElementById('emojiAnimToggle').addEventListener('change', (e) => {
            emojiAnimEnabled = e.target.checked;
            saveBubbleSettings();
        });
    }

    function applyBubbleStyles() {
        const container = document.querySelector('.chat-container');
        if (!container) return;

        container.className = 'chat-container';

        if (currentBubbleTheme !== 'default') {
            container.classList.add('bubble-theme-' + currentBubbleTheme);
        }

        if (!animationsEnabled) {
            container.style.setProperty('--animation-duration', '0s');
        }

        document.querySelectorAll('.message-bubble').forEach(bubble => {
            if (currentBubbleTheme !== 'cartoon' && currentBubbleTheme !== 'minimal') {
                bubble.style.borderRadius = bubbleRadius + 'px';
            }

            if (!bubbleShadowEnabled) {
                bubble.style.boxShadow = 'none';
            }

            if (currentBubbleTheme !== 'gradient') {
                bubble.style.background = '';
            }
        });

        document.querySelectorAll('.bubble-theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === currentBubbleTheme);
        });

        document.getElementById('bubbleColorPicker').value = customBubbleColor;
        document.getElementById('bubbleColorText').value = customBubbleColor;
        document.getElementById('bubbleRadiusSlider').value = bubbleRadius;
        document.getElementById('bubbleRadiusValue').textContent = bubbleRadius + 'px';
        document.getElementById('bubbleShadowToggle').checked = bubbleShadowEnabled;
        document.getElementById('animationToggle').checked = animationsEnabled;
        document.getElementById('slideAnimToggle').checked = slideAnimEnabled;
        document.getElementById('emojiAnimToggle').checked = emojiAnimEnabled;
    }

    // ========== 消息动画效果 ==========
    function addMessageAnimation(messageElement, isOwn) {
        if (!animationsEnabled) return;

        if (slideAnimEnabled) {
            messageElement.classList.add(isOwn ? 'animate-slide-in-right' : 'animate-slide-in-left');
        } else {
            messageElement.classList.add('animate-pop-in');
        }

        setTimeout(() => {
            messageElement.classList.remove('animate-slide-in-left', 'animate-slide-in-right', 'animate-pop-in');
        }, 300);
    }

    function addSentIndicator(messageElement) {
        if (!animationsEnabled) return;

        const indicator = document.createElement('span');
        indicator.className = 'sent-indicator';
        indicator.textContent = '✓';

        setTimeout(() => {
            indicator.classList.add('success', 'animate-checkmark');
            indicator.textContent = '✓✓';
        }, 500);

        setTimeout(() => {
            indicator.remove();
        }, 2000);

        const infoDiv = messageElement.querySelector('.message-info');
        if (infoDiv) {
            infoDiv.appendChild(indicator);
        }
    }

    function animateReaction(messageElement, emoji) {
        if (!emojiAnimEnabled) return;

        const flyingEmoji = document.createElement('span');
        flyingEmoji.className = 'flying-emoji';
        flyingEmoji.textContent = emoji;
        flyingEmoji.style.left = '50%';
        flyingEmoji.style.top = '50%';

        messageElement.classList.add('reaction-animating');
        messageElement.appendChild(flyingEmoji);

        setTimeout(() => {
            flyingEmoji.remove();
            messageElement.classList.remove('reaction-animating');
        }, 800);
    }

    function animateRecall(messageElement) {
        if (!animationsEnabled) {
            messageElement.remove();
            return;
        }

        messageElement.classList.add('animate-fade-out');

        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }

    // ========== 消息预览功能 ==========
    let previewItems = [];
    let currentPreviewIndex = 0;

    const previewPanel = document.getElementById('previewPanel');
    const previewContent = document.getElementById('previewContent');
    const previewTitle = document.getElementById('previewTitle');
    const previewClose = document.getElementById('previewClose');

    function initPreviewFeature() {
        previewClose.addEventListener('click', closePreview);

        previewPanel.addEventListener('click', (e) => {
            if (e.target === previewPanel) {
                closePreview();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (previewPanel.classList.contains('active')) {
                if (e.key === 'Escape') closePreview();
                if (e.key === 'ArrowLeft') showPrevPreview();
                if (e.key === 'ArrowRight') showNextPreview();
            }
        });
    }

    function showPreview(type, data) {
        if (type === 'image') {
            previewItems = [data];
            currentPreviewIndex = 0;
            previewTitle.textContent = '图片预览';
            previewContent.innerHTML = `<img class="preview-image" src="${data}" alt="预览图片">`;
        } else if (type === 'file') {
            previewItems = [data];
            currentPreviewIndex = 0;
            previewTitle.textContent = '文件预览';
            previewContent.innerHTML = `
                <div class="preview-file-info">
                    <div class="preview-file-name">${data.name}</div>
                    <div class="preview-file-meta">大小: ${formatFileSize(data.size)}</div>
                    ${data.type ? `<div class="preview-file-meta">类型: ${data.type}</div>` : ''}
                    <a href="${data.url}" download="${data.name}" class="backup-export-btn" style="margin-top: 10px;">下载文件</a>
                </div>
            `;
        } else if (type === 'images') {
            previewItems = data;
            currentPreviewIndex = 0;
            previewTitle.textContent = `图片预览 (${currentPreviewIndex + 1}/${previewItems.length})`;
            previewContent.innerHTML = `
                <img class="preview-image" src="${previewItems[currentPreviewIndex]}" alt="预览图片">
                ${previewItems.length > 1 ? `
                    <button class="preview-nav prev" onclick="showPrevPreview()">◀</button>
                    <button class="preview-nav next" onclick="showNextPreview()">▶</button>
                ` : ''}
            `;
        } else if (type === 'link') {
            previewTitle.textContent = '链接预览';
            previewContent.innerHTML = `
                <div class="preview-link-card">
                    ${data.image ? `<img class="preview-link-image" src="${data.image}" alt="链接图片">` : ''}
                    <div class="preview-link-title">${data.title || '无标题'}</div>
                    <div class="preview-link-desc">${data.description || '无描述'}</div>
                    <a href="${data.url}" target="_blank" class="backup-export-btn" style="margin-top: 10px;">打开链接</a>
                </div>
            `;
        }

        previewPanel.classList.add('active');
    }

    function closePreview() {
        previewPanel.classList.remove('active');
        previewItems = [];
        currentPreviewIndex = 0;
    }

    function showPrevPreview() {
        if (previewItems.length > 1) {
            currentPreviewIndex = (currentPreviewIndex - 1 + previewItems.length) % previewItems.length;
            updatePreviewImage();
        }
    }

    function showNextPreview() {
        if (previewItems.length > 1) {
            currentPreviewIndex = (currentPreviewIndex + 1) % previewItems.length;
            updatePreviewImage();
        }
    }

    function updatePreviewImage() {
        const img = previewContent.querySelector('.preview-image');
        if (img) {
            img.src = previewItems[currentPreviewIndex];
        }
        previewTitle.textContent = `图片预览 (${currentPreviewIndex + 1}/${previewItems.length})`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function addHoverPreviews() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if (target.classList.contains('message-image')) {
                target.style.cursor = 'pointer';
            }
        });
    }

    // ========== 彩色用户名功能 ==========
    let userColors = {};
    let specialBadgeEnabled = true;

    const colorPresets = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
        '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'
    ];

    function initUserColors() {
        loadUserColors();
        setupUserColorListeners();
        applyUserColors();
    }

    function loadUserColors() {
        const saved = localStorage.getItem('userColors');
        if (saved) {
            userColors = JSON.parse(saved);
        }

        const savedBadge = localStorage.getItem('specialBadgeEnabled');
        if (savedBadge !== null) {
            specialBadgeEnabled = JSON.parse(savedBadge);
        }
    }

    function saveUserColors() {
        localStorage.setItem('userColors', JSON.stringify(userColors));
        localStorage.setItem('specialBadgeEnabled', JSON.stringify(specialBadgeEnabled));
    }

    function getUserColor(username) {
        if (userColors[username]) {
            return userColors[username];
        }

        const colorIndex = Math.abs(hashCode(username)) % colorPresets.length;
        const color = colorPresets[colorIndex];
        userColors[username] = color;
        saveUserColors();
        return color;
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    function setupUserColorListeners() {
        const userColorsBtn = document.getElementById('userColorsBtn');
        const userColorsPanel = document.getElementById('userColorsPanel');
        const userColorsClose = document.getElementById('userColorsClose');

        userColorsBtn.addEventListener('click', () => {
            userColorsPanel.classList.toggle('active');
        });

        userColorsClose.addEventListener('click', () => {
            userColorsPanel.classList.remove('active');
        });

        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                customBubbleColor = preset.dataset.color;
                saveBubbleSettings();
                applyBubbleStyles();
            });
        });

        document.getElementById('userCustomColorPicker').addEventListener('input', (e) => {
            customBubbleColor = e.target.value;
            saveBubbleSettings();
            applyBubbleStyles();
        });

        document.getElementById('specialBadgeToggle').addEventListener('change', (e) => {
            specialBadgeEnabled = e.target.checked;
            saveUserColors();
            applyUserColors();
        });

        document.getElementById('resetUserColorsBtn').addEventListener('click', () => {
            if (confirm('确定要重置所有用户颜色吗？')) {
                userColors = {};
                saveUserColors();
                applyUserColors();
                alert('用户颜色已重置');
            }
        });
    }

    function applyUserColors() {
        document.getElementById('specialBadgeToggle').checked = specialBadgeEnabled;
    }

    function getUserColorClass(username) {
        const color = getUserColor(username);
        const index = colorPresets.indexOf(color);
        if (index !== -1) {
            return 'user-color-' + (index + 1);
        }
        return '';
    }

    function shouldShowSpecialBadge(username, isVIP, isAdmin) {
        if (!specialBadgeEnabled) return false;
        return isVIP || isAdmin;
    }

    // ========== 聊天记录备份功能 ==========
    let backupTimeRange = 'all';
    let autoBackupEnabled = false;
    let autoBackupInterval = null;

    const backupPanel = document.getElementById('backupPanel');
    const backupClose = document.getElementById('backupClose');
    const exportChatBtn = document.getElementById('exportChatBtn');
    const importChatBtn = document.getElementById('importChatBtn');
    const backupRoomSelect = document.getElementById('backupRoom');

    function initBackupFeature() {
        loadBackupSettings();
        setupBackupListeners();
        updateBackupRoomOptions();
        setupAutoBackup();
    }

    function loadBackupSettings() {
        const saved = localStorage.getItem('backupSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            backupTimeRange = settings.timeRange || 'all';
            autoBackupEnabled = settings.autoBackup || false;
        }
    }

    function saveBackupSettings() {
        localStorage.setItem('backupSettings', JSON.stringify({
            timeRange: backupTimeRange,
            autoBackup: autoBackupEnabled
        }));
    }

    function setupBackupListeners() {
        const exportBtn = document.getElementById('exportBtn');

        exportBtn.addEventListener('click', () => {
            backupPanel.classList.toggle('active');
        });

        backupClose.addEventListener('click', () => {
            backupPanel.classList.remove('active');
        });

        document.querySelectorAll('.time-range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-range-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                backupTimeRange = btn.dataset.range;
                saveBackupSettings();
            });
        });

        exportChatBtn.addEventListener('click', exportChat);

        importChatBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    importChat(file);
                }
            };
            input.click();
        });

        document.getElementById('autoBackupToggle').addEventListener('change', (e) => {
            autoBackupEnabled = e.target.checked;
            saveBackupSettings();
            setupAutoBackup();
        });
    }

    function updateBackupRoomOptions() {
        const roomNames = Object.keys(rooms);
        backupRoomSelect.innerHTML = '<option value="all">所有房间</option>';

        roomNames.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = room;
            backupRoomSelect.appendChild(option);
        });
    }

    function exportChat() {
        const format = document.getElementById('backupFormat').value;
        const room = document.getElementById('backupRoom').value;
        const includeImages = document.getElementById('backupIncludeImages').checked;
        const includeFiles = document.getElementById('backupIncludeFiles').checked;

        let filteredMessages = allMessages;

        if (room !== 'all') {
            filteredMessages = filteredMessages.filter(msg => msg.room === room);
        }

        const now = new Date();
        filteredMessages = filteredMessages.filter(msg => {
            const msgDate = new Date(msg.timestamp);
            switch (backupTimeRange) {
                case 'today':
                    return msgDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return msgDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return msgDate >= monthAgo;
                default:
                    return true;
            }
        });

        let content, filename, mimeType;

        if (format === 'html') {
            content = generateHTMLExport(filteredMessages, includeImages, includeFiles);
            filename = `chat-export-${new Date().toISOString().split('T')[0]}.html`;
            mimeType = 'text/html';
        } else if (format === 'json') {
            content = JSON.stringify({
                exportDate: new Date().toISOString(),
                messages: filteredMessages,
                format: format
            }, null, 2);
            filename = `chat-backup-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
        } else {
            content = filteredMessages.map(msg =>
                `[${msg.timestamp}] ${msg.username}: ${msg.content}`
            ).join('\n');
            filename = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
            mimeType = 'text/plain';
        }

        downloadFile(content, filename, mimeType);
        backupPanel.classList.remove('active');
        alert('导出成功！');
    }

    function generateHTMLExport(messages, includeImages, includeFiles) {
        let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天记录导出 - ${new Date().toLocaleString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .message { background: white; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .message-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .message-username { font-weight: 600; color: #667eea; }
        .message-time { color: #999; font-size: 12px; }
        .message-content { color: #333; line-height: 1.6; }
        .message-image { max-width: 100%; border-radius: 8px; margin-top: 10px; }
        .system-message { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 聊天记录</h1>
        <p>导出时间: ${new Date().toLocaleString()}</p>
        <p>消息数量: ${messages.length}</p>
    </div>
`;

        messages.forEach(msg => {
            const isSystem = msg.type === 'system';
            html += `
    <div class="message ${isSystem ? 'system-message' : ''}">
        <div class="message-header">
            <span class="message-username">${msg.username}</span>
            <span class="message-time">${msg.timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
    </div>
`;
        });

        html += `
</body>
</html>
`;
        return html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importChat(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.messages && Array.isArray(data.messages)) {
                    const imported = data.messages.length;
                    allMessages = [...allMessages, ...data.messages];
                    localStorage.setItem('allMessages', JSON.stringify(allMessages));
                    alert(`成功导入 ${imported} 条消息！`);
                    location.reload();
                } else {
                    alert('无效的备份文件格式');
                }
            } catch (error) {
                alert('导入失败：' + error.message);
            }
        };
        reader.readAsText(file);
    }

    function setupAutoBackup() {
        if (autoBackupInterval) {
            clearInterval(autoBackupInterval);
            autoBackupInterval = null;
        }

        if (autoBackupEnabled) {
            autoBackupInterval = setInterval(() => {
                const backup = {
                    timestamp: new Date().toISOString(),
                    messages: allMessages.slice(-100)
                };
                localStorage.setItem('autoBackup', JSON.stringify(backup));
            }, 5 * 60 * 1000);
        }
    }

    // 在页面加载完成后初始化新功能
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNewFeatures);
    } else {
        initNewFeatures();
    }

});
