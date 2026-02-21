// Liberty Reach Messenger - Telegram-style functionality

// State
let currentUser = null;
let currentConversation = null;
let autoTranslate = false;
let chatInfoOpen = false;

// Mock conversations data
const conversations = [
    {
        id: '1',
        name: 'Alice Johnson',
        avatar: 'A',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        lastMessage: 'Hey! How are you doing?',
        time: '10:30 AM',
        unread: 2,
        online: true,
        messages: [
            { id: '1', text: 'Hi there! 👋', sent: false, time: '10:28', status: 'read' },
            { id: '2', text: 'Hey! How are you doing?', sent: false, time: '10:30', status: 'read' }
        ]
    },
    {
        id: '2',
        name: 'Bob Smith',
        avatar: 'B',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        lastMessage: 'See you tomorrow at the meeting!',
        time: 'Yesterday',
        unread: 0,
        online: false,
        messages: [
            { id: '1', text: 'Are we still on for tomorrow?', sent: false, time: '3:00 PM', status: 'read' },
            { id: '2', text: 'Yes, absolutely! See you then', sent: true, time: '3:05 PM', status: 'read' },
            { id: '3', text: 'See you tomorrow at the meeting!', sent: false, time: '3:10 PM', status: 'read' }
        ]
    },
    {
        id: '3',
        name: 'Charlie Brown',
        avatar: 'C',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        lastMessage: 'Thanks for your help! Really appreciate it',
        time: 'Monday',
        unread: 0,
        online: true,
        messages: [
            { id: '1', text: 'Can you help me with this project?', sent: false, time: '2:00 PM', status: 'read' },
            { id: '2', text: 'Sure! What do you need help with?', sent: true, time: '2:05 PM', status: 'read' },
            { id: '3', text: 'Thanks for your help! Really appreciate it', sent: false, time: '2:30 PM', status: 'read' }
        ]
    },
    {
        id: '4',
        name: 'Diana Prince',
        avatar: 'D',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        lastMessage: '👍 Sounds good!',
        time: 'Sunday',
        unread: 1,
        online: false,
        messages: [
            { id: '1', text: 'Did you see the news about the new feature?', sent: true, time: '1:00 PM', status: 'read' },
            { id: '2', text: '👍 Sounds good!', sent: false, time: '1:05 PM', status: 'delivered' }
        ]
    },
    {
        id: '5',
        name: 'Edward Norton',
        avatar: 'E',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        lastMessage: 'Let me check and get back to you',
        time: 'Last week',
        unread: 0,
        online: true,
        messages: [
            { id: '1', text: 'Do you have the documents?', sent: true, time: '10:00 AM', status: 'read' },
            { id: '2', text: 'Let me check and get back to you', sent: false, time: '10:15 AM', status: 'read' }
        ]
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadConversations();
    setupEventListeners();
    startTypingSimulation();
});

// Check user session
function checkSession() {
    const savedUser = localStorage.getItem('username');
    if (!savedUser) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = savedUser;
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterConversations);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Load conversations list
function loadConversations() {
    const list = document.getElementById('conversationsList');
    list.innerHTML = '';
    
    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.onclick = () => openConversation(conv.id);
        item.innerHTML = `
            <div class="conv-avatar" style="background: ${conv.color}">${conv.avatar}</div>
            <div class="conv-info">
                <div class="conv-top">
                    <span class="conv-name">${conv.name}</span>
                    <span class="conv-time">${conv.time}</span>
                </div>
                <div class="conv-preview">
                    <span>${conv.lastMessage}</span>
                    ${conv.unread > 0 ? `<span class="conv-unread">${conv.unread}</span>` : ''}
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// Filter conversations
function filterConversations() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const items = document.querySelectorAll('.conversation-item');
    
    items.forEach(item => {
        const name = item.querySelector('.conv-name').textContent.toLowerCase();
        const preview = item.querySelector('.conv-preview span').textContent.toLowerCase();
        
        if (name.includes(query) || preview.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Open conversation
function openConversation(convId) {
    currentConversation = conversations.find(c => c.id === convId);
    if (!currentConversation) return;
    
    // Update UI
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('messagesList').style.display = 'flex';
    document.getElementById('inputContainer').style.display = 'block';
    document.getElementById('chatHeader').style.display = 'flex';
    
    // Update header
    document.getElementById('chatName').textContent = currentConversation.name;
    document.getElementById('chatAvatar').textContent = currentConversation.avatar;
    document.getElementById('chatAvatar').style.background = currentConversation.color;
    document.getElementById('chatStatus').textContent = currentConversation.online ? 'online' : 'last seen recently';
    
    // Update info panel
    document.getElementById('infoName').textContent = currentConversation.name;
    document.getElementById('infoAvatar').textContent = currentConversation.avatar;
    document.getElementById('infoAvatar').style.background = currentConversation.color;
    
    // Mark as read
    currentConversation.unread = 0;
    loadConversations();
    
    // Highlight active
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load messages
    loadMessages();
}

// Load messages
function loadMessages() {
    const container = document.getElementById('messagesList');
    container.innerHTML = '';
    
    currentConversation.messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.sent ? 'sent' : 'received'}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <div class="message-text">${msg.text}</div>
                <div class="message-meta">
                    <span class="message-time">${msg.time}</span>
                    ${msg.sent ? `<span class="message-status">${msg.status === 'read' ? '✓✓' : '✓'}</span>` : ''}
                </div>
                ${autoTranslate && !msg.sent ? '<div class="translate-badge">🌐 Translated</div>' : ''}
            </div>
        `;
        container.appendChild(messageEl);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Send message
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !currentConversation) return;
    
    const newMessage = {
        id: Date.now().toString(),
        text: text,
        sent: true,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: 'sent'
    };
    
    currentConversation.messages.push(newMessage);
    currentConversation.lastMessage = text;
    currentConversation.time = 'Now';
    
    input.value = '';
    loadMessages();
    loadConversations();
    
    // Update message status to delivered
    setTimeout(() => {
        newMessage.status = 'delivered';
        loadMessages();
    }, 1000);
    
    // Simulate reply
    setTimeout(() => {
        simulateReply();
    }, 2000 + Math.random() * 3000);
}

