/**
 * WA Monitor Pro - Advanced WhatsApp Monitoring System
 * Mobile-First Dashboard Implementation
 */

class WAMonitorDashboard {
    constructor() {
        // Initialize Socket.IO with enhanced configuration
        this.socket = io({
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            forceNew: true
        });

        // DOM Elements
        this.elements = {
            // Mobile elements
            mobileMenuBtn: document.getElementById('mobile-menu-btn'),
            mobileLogoutBtn: document.getElementById('mobile-logout-btn'),
            mobileOverlay: document.getElementById('mobile-overlay'),
            backBtn: document.getElementById('back-btn'),

            // Sidebar elements
            sidebar: document.getElementById('sidebar'),
            chatList: document.getElementById('chat-list'),
            searchInput: document.getElementById('search-input'),
            searchClear: document.getElementById('search-clear'),
            refreshBtn: document.getElementById('refresh-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            userName: document.getElementById('user-name'),

            // Main content elements
            welcomeScreen: document.getElementById('welcome-screen'),
            chatScreen: document.getElementById('chat-screen'),
            chatBody: document.getElementById('chat-body'),
            chatContactName: document.getElementById('chat-contact-name'),
            chatContactImg: document.getElementById('chat-contact-img'),
            chatContactStatus: document.getElementById('chat-contact-status'),

            // Action buttons
            exportBtn: document.getElementById('export-btn'),
            searchMessagesBtn: document.getElementById('search-messages-btn'),

            // Message search elements
            messageSearchContainer: document.getElementById('message-search-container'),
            messageSearchInput: document.getElementById('message-search-input'),
            searchResultCounter: document.getElementById('search-result-counter'),
            searchPrevBtn: document.getElementById('search-prev-btn'),
            searchNextBtn: document.getElementById('search-next-btn'),
            searchCloseBtn: document.getElementById('search-close-btn'),

            // Modals
            mediaModal: document.getElementById('mediaModal'),
            exportModal: document.getElementById('exportModal'),
            downloadMediaBtn: document.getElementById('downloadMediaBtn'),
            startExport: document.getElementById('startExport')
        };

        // Application state
        this.state = {
            currentChatId: null,
            allChats: [],
            allContacts: [],
            filteredChats: [],
            isSearching: false,
            isMobileMenuOpen: false,
            currentMessages: [],
            isLoading: false,
            // Message search state
            messageSearchActive: false,
            searchResults: [],
            currentSearchIndex: 0,
            searchQuery: ''
        };

        // Initialize Bootstrap modals
        this.modals = {
            media: new bootstrap.Modal(this.elements.mediaModal),
            export: new bootstrap.Modal(this.elements.exportModal)
        };

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupMobileHandlers();
        this.showWelcomeScreen();

        console.log('WA Monitor Pro Dashboard initialized');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        if (this.elements.searchClear) {
            this.elements.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Action buttons
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => {
                this.showExportModal();
            });
        }

        if (this.elements.startExport) {
            this.elements.startExport.addEventListener('click', () => {
                this.handleExport();
            });
        }

        // Message search functionality
        if (this.elements.searchMessagesBtn) {
            this.elements.searchMessagesBtn.addEventListener('click', () => {
                this.toggleMessageSearch();
            });
        }

        if (this.elements.messageSearchInput) {
            this.elements.messageSearchInput.addEventListener('input', (e) => {
                this.handleMessageSearch(e.target.value);
            });

            this.elements.messageSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.searchPrevious();
                    } else {
                        this.searchNext();
                    }
                } else if (e.key === 'Escape') {
                    this.closeMessageSearch();
                }
            });
        }

        if (this.elements.searchPrevBtn) {
            this.elements.searchPrevBtn.addEventListener('click', () => {
                this.searchPrevious();
            });
        }

        if (this.elements.searchNextBtn) {
            this.elements.searchNextBtn.addEventListener('click', () => {
                this.searchNext();
            });
        }

        if (this.elements.searchCloseBtn) {
            this.elements.searchCloseBtn.addEventListener('click', () => {
                this.closeMessageSearch();
            });
        }

        // Back button for mobile
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => {
                this.showWelcomeScreen();
                this.closeMobileMenu();
            });
        }
    }

    /**
     * Setup mobile-specific handlers
     */
    setupMobileHandlers() {
        // Mobile menu toggle
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Mobile logout
        if (this.elements.mobileLogoutBtn) {
            this.elements.mobileLogoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Mobile overlay - close on overlay click only
        if (this.elements.mobileOverlay) {
            this.elements.mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        this.state.isMobileMenuOpen = !this.state.isMobileMenuOpen;

        if (this.state.isMobileMenuOpen) {
            this.elements.sidebar.classList.add('active');
            this.elements.mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMobileMenu();
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        this.state.isMobileMenuOpen = false;
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove('active');
        }
        if (this.elements.mobileOverlay) {
            this.elements.mobileOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    /**
     * Format timestamp to time string
     */
    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Format timestamp to date string
     */
    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const messageTime = timestamp * 1000;
        const diffMs = now - messageTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return this.formatDate(timestamp);
    }

    /**
     * Format WhatsApp text with markdown-like formatting
     */
    formatWhatsAppText(text) {
        if (!text) return '';

        // Escape HTML first
        text = text.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');

        // Bold: *text*
        text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

        // Italic: _text_
        text = text.replace(/_(.*?)_/g, '<em>$1</em>');

        // Strikethrough: ~text~
        text = text.replace(/~(.*?)~/g, '<del>$1</del>');

        // Monospace: ```text```
        text = text.replace(/```(.*?)```/gs, '<code>$1</code>');

        // Monospace (single line): `text`
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');

        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        // Convert newlines to <br>
        text = text.replace(/\n/g, '<br>');

        // Convert emoji if joypixels is available
        if (window.joypixels) {
            text = window.joypixels.shortnameToImage(text);
        }

        return text;
    }

    /**
     * Get contact name from ID
     */
    getContactName(id) {
        // Remove @c.us from ID
        const formattedId = id.replace('@c.us', '').replace('@g.us', '');

        // Find in contacts list
        const contact = this.state.allContacts.find(c => c.id._serialized === id);

        if (contact && contact.name) {
            return contact.name;
        } else if (contact && contact.pushname) {
            return contact.pushname;
        } else {
            // Format phone number nicely
            if (formattedId.match(/^\d+$/)) {
                return `+${formattedId}`;
            }
            return formattedId;
        }
    }

    /**
     * Generate avatar initials from name
     */
    getAvatarInitials(name) {
        if (!name) return '?';

        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        } else {
            return name.substring(0, 2).toUpperCase();
        }
    }

    /**
     * Generate avatar color based on name
     */
    getAvatarColor(name) {
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
            '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Handle search functionality
     */
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (searchTerm === '') {
            this.clearSearch();
            return;
        }

        this.state.isSearching = true;
        this.state.filteredChats = this.state.allChats.filter(chat => {
            const contactName = this.getContactName(chat.id._serialized).toLowerCase();
            const lastMessage = chat.lastMessage ? chat.lastMessage.body.toLowerCase() : '';

            return contactName.includes(searchTerm) || lastMessage.includes(searchTerm);
        });

        this.renderChatList(this.state.filteredChats);
        this.showSearchClear();
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.elements.searchInput.value = '';
        this.state.isSearching = false;
        this.state.filteredChats = [];
        this.renderChatList(this.state.allChats);
        this.hideSearchClear();
    }

    /**
     * Show search clear button
     */
    showSearchClear() {
        if (this.elements.searchClear) {
            this.elements.searchClear.classList.remove('d-none');
        }
    }

    /**
     * Hide search clear button
     */
    hideSearchClear() {
        if (this.elements.searchClear) {
            this.elements.searchClear.classList.add('d-none');
        }
    }

    /**
     * Refresh data
     */
    refreshData() {
        this.showLoading('Refreshing data...');
        this.socket.emit('refresh-data');

        // Auto-hide loading after 3 seconds
        setTimeout(() => {
            this.hideLoading();
        }, 3000);
    }

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout? This will disconnect the WhatsApp session.')) {
            this.showLoading('Logging out...');
            this.socket.disconnect();

            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        }
    }

    /**
     * Show export modal
     */
    showExportModal() {
        if (!this.state.currentChatId) {
            alert('Please select a chat first');
            return;
        }

        this.modals.export.show();
    }

    /**
     * Handle export
     */
    handleExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const range = document.getElementById('exportRange').value;

        if (!this.state.currentChatId) {
            alert('No chat selected');
            return;
        }

        this.showLoading('Preparing export...');

        // Emit export request to server
        this.socket.emit('export-chat', {
            chatId: this.state.currentChatId,
            format: format,
            range: range
        });

        this.modals.export.hide();
    }

    /**
     * Render chat list
     */
    renderChatList(chats) {
        if (!this.elements.chatList) return;

        this.elements.chatList.innerHTML = '';

        if (!chats || chats.length === 0) {
            this.elements.chatList.innerHTML = `
                <div class="loading-state">
                    <p class="loading-text">No conversations found</p>
                </div>
            `;
            return;
        }

        // Sort chats by last message timestamp (newest first)
        const sortedChats = [...chats].sort((a, b) => {
            if (a.lastMessage && b.lastMessage) {
                return b.lastMessage.timestamp - a.lastMessage.timestamp;
            } else if (a.lastMessage) {
                return -1;
            } else if (b.lastMessage) {
                return 1;
            } else {
                return 0;
            }
        });

        sortedChats.forEach(chat => {
            const contactName = chat.isGroup ? chat.name : this.getContactName(chat.id._serialized);
            const lastMessage = chat.lastMessage ?
                (chat.lastMessage.hasMedia ? '📎 Media' :
                 chat.lastMessage.body.substring(0, 40) + (chat.lastMessage.body.length > 40 ? '...' : '')) :
                'No messages yet';
            const lastMessageTime = chat.lastMessage ? this.formatRelativeTime(chat.lastMessage.timestamp) : '';
            const unreadCount = chat.unreadCount || 0;
            const initials = this.getAvatarInitials(contactName);
            const avatarColor = this.getAvatarColor(contactName);

            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${this.state.currentChatId === chat.id._serialized ? 'active' : ''} ${chat.isGroup ? 'group-chat' : ''}`;
            chatItem.dataset.chatId = chat.id._serialized;

            chatItem.innerHTML = `
                <div class="chat-avatar" style="background: ${avatarColor}">
                    ${initials}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${this.escapeHtml(contactName)}</div>
                    <div class="chat-last-message">${this.escapeHtml(lastMessage)}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${lastMessageTime}</div>
                    ${unreadCount > 0 ? `<div class="chat-badge">${unreadCount}</div>` : ''}
                </div>
            `;

            chatItem.addEventListener('click', () => {
                this.selectChat(chat.id._serialized, contactName);
            });

            this.elements.chatList.appendChild(chatItem);
        });
    }

    /**
     * Select a chat
     */
    selectChat(chatId, contactName) {
        // Remove active class from all chat items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected chat item
        const selectedItem = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        // Show chat
        this.showChat(chatId, contactName);

        // Close mobile menu if open
        this.closeMobileMenu();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show chat screen
     */
    showChat(chatId, contactName) {
        this.state.currentChatId = chatId;

        // Show chat screen
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.chatScreen.classList.add('active');
        this.elements.chatScreen.style.display = 'flex';

        // Set contact information
        if (this.elements.chatContactName) {
            this.elements.chatContactName.textContent = contactName;
        }

        if (this.elements.chatContactImg) {
            const initials = this.getAvatarInitials(contactName);
            const avatarColor = this.getAvatarColor(contactName);
            this.elements.chatContactImg.innerHTML = `<i class="bi bi-person"></i>`;
            this.elements.chatContactImg.style.background = avatarColor;
        }

        // Show loading in chat body
        this.showChatLoading();

        // Request messages for this chat
        this.socket.emit('get-messages', chatId);
    }

    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        this.state.currentChatId = null;
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.chatScreen.classList.remove('active');
        this.elements.chatScreen.style.display = 'none';

        // Remove active class from all chat items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    /**
     * Show loading in chat body
     */
    showChatLoading() {
        if (!this.elements.chatBody) return;

        this.elements.chatBody.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="loading-text">Loading messages...</p>
            </div>
        `;
    }

    /**
     * Show general loading state
     */
    showLoading(message = 'Loading...') {
        this.state.isLoading = true;
        // You can implement a global loading indicator here
        console.log(message);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.state.isLoading = false;
        // Hide global loading indicator
    }

    /**
     * Setup socket event listeners
     */
    setupSocketListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.hideLoading();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showLoading('Connection lost. Reconnecting...');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.showLoading('Connection error. Retrying...');
        });

        // WhatsApp events
        this.socket.on('authenticated', () => {
            console.log('WhatsApp authenticated');
        });

        this.socket.on('ready', () => {
            console.log('WhatsApp ready');
        });

        this.socket.on('qr', () => {
            // Redirect to login if QR code is needed
            window.location.href = '/index.html';
        });

        // Data events
        this.socket.on('chats', (chats) => {
            console.log(`Received ${chats ? chats.length : 0} chats`);
            this.state.allChats = chats || [];
            this.renderChatList(this.state.allChats);
        });

        this.socket.on('contacts', (contacts) => {
            console.log(`Received ${contacts ? contacts.length : 0} contacts`);
            this.state.allContacts = contacts || [];
            // Re-render chat list with updated contact names
            if (this.state.allChats.length > 0) {
                this.renderChatList(this.state.allChats);
            }
        });

        this.socket.on('messages', (data) => {
            console.log(`Received messages for chat ${data.chatId}`);
            if (data.chatId === this.state.currentChatId) {
                this.state.currentMessages = data.messages || [];
                this.renderMessages(data.chatId, data.messages);
            }
        });

        this.socket.on('new-message', (data) => {
            console.log('New message received');
            // If message is for current chat, refresh messages
            if (this.state.currentChatId === data.chatId) {
                this.socket.emit('get-messages', this.state.currentChatId);
            }
            // Refresh chat list to update last message
            this.refreshChatList();
        });

        this.socket.on('message_deleted', (data) => {
            console.log('Message deleted');
            if (this.state.currentChatId === data.chatId) {
                this.socket.emit('get-messages', this.state.currentChatId);
            }
        });

        this.socket.on('call_log', (data) => {
            console.log('Call log received:', data);
            if (this.state.currentChatId === data.chatId) {
                this.addCallLogToChat(data.callInfo);
            }
        });

        this.socket.on('call-logs', (data) => {
            console.log('Call logs received:', data);
            // Handle call logs display
        });

        this.socket.on('deleted-media', (data) => {
            console.log('Deleted media received:', data);
            // Handle deleted media display
        });

        this.socket.on('media-downloaded', (data) => {
            this.handleMediaDownloaded(data);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            alert('An error occurred: ' + (error.message || 'Unknown error'));
        });
    }

    /**
     * Refresh chat list
     */
    refreshChatList() {
        // Request updated chat list
        this.socket.emit('get-chats');
    }

    /**
     * Render messages for a chat
     */
    renderMessages(chatId, messages) {
        console.log(`Rendering messages for chat ${chatId}`);
        console.log(`Number of messages: ${messages ? messages.length : 0}`);

        if (this.state.currentChatId !== chatId) {
            console.log(`Current chat ID doesn't match requested chat ID`);
            return;
        }

        if (!this.elements.chatBody) return;

        this.elements.chatBody.innerHTML = '';

        if (!messages || messages.length === 0) {
            this.elements.chatBody.innerHTML = `
                <div class="loading-state">
                    <p class="loading-text">No messages in this conversation</p>
                </div>
            `;
            return;
        }

        let currentDate = null;
        const isGroup = chatId.endsWith('@g.us');

        // Sort messages from oldest to newest
        const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

        sortedMessages.forEach(message => {
            const messageDate = this.formatDate(message.timestamp);

            // Add date divider if date changes
            if (messageDate !== currentDate) {
                currentDate = messageDate;
                const dateDivider = document.createElement('div');
                dateDivider.className = 'date-divider';
                dateDivider.innerHTML = `<span>${messageDate}</span>`;
                this.elements.chatBody.appendChild(dateDivider);
            }

            const isFromMe = message.fromMe;
            const messageTime = this.formatTime(message.timestamp);

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isFromMe ? 'sent' : 'received'} fade-in`;

            let messageContent = '';

            // Add sender name for group messages
            if (isGroup && !isFromMe && message.author) {
                const authorName = this.getContactName(message.author);
                messageContent += `<div class="message-author">${this.escapeHtml(authorName)}</div>`;
            }

            // Handle media messages
            if (message.hasMedia) {
                messageContent += this.renderMediaMessage(message, chatId);
            }

            // Handle deleted messages
            if (message._isDeleted) {
                messageContent += this.renderDeletedMessage(message);
            } else if (message.body) {
                const formattedText = this.formatWhatsAppText(message.body);
                messageContent += `<div class="message-text">${formattedText}</div>`;
            }

            messageDiv.innerHTML = `
                <div class="message-content" data-message-id="${message.id ? message.id.id : 'unknown'}">
                    ${messageContent}
                    <div class="message-time">${messageTime}</div>
                </div>
            `;

            this.elements.chatBody.appendChild(messageDiv);
        });

        // Scroll to bottom
        this.scrollToBottom();

        // Setup media click handlers
        this.setupMediaHandlers();
    }

    /**
     * Render media message
     */
    renderMediaMessage(message, chatId) {
        const mediaType = message._data && message._data.mimetype ?
            message._data.mimetype.split('/')[0] :
            (message.mimetype ? message.mimetype.split('/')[0] : 'unknown');

        const messageId = message.id ? message.id.id : 'unknown';

        if (message.mediaPath) {
            // Media already downloaded
            if (mediaType === 'image') {
                return `
                    <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                        <img src="${message.mediaPath}" alt="Image" class="media-preview">
                    </div>
                `;
            } else if (mediaType === 'video') {
                return `
                    <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                        <div class="video-player">
                            <video controls class="media-preview" preload="metadata">
                                <source src="${message.mediaPath}" type="${message.mimetype}">
                                Your browser does not support the video tag.
                            </video>
                            <div class="media-controls">
                                <button class="media-control-btn" onclick="this.previousElementSibling.play()">
                                    <i class="bi bi-play"></i>
                                </button>
                                <button class="media-control-btn" onclick="this.previousElementSibling.previousElementSibling.pause()">
                                    <i class="bi bi-pause"></i>
                                </button>
                                <div class="media-info">Video • ${this.getFileSize(message.mediaPath)}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (mediaType === 'audio') {
                return `
                    <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                        <div class="audio-player">
                            <div class="call-icon">
                                <i class="bi bi-music-note"></i>
                            </div>
                            <audio controls preload="metadata">
                                <source src="${message.mediaPath}" type="${message.mimetype}">
                                Your browser does not support the audio tag.
                            </audio>
                            <div class="media-info">Audio • ${this.getFileSize(message.mediaPath)}</div>
                        </div>
                    </div>
                `;
            } else {
                const filename = message.mediaPath.split('/').pop();
                return `
                    <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                        <div class="document-preview">
                            <i class="bi bi-file-earmark-text document-icon"></i>
                            <div class="document-info">
                                <span class="document-name">${this.escapeHtml(filename)}</span>
                                <a href="${message.mediaPath}" download class="document-download">
                                    <i class="bi bi-download"></i> Download
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // Media not downloaded yet
            const mediaIcons = {
                'image': 'bi-image',
                'video': 'bi-camera-video',
                'audio': 'bi-file-earmark-music',
                'default': 'bi-file-earmark'
            };

            const mediaLabels = {
                'image': 'Photo',
                'video': 'Video',
                'audio': 'Audio',
                'default': 'Document'
            };

            const icon = mediaIcons[mediaType] || mediaIcons.default;
            const label = mediaLabels[mediaType] || mediaLabels.default;

            // Auto-download media
            setTimeout(() => {
                this.socket.emit('download-media', { messageId, chatId });
            }, 500);

            return `
                <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                    <div class="message-media-icon">
                        <i class="bi ${icon}"></i>
                        <span>${label}</span>
                        <div class="media-loading">
                            <div class="spinner"></div>
                            <span>Downloading...</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Render deleted message
     */
    renderDeletedMessage(message) {
        let messageBody = message.body;

        // Try to get body from _data if available
        if (!messageBody && message._data && message._data.body) {
            messageBody = message._data.body;
        }

        let content = '';

        // If message has deleted media, show it
        if (message.hasMedia && message.mediaPath) {
            content += this.renderDeletedMedia(message);
        }

        if (messageBody && messageBody !== '(Pesan ini telah dihapus)') {
            content += `
                <div class="message-text deleted-message">
                    <i class="bi bi-trash"></i> This message was deleted: ${this.formatWhatsAppText(messageBody)}
                </div>
            `;
        } else {
            content += `
                <div class="message-text deleted-message">
                    <i class="bi bi-trash"></i> This message was deleted
                </div>
            `;
        }

        return content;
    }

    /**
     * Render deleted media (still playable)
     */
    renderDeletedMedia(message) {
        const mediaType = message.mimetype ? message.mimetype.split('/')[0] : 'unknown';
        const messageId = message.id ? message.id.id : 'unknown';

        let mediaContent = '';

        if (mediaType === 'image') {
            mediaContent = `
                <div class="message-media deleted-media">
                    <img src="${message.mediaPath}" alt="Deleted Image" class="media-preview">
                </div>
            `;
        } else if (mediaType === 'video') {
            mediaContent = `
                <div class="message-media deleted-media">
                    <div class="video-player">
                        <video controls class="media-preview">
                            <source src="${message.mediaPath}" type="${message.mimetype}">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            `;
        } else if (mediaType === 'audio') {
            mediaContent = `
                <div class="message-media deleted-media">
                    <div class="audio-player">
                        <audio controls>
                            <source src="${message.mediaPath}" type="${message.mimetype}">
                            Your browser does not support the audio tag.
                        </audio>
                        <div class="media-info">
                            <i class="bi bi-music-note"></i> Deleted Audio
                        </div>
                    </div>
                </div>
            `;
        } else {
            const filename = message.mediaPath.split('/').pop();
            mediaContent = `
                <div class="message-media deleted-media">
                    <div class="document-preview">
                        <i class="bi bi-file-earmark-text document-icon"></i>
                        <div class="document-info">
                            <span class="document-name">${this.escapeHtml(filename)} (Deleted)</span>
                            <a href="${message.mediaPath}" download class="document-download">
                                <i class="bi bi-download"></i> Download
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        return mediaContent;
    }

    /**
     * Render call log message
     */
    renderCallMessage(callInfo) {
        const isVideo = callInfo.isVideo;
        const isIncoming = !callInfo.fromMe;
        const duration = callInfo.duration || 0;
        const status = callInfo.status || 'unknown';

        let callIcon = 'bi-telephone';
        let callClass = 'outgoing';
        let callText = 'Outgoing call';
        let fallbackIcon = '📞'; // Emoji fallback

        if (isVideo) {
            callIcon = 'bi-camera-video';
            callClass = 'video';
            callText = isIncoming ? 'Incoming video call' : 'Outgoing video call';
            fallbackIcon = '📹';
        } else {
            if (isIncoming) {
                callIcon = 'bi-telephone-inbound';
                callClass = 'incoming';
                callText = 'Incoming call';
                fallbackIcon = '📞';
            } else {
                callIcon = 'bi-telephone-outbound';
                callClass = 'outgoing';
                callText = 'Outgoing call';
                fallbackIcon = '📞';
            }
        }

        if (status === 'missed') {
            callClass = 'missed';
            callText = 'Missed call';
            fallbackIcon = '❌';
        }

        const durationText = duration > 0 ? this.formatCallDuration(duration) : 'Not answered';

        return `
            <div class="call-message">
                <div class="call-icon ${callClass}">
                    <i class="bi ${callIcon}" style="font-size: 1.125rem;">${fallbackIcon}</i>
                </div>
                <div class="call-info">
                    <div class="call-type">${callText}</div>
                    <div class="call-duration">${durationText}</div>
                    <div class="call-status">${this.formatRelativeTime(callInfo.timestamp / 1000)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Format call duration
     */
    formatCallDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} seconds`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Add call log to chat
     */
    addCallLogToChat(callInfo) {
        if (!this.elements.chatBody) return;

        const callElement = document.createElement('div');
        callElement.className = 'message call-log fade-in';
        callElement.innerHTML = `
            <div class="message-content">
                ${this.renderCallMessage(callInfo)}
                <div class="message-time">${this.formatTime(callInfo.timestamp / 1000)}</div>
            </div>
        `;

        this.elements.chatBody.appendChild(callElement);
        this.scrollToBottom();
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        if (this.elements.chatBody) {
            this.elements.chatBody.scrollTop = this.elements.chatBody.scrollHeight;
        }
    }

    /**
     * Setup media click handlers
     */
    setupMediaHandlers() {
        document.querySelectorAll('.message-media').forEach(media => {
            media.addEventListener('click', (e) => {
                const messageId = media.dataset.messageId;
                const chatId = media.dataset.chatId;

                if (messageId && chatId) {
                    this.handleMediaClick(messageId, chatId);
                }
            });
        });
    }

    /**
     * Handle media click
     */
    handleMediaClick(messageId, chatId) {
        // Request media download
        this.socket.emit('download-media', { messageId, chatId });

        // Show loading in modal
        const modalBody = document.getElementById('mediaModalBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="loading-text">Loading media...</p>
            `;
        }

        // Show modal
        this.modals.media.show();
    }

    /**
     * Handle media downloaded event
     */
    handleMediaDownloaded(data) {
        const { messageId, filePath, mimetype, chatId } = data;
        const mediaType = mimetype.split('/')[0];

        // Update modal content
        let mediaContent = '';

        if (mediaType === 'image') {
            mediaContent = `<img src="${filePath}" class="img-fluid" alt="Image">`;
        } else if (mediaType === 'video') {
            mediaContent = `
                <video controls class="img-fluid">
                    <source src="${filePath}" type="${mimetype}">
                    Your browser does not support the video tag.
                </video>
            `;
        } else if (mediaType === 'audio') {
            mediaContent = `
                <audio controls>
                    <source src="${filePath}" type="${mimetype}">
                    Your browser does not support the audio tag.
                </audio>
            `;
        } else {
            const filename = filePath.split('/').pop();
            mediaContent = `
                <div class="d-flex align-items-center justify-content-center">
                    <i class="bi bi-file-earmark fs-1 me-2"></i>
                    <span>${this.escapeHtml(filename)}</span>
                </div>
            `;
        }

        // Update modal
        const modalBody = document.getElementById('mediaModalBody');
        if (modalBody) {
            modalBody.innerHTML = mediaContent;
        }

        if (this.elements.downloadMediaBtn) {
            this.elements.downloadMediaBtn.href = filePath;
        }

        // Update message in chat if currently active
        if (this.state.currentChatId === chatId) {
            this.updateMediaInChat(messageId, filePath, mimetype);
        }

        // Request server to update message with media path
        this.socket.emit('update-media-path', { messageId, chatId, mediaPath: filePath, mimetype });
    }

    /**
     * Update media in chat
     */
    updateMediaInChat(messageId, filePath, mimetype) {
        const mediaElements = document.querySelectorAll(`.message-media[data-message-id="${messageId}"]`);
        const mediaType = mimetype.split('/')[0];

        mediaElements.forEach(element => {
            if (mediaType === 'image') {
                element.innerHTML = `<img src="${filePath}" alt="Image" class="media-preview">`;
            } else if (mediaType === 'video') {
                element.innerHTML = `
                    <video controls class="media-preview">
                        <source src="${filePath}" type="${mimetype}">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else if (mediaType === 'audio') {
                element.innerHTML = `
                    <audio controls>
                        <source src="${filePath}" type="${mimetype}">
                        Your browser does not support the audio tag.
                    </audio>
                `;
            } else {
                const filename = filePath.split('/').pop();
                element.innerHTML = `
                    <div class="document-preview">
                        <i class="bi bi-file-earmark-text document-icon"></i>
                        <div class="document-info">
                            <span class="document-name">${this.escapeHtml(filename)}</span>
                            <a href="${filePath}" download class="document-download">
                                <i class="bi bi-download"></i> Download
                            </a>
                        </div>
                    </div>
                `;
            }
        });
    }

    /**
     * Get file size (placeholder - would need server support for real file sizes)
     */
    getFileSize(filePath) {
        // This is a placeholder - in real implementation, you'd get this from server
        return 'Unknown size';
    }

    /**
     * Handle sticker messages
     */
    renderStickerMessage(message, chatId) {
        const messageId = message.id ? message.id.id : 'unknown';

        if (message.mediaPath) {
            return `
                <div class="message-media sticker-message" data-message-id="${messageId}" data-chat-id="${chatId}">
                    <img src="${message.mediaPath}" alt="Sticker" class="media-preview">
                </div>
            `;
        } else {
            // Auto-download sticker
            setTimeout(() => {
                this.socket.emit('download-media', { messageId, chatId });
            }, 500);

            return `
                <div class="message-media sticker-message" data-message-id="${messageId}" data-chat-id="${chatId}">
                    <div class="message-media-icon">
                        <i class="bi bi-emoji-smile"></i>
                        <span>Sticker</span>
                        <div class="media-loading">
                            <div class="spinner"></div>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Check if message should not be marked as read
     */
    preventReadReceipt() {
        // This is handled on the server side by not marking messages as read
        // The client just monitors without affecting read status
        console.log('Monitoring mode: Messages will not be marked as read');
    }

    /**
     * Toggle message search
     */
    toggleMessageSearch() {
        if (!this.state.currentChatId) {
            alert('Please select a chat first');
            return;
        }

        this.state.messageSearchActive = !this.state.messageSearchActive;

        if (this.state.messageSearchActive) {
            this.showMessageSearch();
        } else {
            this.closeMessageSearch();
        }
    }

    /**
     * Show message search interface
     */
    showMessageSearch() {
        if (this.elements.messageSearchContainer) {
            this.elements.messageSearchContainer.classList.add('active');
            this.elements.messageSearchInput.focus();
        }
    }

    /**
     * Close message search interface
     */
    closeMessageSearch() {
        this.state.messageSearchActive = false;
        this.state.searchResults = [];
        this.state.currentSearchIndex = 0;
        this.state.searchQuery = '';

        if (this.elements.messageSearchContainer) {
            this.elements.messageSearchContainer.classList.remove('active');
        }

        if (this.elements.messageSearchInput) {
            this.elements.messageSearchInput.value = '';
        }

        // Clear search highlights
        this.clearSearchHighlights();
        this.updateSearchCounter();
    }

    /**
     * Handle message search
     */
    handleMessageSearch(query) {
        this.state.searchQuery = query.trim().toLowerCase();

        if (this.state.searchQuery === '') {
            this.state.searchResults = [];
            this.state.currentSearchIndex = 0;
            this.clearSearchHighlights();
            this.updateSearchCounter();
            return;
        }

        // Search through current messages
        this.searchInMessages();
        this.highlightSearchResults();
        this.updateSearchCounter();

        // Navigate to first result
        if (this.state.searchResults.length > 0) {
            this.state.currentSearchIndex = 0;
            this.scrollToSearchResult(0);
        }
    }

    /**
     * Search in current messages
     */
    searchInMessages() {
        this.state.searchResults = [];

        if (!this.state.currentMessages || this.state.currentMessages.length === 0) {
            return;
        }

        this.state.currentMessages.forEach((message, index) => {
            if (message.body && message.body.toLowerCase().includes(this.state.searchQuery)) {
                this.state.searchResults.push({
                    messageIndex: index,
                    messageId: message.id ? message.id.id : null,
                    text: message.body
                });
            }
        });
    }

    /**
     * Highlight search results in messages
     */
    highlightSearchResults() {
        // Clear previous highlights
        this.clearSearchHighlights();

        if (this.state.searchQuery === '' || this.state.searchResults.length === 0) {
            return;
        }

        // Add highlights to matching messages
        const messageElements = document.querySelectorAll('.message-text');
        messageElements.forEach(element => {
            const text = element.textContent || element.innerText;
            if (text.toLowerCase().includes(this.state.searchQuery)) {
                const highlightedText = this.highlightText(element.innerHTML, this.state.searchQuery);
                element.innerHTML = highlightedText;
                element.closest('.message').classList.add('message-search-result');
            }
        });
    }

    /**
     * Highlight text with search query
     */
    highlightText(text, query) {
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="message-highlight">$1</span>');
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Clear search highlights
     */
    clearSearchHighlights() {
        // Remove highlight spans
        const highlights = document.querySelectorAll('.message-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });

        // Remove search result classes
        const searchResults = document.querySelectorAll('.message-search-result');
        searchResults.forEach(result => {
            result.classList.remove('message-search-result');
        });
    }

    /**
     * Navigate to next search result
     */
    searchNext() {
        if (this.state.searchResults.length === 0) return;

        this.state.currentSearchIndex = (this.state.currentSearchIndex + 1) % this.state.searchResults.length;
        this.scrollToSearchResult(this.state.currentSearchIndex);
        this.updateSearchCounter();
    }

    /**
     * Navigate to previous search result
     */
    searchPrevious() {
        if (this.state.searchResults.length === 0) return;

        this.state.currentSearchIndex = this.state.currentSearchIndex === 0
            ? this.state.searchResults.length - 1
            : this.state.currentSearchIndex - 1;
        this.scrollToSearchResult(this.state.currentSearchIndex);
        this.updateSearchCounter();
    }

    /**
     * Scroll to specific search result
     */
    scrollToSearchResult(index) {
        if (index < 0 || index >= this.state.searchResults.length) return;

        const result = this.state.searchResults[index];
        const messageElements = document.querySelectorAll('.message');

        // Find the message element by content or index
        let targetElement = null;
        messageElements.forEach(element => {
            const messageText = element.querySelector('.message-text');
            if (messageText && messageText.textContent.includes(result.text)) {
                targetElement = element;
            }
        });

        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Temporarily highlight the current result
            targetElement.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
            setTimeout(() => {
                targetElement.style.backgroundColor = '';
            }, 1000);
        }
    }

    /**
     * Update search result counter
     */
    updateSearchCounter() {
        if (!this.elements.searchResultCounter) return;

        if (this.state.searchResults.length === 0) {
            this.elements.searchResultCounter.textContent = '0 of 0';
            this.elements.searchPrevBtn.disabled = true;
            this.elements.searchNextBtn.disabled = true;
        } else {
            this.elements.searchResultCounter.textContent =
                `${this.state.currentSearchIndex + 1} of ${this.state.searchResults.length}`;
            this.elements.searchPrevBtn.disabled = false;
            this.elements.searchNextBtn.disabled = false;
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WAMonitorDashboard();
});