// Simulate reply
function simulateReply() {
    if (!currentConversation) return;
    
    const replies = [
        'That\'s interesting! Tell me more',
        'I see what you mean 👍',
        'Haha, nice one! 😄',
        'Absolutely agree with you',
        'Let me think about it...',
        'Sounds good to me!',
        'Thanks for letting me know',
        '😊👍',
        'Really? That\'s cool!',
        'I\'ll get back to you on this'
    ];
    
    const reply = {
        id: Date.now().toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sent: false,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        status: 'read'
    };
    
    currentConversation.messages.push(reply);
    currentConversation.lastMessage = reply.text;
    currentConversation.time = 'Now';
    
    loadMessages();
    loadConversations();
}

// Typing simulation
function startTypingSimulation() {
    setInterval(() => {
        if (currentConversation && Math.random() > 0.7 && currentConversation.online) {
            const statusEl = document.getElementById('chatStatus');
            const originalStatus = statusEl.textContent;
            statusEl.textContent = 'typing...';
            
            setTimeout(() => {
                statusEl.textContent = originalStatus;
            }, 2000);
        }
    }, 10000);
}

// Toggle chat info panel
function toggleChatInfo() {
    chatInfoOpen = !chatInfoOpen;
    document.getElementById('chatInfoPanel').classList.toggle('show', chatInfoOpen);
}

// Toggle translation
function toggleTranslation() {
    autoTranslate = !autoTranslate;
    document.getElementById('translateToggle').textContent = autoTranslate ? 'On' : 'Off';
    if (currentConversation) loadMessages();
}

// Actions
function attachFile() {
    alert('File attachment feature coming soon!\n\nSupported formats:\n📷 Photos\n🎥 Videos\n📄 Documents\n🎵 Audio');
}

function toggleEmoji() {
    alert('Emoji picker coming soon! 😊😎😍👍');
}

function startCall() {
    if (!currentConversation) return;
    alert(`📞 Starting voice call with ${currentConversation.name}...\n\nVoice call feature coming soon!`);
}

function startVideoCall() {
    if (!currentConversation) return;
    alert(`📹 Starting video call with ${currentConversation.name}...\n\nVideo call feature coming soon!`);
}

function clearHistory() {
    if (!currentConversation) return;
    if (confirm('Clear chat history with ' + currentConversation.name + '?')) {
        currentConversation.messages = [];
        loadMessages();
        loadConversations();
    }
}

function blockContact() {
    if (!currentConversation) return;
    if (confirm('Block ' + currentConversation.name + '?')) {
        alert(currentConversation.name + ' has been blocked.');
        conversations.splice(conversations.indexOf(currentConversation), 1);
        loadConversations();
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('messagesList').style.display = 'none';
        document.getElementById('inputContainer').style.display = 'none';
        document.getElementById('chatInfoPanel').classList.remove('show');
    }
}

// Logout
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}
