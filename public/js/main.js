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
            chatInfoModal: document.getElementById('chatInfoModal'),
            downloadMediaBtn: document.getElementById('downloadMediaBtn'),
            startExport: document.getElementById('startExport'),

            // Chat menu items
            chatInfoBtn: document.getElementById('chat-info-btn'),
            archiveChatBtn: document.getElementById('archive-chat-btn'),
            clearHistoryBtn: document.getElementById('clear-history-btn'),
            exportFromInfoBtn: document.getElementById('export-from-info'),

            // Download all messages
            downloadAllBtn: document.getElementById('download-all-btn'),
            downloadProgressModal: document.getElementById('downloadProgressModal'),
            stopDownloadBtn: document.getElementById('stop-download-btn'),
            closeDownloadModal: document.getElementById('close-download-modal'),

            // Contact details and status
            contactDetailsBtn: document.getElementById('contact-details-btn'),
            contactDetailsModal: document.getElementById('contactDetailsModal'),
            statusBtn: document.getElementById('status-btn'),
            statusModal: document.getElementById('statusModal'),
            messageContactBtn: document.getElementById('message-contact-btn'),
            statusViewerModal: document.getElementById('statusViewerModal'),
            statusPrevBtn: document.getElementById('status-prev-btn'),
            statusNextBtn: document.getElementById('status-next-btn')
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
            export: new bootstrap.Modal(this.elements.exportModal),
            chatInfo: new bootstrap.Modal(this.elements.chatInfoModal),
            downloadProgress: new bootstrap.Modal(this.elements.downloadProgressModal),
            contactDetails: new bootstrap.Modal(this.elements.contactDetailsModal),
            status: new bootstrap.Modal(this.elements.statusModal),
            statusViewer: new bootstrap.Modal(this.elements.statusViewerModal)
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
        this.requestNotificationPermission();
        this.setupBackgroundSync();
        this.showWelcomeScreen();

        console.log('WA Monitor Pro Dashboard initialized');

        // Setup service worker message listener
        this.setupServiceWorkerListener();

        // Setup test notification button
        this.setupTestNotificationButton();
    }

    /**
     * Request notification permission from user
     */
    async requestNotificationPermission() {
        console.log('Requesting notification permission...');
        console.log('Notification support:', 'Notification' in window);
        console.log('Current permission:', Notification.permission);

        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    console.log('Permission result:', permission);

                    if (permission === 'granted') {
                        console.log('Notification permission granted');
                        this.showNotificationStatus('Notifikasi diaktifkan! Anda akan menerima pemberitahuan untuk pesan baru.', 'success');

                        // Show test notification
                        setTimeout(() => {
                            this.showTestNotification();
                        }, 2000);
                    } else {
                        console.log('Notification permission denied');
                        this.showNotificationStatus('Notifikasi ditolak. Anda tidak akan menerima pemberitahuan pesan baru.', 'warning');
                    }
                } catch (error) {
                    console.error('Error requesting notification permission:', error);
                }
            } else if (Notification.permission === 'granted') {
                console.log('Notification permission already granted');
                this.showNotificationStatus('Notifikasi sudah diaktifkan sebelumnya.', 'info');
            } else {
                console.log('Notification permission denied');
                this.showNotificationStatus('Notifikasi diblokir. Silakan aktifkan di pengaturan browser.', 'warning');
            }
        } else {
            console.log('Notifications not supported');
            this.showNotificationStatus('Browser tidak mendukung notifikasi.', 'warning');
        }
    }

    /**
     * Setup background sync for message synchronization
     */
    async setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('Background sync supported and service worker ready');

                // Register background sync
                await registration.sync.register('background-sync-messages');
                console.log('Background sync registered for messages');

                this.showNotificationStatus('Sinkronisasi background diaktifkan! Pesan akan tetap tersinkron meskipun tab ditutup.', 'info');
            } catch (error) {
                console.error('Error setting up background sync:', error);
            }
        } else {
            console.log('Background sync not supported');
        }
    }

    /**
     * Show notification status to user
     */
    showNotificationStatus(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-bell me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Show browser notification for new message
     */
    showBrowserNotification(message, chatId) {
        console.log('Attempting to show browser notification:', { message, chatId, permission: Notification.permission });

        if (Notification.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }

        // Don't show notification if the chat is currently open
        if (this.state.currentChatId === chatId) {
            console.log('Chat is currently open, skipping notification');
            return;
        }

        // Get contact/chat name
        const chatName = this.getChatName(chatId);

        // Prepare notification content
        let notificationTitle = chatName || 'WhatsApp Message';
        let notificationBody = '';
        let notificationIcon = '/favicon.ico';

        if (message && message.hasMedia) {
            // Media message
            const mediaType = message._data && message._data.mimetype ?
                message._data.mimetype.split('/')[0] : 'media';

            switch(mediaType) {
                case 'image':
                    notificationBody = '📷 Photo';
                    break;
                case 'video':
                    notificationBody = '🎥 Video';
                    break;
                case 'audio':
                    notificationBody = '🎵 Audio';
                    break;
                default:
                    notificationBody = '📎 Document';
            }
        } else if (message && message.body) {
            // Text message
            notificationBody = message.body.length > 50 ?
                message.body.substring(0, 50) + '...' :
                message.body;
        } else {
            notificationBody = 'Pesan baru diterima';
        }

        console.log('Creating notification:', { title: notificationTitle, body: notificationBody });

        try {
            // Create and show notification
            const notification = new Notification(notificationTitle, {
                body: notificationBody,
                icon: notificationIcon,
                badge: notificationIcon,
                tag: chatId, // This will replace previous notifications from same chat
                requireInteraction: false,
                silent: false
            });

            console.log('Notification created successfully');

            // Handle notification click
            notification.onclick = () => {
                console.log('Notification clicked');
                window.focus();
                this.selectChat(chatId);
                notification.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    /**
     * Show test notification to verify notifications are working
     */
    showTestNotification() {
        if (Notification.permission !== 'granted') {
            return;
        }

        try {
            const notification = new Notification('WhatsApp Monitor Test', {
                body: 'Notifikasi berfungsi dengan baik! 🎉',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'test-notification',
                requireInteraction: false,
                silent: false
            });

            notification.onclick = () => {
                console.log('Test notification clicked');
                window.focus();
                notification.close();
            };

            setTimeout(() => {
                notification.close();
            }, 5000);

            console.log('Test notification shown');
        } catch (error) {
            console.error('Error showing test notification:', error);
        }
    }

    /**
     * Get chat name from chat ID
     */
    getChatName(chatId) {
        // Try to find in chats list
        const chat = this.state.allChats.find(c => c.id._serialized === chatId);
        if (chat) {
            return chat.name || chat.id.user;
        }

        // Try to find in contacts
        const contact = this.state.contacts.find(c => c.id._serialized === chatId);
        if (contact) {
            return contact.name || contact.pushname || contact.id.user;
        }

        // Fallback to phone number
        return chatId.split('@')[0];
    }

    /**
     * Setup service worker message listener
     */
    setupServiceWorkerListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Message from service worker:', event.data);

                if (event.data && event.data.type === 'SYNC_COMPLETE') {
                    this.handleBackgroundSyncComplete(event.data.data);
                }
            });

            // Trigger periodic background sync
            setInterval(() => {
                this.triggerBackgroundSync();
            }, 30000); // Every 30 seconds
        }
    }

    /**
     * Trigger background sync
     */
    async triggerBackgroundSync() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'SYNC_MESSAGES'
                    });
                }
            } catch (error) {
                console.error('Error triggering background sync:', error);
            }
        }
    }

    /**
     * Handle background sync completion
     */
    handleBackgroundSyncComplete(data) {
        console.log('Background sync completed:', data);

        // Show sync status
        this.showSyncStatus('Pesan tersinkronisasi', 'success');

        // Refresh chat list if needed
        if (this.state.allChats.length !== data.totalChats) {
            this.refreshChatList();
        }
    }

    /**
     * Show sync status indicator
     */
    showSyncStatus(message, type = 'success') {
        // Remove existing sync status
        const existingStatus = document.querySelector('.sync-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        const syncStatus = document.createElement('div');
        syncStatus.className = `sync-status ${type}`;

        let icon = '';
        switch(type) {
            case 'success':
                icon = '<i class="bi bi-check-circle"></i>';
                break;
            case 'syncing':
                icon = '<div class="spinner"></div>';
                break;
            case 'error':
                icon = '<i class="bi bi-exclamation-triangle"></i>';
                break;
        }

        syncStatus.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;

        document.body.appendChild(syncStatus);

        // Auto remove after 3 seconds (except for syncing status)
        if (type !== 'syncing') {
            setTimeout(() => {
                if (syncStatus && syncStatus.parentNode) {
                    syncStatus.remove();
                }
            }, 3000);
        }
    }

    /**
     * Setup test notification button
     */
    setupTestNotificationButton() {
        // Wait for DOM to be ready
        setTimeout(() => {
            const testBtn = document.getElementById('test-notification-btn');
            console.log('Looking for test notification button:', testBtn);

            if (testBtn) {
                console.log('Test notification button found, adding event listener');
                testBtn.addEventListener('click', () => {
                    console.log('Test notification button clicked');

                    if (Notification.permission === 'granted') {
                        this.showTestNotification();
                    } else if (Notification.permission === 'default') {
                        this.requestNotificationPermission().then(() => {
                            if (Notification.permission === 'granted') {
                                this.showTestNotification();
                            }
                        });
                    } else {
                        alert('Notifikasi diblokir. Silakan aktifkan notifikasi di pengaturan browser.');
                    }
                });
            } else {
                console.log('Test notification button not found in DOM');
            }
        }, 1000);
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

        // Chat menu items
        if (this.elements.chatInfoBtn) {
            this.elements.chatInfoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showChatInfo();
            });
        }

        if (this.elements.archiveChatBtn) {
            this.elements.archiveChatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.archiveChat();
            });
        }

        if (this.elements.clearHistoryBtn) {
            this.elements.clearHistoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearChatHistory();
            });
        }

        if (this.elements.exportFromInfoBtn) {
            this.elements.exportFromInfoBtn.addEventListener('click', () => {
                this.modals.chatInfo.hide();
                this.modals.export.show();
            });
        }

        // Download all messages
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.addEventListener('click', () => {
                this.startDownloadAll();
            });
        }

        if (this.elements.stopDownloadBtn) {
            this.elements.stopDownloadBtn.addEventListener('click', () => {
                this.stopDownload();
            });
        }

        if (this.elements.closeDownloadModal) {
            this.elements.closeDownloadModal.addEventListener('click', () => {
                this.modals.downloadProgress.hide();
            });
        }

        // Contact details
        if (this.elements.contactDetailsBtn) {
            this.elements.contactDetailsBtn.addEventListener('click', () => {
                this.showContactDetails();
            });
        }

        // Status button
        if (this.elements.statusBtn) {
            this.elements.statusBtn.addEventListener('click', () => {
                this.showStatus();
            });
        }

        // Message contact button
        if (this.elements.messageContactBtn) {
            this.elements.messageContactBtn.addEventListener('click', () => {
                this.modals.contactDetails.hide();
                // Focus on current chat if it's the same contact
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
        const format = document.querySelector('input[name="exportFormat"]:checked')?.value || 'json';
        const range = document.getElementById('exportRange')?.value || 'all';

        if (!this.state.currentChatId) {
            alert('No chat selected');
            return;
        }

        if (!this.state.currentMessages || this.state.currentMessages.length === 0) {
            alert('No messages to export');
            return;
        }

        this.showLoading('Preparing export...');

        // Generate export data
        const exportData = this.generateExportData(format, range);

        // Download the file
        this.downloadExportFile(exportData, format);

        this.modals.export.hide();
        this.hideLoading();
    }

    /**
     * Generate export data
     */
    generateExportData(format, range) {
        let messages = [...this.state.currentMessages];

        // Filter by date range
        if (range !== 'all') {
            const now = Date.now();
            let cutoffTime;

            switch (range) {
                case 'today':
                    cutoffTime = now - (24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoffTime = 0;
            }

            messages = messages.filter(msg => (msg.timestamp * 1000) >= cutoffTime);
        }

        // Sort messages by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);

        // Generate data based on format
        switch (format) {
            case 'json':
                return this.generateJSONExport(messages);
            case 'txt':
                return this.generateTextExport(messages);
            case 'html':
                return this.generateHTMLExport(messages);
            default:
                return this.generateJSONExport(messages);
        }
    }

    /**
     * Generate JSON export
     */
    generateJSONExport(messages) {
        const exportData = {
            chatId: this.state.currentChatId,
            contactName: this.getContactName(this.state.currentChatId),
            exportDate: new Date().toISOString(),
            messageCount: messages.length,
            messages: messages.map(msg => ({
                id: msg.id?.id || 'unknown',
                timestamp: msg.timestamp,
                date: new Date(msg.timestamp * 1000).toISOString(),
                fromMe: msg.fromMe,
                author: msg.author,
                body: msg.body || '',
                hasMedia: msg.hasMedia || false,
                mediaType: msg.mimetype ? msg.mimetype.split('/')[0] : null,
                mediaPath: msg.mediaPath || null,
                isDeleted: msg._isDeleted || false,
                type: msg.type || 'chat'
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Generate text export
     */
    generateTextExport(messages) {
        const contactName = this.getContactName(this.state.currentChatId);
        let text = `WhatsApp Chat Export\n`;
        text += `Contact: ${contactName}\n`;
        text += `Export Date: ${new Date().toLocaleString()}\n`;
        text += `Total Messages: ${messages.length}\n`;
        text += `${'='.repeat(50)}\n\n`;

        messages.forEach(msg => {
            const date = new Date(msg.timestamp * 1000).toLocaleString();
            const sender = msg.fromMe ? 'You' : (msg.author ? this.getContactName(msg.author) : contactName);

            text += `[${date}] ${sender}: `;

            if (msg._isDeleted) {
                text += `🗑️ This message was deleted`;
                if (msg.body) {
                    text += `: ${msg.body}`;
                }
            } else if (msg.hasMedia) {
                const mediaType = msg.mimetype ? msg.mimetype.split('/')[0] : 'media';
                text += `📎 ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
                if (msg.body) {
                    text += ` - ${msg.body}`;
                }
            } else {
                text += msg.body || '(No content)';
            }

            text += '\n';
        });

        return text;
    }

    /**
     * Generate HTML export
     */
    generateHTMLExport(messages) {
        const contactName = this.getContactName(this.state.currentChatId);

        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat - ${contactName}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
        .sent { background: #dcf8c6; margin-left: 20%; }
        .received { background: #f1f1f1; margin-right: 20%; }
        .deleted { background: #ffebee; border-left: 3px solid #f44336; }
        .media { background: #e3f2fd; border-left: 3px solid #2196f3; }
        .timestamp { font-size: 0.8em; color: #666; margin-top: 5px; }
        .sender { font-weight: bold; color: #6366f1; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>WhatsApp Chat Export</h1>
        <p>Contact: ${contactName}</p>
        <p>Export Date: ${new Date().toLocaleString()}</p>
        <p>Total Messages: ${messages.length}</p>
    </div>
`;

        messages.forEach(msg => {
            const date = new Date(msg.timestamp * 1000).toLocaleString();
            const sender = msg.fromMe ? 'You' : (msg.author ? this.getContactName(msg.author) : contactName);
            const messageClass = msg.fromMe ? 'sent' : 'received';
            const additionalClass = msg._isDeleted ? ' deleted' : (msg.hasMedia ? ' media' : '');

            html += `    <div class="message ${messageClass}${additionalClass}">`;

            if (!msg.fromMe && msg.author) {
                html += `        <div class="sender">${sender}</div>`;
            }

            html += `        <div class="content">`;

            if (msg._isDeleted) {
                html += `🗑️ This message was deleted`;
                if (msg.body) {
                    html += `: ${this.escapeHtml(msg.body)}`;
                }
            } else if (msg.hasMedia) {
                const mediaType = msg.mimetype ? msg.mimetype.split('/')[0] : 'media';
                html += `📎 ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
                if (msg.body) {
                    html += ` - ${this.escapeHtml(msg.body)}`;
                }
            } else {
                html += this.escapeHtml(msg.body || '(No content)');
            }

            html += `        </div>`;
            html += `        <div class="timestamp">${date}</div>`;
            html += `    </div>\n`;
        });

        html += `</body>
</html>`;

        return html;
    }

    /**
     * Download export file
     */
    downloadExportFile(data, format) {
        const contactName = this.getContactName(this.state.currentChatId);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `whatsapp-${contactName}-${timestamp}.${format}`;

        const blob = new Blob([data], {
            type: format === 'html' ? 'text/html' : 'text/plain'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Export completed: ${filename}`);
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

            // Check if contact has status (simulated)
            const hasStatus = Math.random() > 0.7; // 30% chance of having status
            const statusClass = hasStatus ? 'has-status' : '';
            const statusViewed = hasStatus && Math.random() > 0.5 ? 'viewed' : '';

            chatItem.innerHTML = `
                <div class="chat-avatar chat-item-avatar ${statusClass} ${statusViewed}" style="background: ${avatarColor}" data-has-status="${hasStatus}">
                    ${initials}
                    ${hasStatus ? '<div class="status-indicator"></div>' : ''}
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

            // Add click handler for status viewing
            const avatar = chatItem.querySelector('.chat-avatar');
            if (hasStatus) {
                avatar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.viewContactStatus(chat.id._serialized, contactName);
                });
                avatar.style.cursor = 'pointer';
                avatar.title = 'View Status';
            }

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

            // Show sync status
            this.showSyncStatus('WhatsApp terhubung dan siap', 'success');

            // Show auto-download notification
            setTimeout(() => {
                this.showAutoDownloadNotification();
            }, 2000);

            // Show profile pictures loading notification
            setTimeout(() => {
                this.showProfilePicturesLoadingNotification();
            }, 8000);

            // Start background sync
            setTimeout(() => {
                this.triggerBackgroundSync();
            }, 10000);
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

            // Load cached profile pictures after chat list is rendered
            setTimeout(() => {
                this.loadAllProfilePicturesFromStorage();
            }, 1000);
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
            console.log('New message received:', data);

            // Show browser notification for new message
            if (data && data.message && data.chatId) {
                console.log('Calling showBrowserNotification with:', data.message, data.chatId);
                this.showBrowserNotification(data.message, data.chatId);
            } else {
                console.log('Invalid data for notification:', data);
            }

            // If message is for current chat, refresh messages
            if (this.state.currentChatId === data.chatId) {
                this.socket.emit('get-messages', this.state.currentChatId);
            }
            // Refresh chat list to update last message
            this.refreshChatList();
        });

        this.socket.on('message_deleted', (data) => {
            console.log('Message deleted:', data);

            // Force refresh messages for the affected chat
            if (this.state.currentChatId === data.chatId) {
                console.log('Refreshing messages for current chat due to deleted message');
                this.socket.emit('get-messages', this.state.currentChatId);
            }

            // Also refresh chat list to update last message
            this.refreshChatList();
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

        // Download progress events
        this.socket.on('download-progress', (progress) => {
            this.updateDownloadProgress(progress);
            this.updateAutoDownloadNotification(progress);
        });

        this.socket.on('download-complete', (result) => {
            this.handleDownloadComplete(result);
        });

        this.socket.on('download-stopped', (data) => {
            this.handleDownloadStopped(data);
        });

        this.socket.on('download-already-running', (progress) => {
            this.showDownloadProgress();
            this.updateDownloadProgress(progress);
        });

        // Profile picture events
        this.socket.on('profile-picture', (data) => {
            this.handleProfilePicture(data);
        });

        // Contact info events
        this.socket.on('contact-info', (contactInfo) => {
            this.handleContactInfo(contactInfo);
        });

        // Status events
        this.socket.on('status-stories', (stories) => {
            this.handleStatusStories(stories);
        });

        this.socket.on('my-status', (myStatus) => {
            this.handleMyStatus(myStatus);
        });

        // Profile pictures loading events
        this.socket.on('profile-pictures-loaded', (data) => {
            this.handleProfilePicturesLoaded(data);
        });

        // Download already completed event
        this.socket.on('download-already-completed', (data) => {
            this.handleDownloadAlreadyCompleted(data);
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
                console.log('Rendering deleted message:', message);
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

        // Setup enhanced video players
        this.setupEnhancedVideoPlayers();

        // Setup enhanced audio players
        this.setupAudioPlayers();
    }

    /**
     * Render media message
     */
    renderMediaMessage(message, chatId) {
        // Check message type first
        if (message.type === 'sticker') {
            return this.renderStickerMessage(message, chatId);
        } else if (message.type === 'location') {
            return this.renderLocationMessage(message, chatId);
        } else if (message.type === 'document') {
            return this.renderDocumentMessage(message, chatId);
        } else if (message.isViewOnce) {
            return this.renderViewOnceMessage(message, chatId);
        }

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
                const videoId = `video_${messageId}_${Date.now()}`;
                return `
                    <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                        <div class="video-player enhanced" data-video-id="${videoId}">
                            <video
                                id="${videoId}"
                                controls
                                class="media-preview"
                                preload="metadata"
                                playsinline
                                webkit-playsinline
                                controlsList="nodownload"
                            >
                                <source src="${message.mediaPath}" type="${message.mimetype || 'video/mp4'}">
                                Your browser does not support the video tag.
                            </video>
                            <div class="video-overlay" style="display: none;">
                                <button class="video-play-btn">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                            </div>
                            <div class="media-info">
                                <i class="bi bi-camera-video"></i> Video • ${this.getFileSize(message.mediaPath)}
                            </div>
                        </div>
                    </div>
                `;
            } else if (mediaType === 'audio') {
                const audioId = `audio_${messageId}_${Date.now()}`;
                return `
                    <div class="message-media" data-message-id="${messageId}" data-chat-id="${chatId}">
                        <div class="audio-player enhanced" data-audio-id="${audioId}">
                            <div class="audio-controls">
                                <button class="audio-play-btn" data-audio-id="${audioId}">
                                    <i class="bi bi-play-fill"></i>
                                </button>
                                <div class="audio-info">
                                    <div class="audio-waveform">
                                        <div class="waveform-bars">
                                            ${Array.from({length: 20}, () => '<div class="waveform-bar"></div>').join('')}
                                        </div>
                                    </div>
                                    <div class="audio-meta">
                                        <span class="audio-duration" id="duration_${audioId}">0:00</span>
                                        <span class="audio-size">${this.getFileSize(message.mediaPath)}</span>
                                    </div>
                                </div>
                                <button class="audio-download-btn" data-url="${message.mediaPath}" title="Download">
                                    <i class="bi bi-download"></i>
                                </button>
                            </div>
                            <div class="audio-progress">
                                <div class="audio-progress-bar" id="progress_${audioId}"></div>
                            </div>
                            <audio preload="metadata" id="${audioId}" style="display: none;">
                                <source src="${message.mediaPath}" type="${message.mimetype}">
                                Your browser does not support the audio element.
                            </audio>
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
        console.log('Rendering deleted message with data:', message);

        let messageBody = message.body;

        // Try to get body from _data if available
        if (!messageBody && message._data && message._data.body) {
            messageBody = message._data.body;
        }

        console.log('Deleted message body:', messageBody);

        let content = '';

        // If message has deleted media, show it
        if (message.hasMedia && message.mediaPath) {
            console.log('Deleted message has media:', message.mediaPath);
            content += this.renderDeletedMedia(message);
        }

        if (messageBody && messageBody !== '(Pesan ini telah dihapus)' && messageBody.trim() !== '') {
            content += `
                <div class="message-text deleted-message">
                    <i class="bi bi-trash"></i> Pesan yang dihapus: ${this.formatWhatsAppText(messageBody)}
                </div>
            `;
        } else {
            content += `
                <div class="message-text deleted-message">
                    <i class="bi bi-trash"></i> Pesan ini telah dihapus
                </div>
            `;
        }

        console.log('Deleted message content:', content);
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

        // Setup enhanced audio players
        this.setupAudioPlayers();

        // Setup enhanced video players
        this.setupVideoPlayers();

        // Setup download buttons
        this.setupDownloadButtons();
    }

    /**
     * Setup enhanced audio players
     */
    setupAudioPlayers() {
        document.querySelectorAll('.audio-player.enhanced').forEach(player => {
            const audioId = player.dataset.audioId;
            const audio = document.getElementById(audioId);
            const playBtn = player.querySelector('.audio-play-btn');
            const progressBar = player.querySelector('.audio-progress-bar');
            const durationSpan = player.querySelector('.audio-duration');
            const progressContainer = player.querySelector('.audio-progress');

            if (!audio || !playBtn) return;

            // Load metadata
            audio.addEventListener('loadedmetadata', () => {
                if (durationSpan) {
                    durationSpan.textContent = this.formatDuration(audio.duration);
                }
            });

            // Play/pause button
            playBtn.addEventListener('click', () => {
                if (audio.paused) {
                    // Pause all other audio players
                    document.querySelectorAll('audio').forEach(otherAudio => {
                        if (otherAudio !== audio && !otherAudio.paused) {
                            otherAudio.pause();
                        }
                    });

                    audio.play();
                    playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                    playBtn.classList.add('playing');
                    player.classList.add('playing');
                } else {
                    audio.pause();
                    playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                    playBtn.classList.remove('playing');
                    player.classList.remove('playing');
                }
            });

            // Progress update
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    if (progressBar) {
                        progressBar.style.width = `${progress}%`;
                    }
                    if (durationSpan) {
                        durationSpan.textContent = this.formatDuration(audio.currentTime);
                    }
                }
            });

            // Progress bar click
            if (progressContainer) {
                progressContainer.addEventListener('click', (e) => {
                    const rect = progressContainer.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    const percentage = clickX / width;
                    audio.currentTime = percentage * audio.duration;
                });
            }

            // Audio ended
            audio.addEventListener('ended', () => {
                playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                playBtn.classList.remove('playing');
                player.classList.remove('playing');
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
                if (durationSpan) {
                    durationSpan.textContent = this.formatDuration(audio.duration);
                }
            });
        });
    }

    /**
     * Setup enhanced video players
     */
    setupVideoPlayers() {
        document.querySelectorAll('video').forEach(video => {
            // Add enhanced controls if not already present
            if (!video.closest('.video-player.enhanced')) {
                this.enhanceVideoPlayer(video);
            }
        });
    }

    /**
     * Setup enhanced video players with better controls
     */
    setupEnhancedVideoPlayers() {
        document.querySelectorAll('.video-player.enhanced').forEach(player => {
            const videoId = player.dataset.videoId;
            const video = document.getElementById(videoId);
            const overlay = player.querySelector('.video-overlay');
            const playBtn = player.querySelector('.video-play-btn');

            if (!video || !overlay || !playBtn) return;

            // Show overlay when video is paused
            video.addEventListener('pause', () => {
                overlay.style.display = 'flex';
            });

            // Hide overlay when video is playing
            video.addEventListener('play', () => {
                overlay.style.display = 'none';
            });

            // Play button click
            playBtn.addEventListener('click', () => {
                if (video.paused) {
                    // Pause all other videos
                    document.querySelectorAll('video').forEach(otherVideo => {
                        if (otherVideo !== video && !otherVideo.paused) {
                            otherVideo.pause();
                        }
                    });

                    video.play().catch(error => {
                        console.error('Error playing video:', error);
                        alert('Cannot play video. Please check the file format.');
                    });
                } else {
                    video.pause();
                }
            });

            // Video click to play/pause
            video.addEventListener('click', () => {
                if (video.paused) {
                    video.play().catch(error => {
                        console.error('Error playing video:', error);
                    });
                } else {
                    video.pause();
                }
            });

            // Handle video load errors
            video.addEventListener('error', (e) => {
                console.error('Video load error:', e);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'video-error';
                errorDiv.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>Cannot load video</span>
                `;
                player.appendChild(errorDiv);
            });

            // Handle video loaded
            video.addEventListener('loadeddata', () => {
                console.log('Video loaded successfully:', videoId);
            });
        });
    }

    /**
     * Setup download buttons
     */
    setupDownloadButtons() {
        document.querySelectorAll('.audio-download-btn, .video-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = btn.dataset.url;
                if (url) {
                    this.downloadFile(url);
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
     * Render location message
     */
    renderLocationMessage(message, chatId) {
        const messageId = message.id ? message.id.id : 'unknown';
        const location = message.location || {};
        const latitude = location.latitude || 0;
        const longitude = location.longitude || 0;
        const name = location.name || 'Shared Location';
        const address = location.address || `${latitude}, ${longitude}`;

        return `
            <div class="message-media location-message" data-message-id="${messageId}" data-chat-id="${chatId}">
                <div class="location-preview">
                    <i class="bi bi-geo-alt-fill">📍</i>
                </div>
                <div class="location-info">
                    <div class="location-name">${this.escapeHtml(name)}</div>
                    <div class="location-address">${this.escapeHtml(address)}</div>
                    <div class="location-coordinates">${latitude}, ${longitude}</div>
                </div>
                <div class="location-actions">
                    <button class="location-btn" onclick="window.open('https://maps.google.com/maps?q=${latitude},${longitude}', '_blank')">
                        <i class="bi bi-map"></i> View
                    </button>
                    <button class="location-btn" onclick="navigator.clipboard.writeText('${latitude}, ${longitude}')">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render view once message
     */
    renderViewOnceMessage(message, chatId) {
        const messageId = message.id ? message.id.id : 'unknown';
        const isExpired = message.viewOnceExpired || false;
        const mediaType = message.mimetype ? message.mimetype.split('/')[0] : 'media';

        if (isExpired) {
            return `
                <div class="message-media view-once-message view-once-expired" data-message-id="${messageId}" data-chat-id="${chatId}">
                    <div class="view-once-icon">👁️‍🗨️</div>
                    <div class="view-once-text">View once ${mediaType}</div>
                    <div class="view-once-text">Expired</div>
                </div>
            `;
        } else if (message.mediaPath) {
            // Show the media but mark as view once
            return `
                <div class="message-media view-once-message" data-message-id="${messageId}" data-chat-id="${chatId}">
                    <div class="view-once-icon">👁️</div>
                    <div class="view-once-text">View once ${mediaType}</div>
                    <div class="view-once-text">Tap to view</div>
                </div>
            `;
        } else {
            return `
                <div class="message-media view-once-message" data-message-id="${messageId}" data-chat-id="${chatId}">
                    <div class="view-once-icon">👁️‍🗨️</div>
                    <div class="view-once-text">View once ${mediaType}</div>
                    <div class="view-once-text">Loading...</div>
                </div>
            `;
        }
    }

    /**
     * Render document message
     */
    renderDocumentMessage(message, chatId) {
        const messageId = message.id ? message.id.id : 'unknown';
        const filename = message.filename || message.mediaPath?.split('/').pop() || 'Document';
        const filesize = message.filesize || 'Unknown size';
        const mimetype = message.mimetype || '';

        // Determine document type and icon
        let docType = 'default';
        let docIcon = 'bi-file-earmark';

        if (mimetype.includes('pdf')) {
            docType = 'pdf';
            docIcon = 'bi-file-earmark-pdf';
        } else if (mimetype.includes('word') || mimetype.includes('document')) {
            docType = 'doc';
            docIcon = 'bi-file-earmark-word';
        } else if (mimetype.includes('sheet') || mimetype.includes('excel')) {
            docType = 'xls';
            docIcon = 'bi-file-earmark-excel';
        } else if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) {
            docType = 'ppt';
            docIcon = 'bi-file-earmark-ppt';
        } else if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('archive')) {
            docType = 'zip';
            docIcon = 'bi-file-earmark-zip';
        }

        const formattedSize = this.formatFileSize(filesize);

        return `
            <div class="message-media document-message" data-message-id="${messageId}" data-chat-id="${chatId}">
                <div class="document-header">
                    <div class="document-type-icon ${docType}">
                        <i class="bi ${docIcon}">📄</i>
                    </div>
                    <div class="document-details">
                        <div class="document-filename">${this.escapeHtml(filename)}</div>
                        <div class="document-meta">
                            <span class="document-size">${formattedSize}</span>
                            <span class="document-type">${docType.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
                <div class="document-actions">
                    ${message.mediaPath ?
                        `<a href="${message.mediaPath}" download class="document-action-btn primary">
                            <i class="bi bi-download"></i> Download
                        </a>
                        <button class="document-action-btn" onclick="window.open('${message.mediaPath}', '_blank')">
                            <i class="bi bi-eye"></i> Preview
                        </button>` :
                        `<button class="document-action-btn primary" onclick="this.downloadDocument('${messageId}', '${chatId}')">
                            <i class="bi bi-download"></i> Download
                        </button>`
                    }
                </div>
            </div>
        `;
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (typeof bytes === 'string') return bytes;
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    /**
     * Show chat info modal
     */
    showChatInfo() {
        if (!this.state.currentChatId) {
            alert('No chat selected');
            return;
        }

        this.populateChatInfo();
        this.modals.chatInfo.show();
    }

    /**
     * Populate chat info modal with data
     */
    populateChatInfo() {
        const contactName = this.getContactName(this.state.currentChatId);
        const messages = this.state.currentMessages || [];

        // Update contact info
        document.getElementById('chat-info-name').textContent = contactName;
        document.getElementById('chat-info-number').textContent = this.state.currentChatId;

        // Update avatar
        const avatar = document.getElementById('chat-info-avatar');
        const avatarColor = this.getAvatarColor(contactName);
        avatar.style.background = avatarColor;

        // Calculate statistics
        const totalMessages = messages.length;
        const mediaMessages = messages.filter(msg => msg.hasMedia).length;
        const callMessages = messages.filter(msg => msg.type === 'call_log').length;

        document.getElementById('total-messages').textContent = totalMessages;
        document.getElementById('total-media').textContent = mediaMessages;
        document.getElementById('total-calls').textContent = callMessages;

        // Calculate dates
        if (messages.length > 0) {
            const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
            const firstMessage = sortedMessages[0];
            const lastMessage = sortedMessages[sortedMessages.length - 1];

            document.getElementById('first-message-date').textContent =
                new Date(firstMessage.timestamp * 1000).toLocaleDateString();
            document.getElementById('last-activity-date').textContent =
                new Date(lastMessage.timestamp * 1000).toLocaleDateString();
        } else {
            document.getElementById('first-message-date').textContent = '-';
            document.getElementById('last-activity-date').textContent = '-';
        }

        // Chat type
        const chatType = this.state.currentChatId.includes('@g.us') ? 'Group' : 'Individual';
        document.getElementById('chat-type').textContent = chatType;
    }

    /**
     * Archive chat
     */
    archiveChat() {
        if (!this.state.currentChatId) {
            alert('No chat selected');
            return;
        }

        if (confirm('Are you sure you want to archive this chat?')) {
            // In a real implementation, this would call the WhatsApp API
            alert('Archive functionality would be implemented here.\nThis requires WhatsApp Web API integration.');
        }
    }

    /**
     * Clear chat history
     */
    clearChatHistory() {
        if (!this.state.currentChatId) {
            alert('No chat selected');
            return;
        }

        if (confirm('Are you sure you want to clear chat history?\nThis action cannot be undone.')) {
            // Clear local messages
            this.state.currentMessages = [];

            // Clear chat body
            if (this.elements.chatBody) {
                this.elements.chatBody.innerHTML = `
                    <div class="loading-state">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p class="loading-text">Chat history cleared</p>
                    </div>
                `;
            }

            // In a real implementation, this would also clear server-side data
            console.log('Chat history cleared for:', this.state.currentChatId);
        }
    }

    /**
     * Start download all messages
     */
    startDownloadAll() {
        console.log('Starting download all messages...');

        // Show download progress modal
        this.showDownloadProgress();

        // Request download start
        this.socket.emit('start-download-all');

        // Update button state
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.classList.add('downloading');
            this.elements.downloadAllBtn.innerHTML = '<i class="bi bi-cloud-download"></i> Downloading...';
            this.elements.downloadAllBtn.disabled = true;
        }
    }

    /**
     * Show download progress modal
     */
    showDownloadProgress() {
        this.modals.downloadProgress.show();

        // Reset progress display
        this.resetDownloadProgress();

        // Show stop button, hide close button
        if (this.elements.stopDownloadBtn) {
            this.elements.stopDownloadBtn.style.display = 'block';
        }
        if (this.elements.closeDownloadModal) {
            this.elements.closeDownloadModal.style.display = 'none';
        }
    }

    /**
     * Reset download progress display
     */
    resetDownloadProgress() {
        // Reset progress bars
        document.getElementById('overall-progress-bar').style.width = '0%';
        document.getElementById('chat-progress-bar').style.width = '0%';

        // Reset text displays
        document.getElementById('overall-percentage').textContent = '0%';
        document.getElementById('current-chat-name').textContent = '-';
        document.getElementById('processed-chats').textContent = '0';
        document.getElementById('processed-messages').textContent = '0';
        document.getElementById('download-errors').textContent = '0';
        document.getElementById('elapsed-time').textContent = '00:00';
        document.getElementById('estimated-time').textContent = 'Calculating...';
        document.getElementById('download-status-text').textContent = 'Preparing download...';

        // Clear log
        document.getElementById('log-content').innerHTML = '';
        document.getElementById('download-log').style.display = 'none';
    }

    /**
     * Update download progress
     */
    updateDownloadProgress(progress) {
        if (!progress) return;

        // Update overall progress
        const overallPercent = progress.totalChats > 0 ?
            Math.round((progress.processedChats / progress.totalChats) * 100) : 0;

        document.getElementById('overall-progress-bar').style.width = `${overallPercent}%`;
        document.getElementById('overall-percentage').textContent = `${overallPercent}%`;

        // Update current chat
        document.getElementById('current-chat-name').textContent = progress.currentChat || '-';

        // Update statistics
        document.getElementById('processed-chats').textContent = progress.processedChats;
        document.getElementById('processed-messages').textContent = progress.processedMessages;
        document.getElementById('download-errors').textContent = progress.errors.length;

        // Update time displays
        if (progress.startTime) {
            const elapsed = Math.round((Date.now() - progress.startTime) / 1000);
            document.getElementById('elapsed-time').textContent = this.formatDuration(elapsed);
        }

        if (progress.estimatedTimeRemaining > 0) {
            document.getElementById('estimated-time').textContent =
                this.formatDuration(progress.estimatedTimeRemaining);
        }

        // Update status text
        if (progress.isDownloading) {
            document.getElementById('download-status-text').textContent =
                `Processing ${progress.currentChat || 'chat'}...`;
        }

        // Add progress bars animation
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach(bar => {
            if (progress.isDownloading) {
                bar.classList.add('animated');
            } else {
                bar.classList.remove('animated');
            }
        });

        // Show log if there are errors
        if (progress.errors.length > 0) {
            document.getElementById('download-log').style.display = 'block';
            this.updateDownloadLog(progress.errors);
        }
    }

    /**
     * Update download log
     */
    updateDownloadLog(errors) {
        const logContent = document.getElementById('log-content');

        // Clear existing log
        logContent.innerHTML = '';

        // Add recent errors
        errors.slice(-10).forEach(error => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
                <span class="log-message log-error">Error in ${error.chat}: ${error.error}</span>
            `;
            logContent.appendChild(logEntry);
        });

        // Scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;
    }

    /**
     * Handle download complete
     */
    handleDownloadComplete(result) {
        console.log('Download completed:', result);

        // Update status
        document.getElementById('download-status-text').textContent =
            `Download completed! ${result.totalMessages} messages from ${result.totalChats} chats`;

        // Update button state
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.classList.remove('downloading');
            this.elements.downloadAllBtn.classList.add('download-complete');
            this.elements.downloadAllBtn.innerHTML = '<i class="bi bi-check-circle"></i> Completed';
            this.elements.downloadAllBtn.disabled = false;
        }

        // Hide stop button, show close button
        if (this.elements.stopDownloadBtn) {
            this.elements.stopDownloadBtn.style.display = 'none';
        }
        if (this.elements.closeDownloadModal) {
            this.elements.closeDownloadModal.style.display = 'block';
        }

        // Remove progress bar animation
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.classList.remove('animated');
        });

        // Show completion log
        this.addDownloadLogEntry('success', `Download completed successfully! ${result.totalMessages} messages processed.`);

        if (result.errors.length > 0) {
            this.addDownloadLogEntry('error', `${result.errors.length} errors encountered during download.`);
        }

        // Auto-close modal after 5 seconds
        setTimeout(() => {
            if (this.modals.downloadProgress) {
                this.modals.downloadProgress.hide();
            }
        }, 5000);
    }

    /**
     * Handle download stopped
     */
    handleDownloadStopped(data) {
        console.log('Download stopped:', data);

        // Update status
        document.getElementById('download-status-text').textContent = 'Download stopped by user';

        // Update button state
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.classList.remove('downloading');
            this.elements.downloadAllBtn.innerHTML = '<i class="bi bi-cloud-download"></i> Download All';
            this.elements.downloadAllBtn.disabled = false;
        }

        // Hide stop button, show close button
        if (this.elements.stopDownloadBtn) {
            this.elements.stopDownloadBtn.style.display = 'none';
        }
        if (this.elements.closeDownloadModal) {
            this.elements.closeDownloadModal.style.display = 'block';
        }

        // Remove progress bar animation
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.classList.remove('animated');
        });

        this.addDownloadLogEntry('error', 'Download stopped by user request');
    }

    /**
     * Stop download
     */
    stopDownload() {
        console.log('Stopping download...');
        this.socket.emit('stop-download');

        // Update button
        if (this.elements.stopDownloadBtn) {
            this.elements.stopDownloadBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Stopping...';
            this.elements.stopDownloadBtn.disabled = true;
        }
    }

    /**
     * Add entry to download log
     */
    addDownloadLogEntry(type, message) {
        const logContent = document.getElementById('log-content');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        const timestamp = new Date().toLocaleTimeString();
        const typeClass = type === 'error' ? 'log-error' : type === 'success' ? 'log-success' : 'log-message';

        logEntry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-message ${typeClass}">${message}</span>
        `;

        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;

        // Show log container
        document.getElementById('download-log').style.display = 'block';
    }

    /**
     * Format duration in seconds to readable format
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
        }
    }

    /**
     * Show contact details
     */
    showContactDetails() {
        if (!this.state.currentChatId) {
            console.log('No chat selected');
            return;
        }

        // Request contact info
        this.socket.emit('get-contact-info', this.state.currentChatId);

        // Request profile picture
        this.socket.emit('get-profile-picture', this.state.currentChatId);

        // Show modal
        this.modals.contactDetails.show();
    }

    /**
     * Show status modal
     */
    showStatus() {
        // Request my status
        this.socket.emit('get-my-status');

        // Request status stories
        this.socket.emit('get-status-stories');

        // Show modal
        this.modals.status.show();
    }

    /**
     * Handle profile picture response
     */
    handleProfilePicture(data) {
        const { contactId, profilePicUrl } = data;

        // Save to local storage
        if (profilePicUrl) {
            this.saveProfilePictureToStorage(contactId, profilePicUrl);
        }

        // Update chat header avatar
        if (contactId === this.state.currentChatId && this.elements.chatContactImg) {
            if (profilePicUrl) {
                const img = document.createElement('img');
                img.src = profilePicUrl;
                img.alt = 'Profile';
                img.className = 'profile-picture';
                img.onerror = () => {
                    // Fallback to icon if image fails to load
                    this.elements.chatContactImg.innerHTML = `<i class="bi bi-person"></i>`;
                };
                this.elements.chatContactImg.innerHTML = '';
                this.elements.chatContactImg.appendChild(img);
            }
        }

        // Update contact details modal avatar
        const contactDetailsAvatar = document.getElementById('contact-details-avatar');
        if (contactDetailsAvatar && profilePicUrl) {
            const img = document.createElement('img');
            img.src = profilePicUrl;
            img.alt = 'Profile';
            img.className = 'profile-picture';
            img.onerror = () => {
                contactDetailsAvatar.innerHTML = `<i class="bi bi-person"></i>`;
            };
            contactDetailsAvatar.innerHTML = '';
            contactDetailsAvatar.appendChild(img);
        }

        // Update chat list avatar
        const chatItems = document.querySelectorAll(`[data-chat-id="${contactId}"] .chat-item-avatar`);
        chatItems.forEach(avatar => {
            if (profilePicUrl) {
                const img = document.createElement('img');
                img.src = profilePicUrl;
                img.alt = 'Profile';
                img.className = 'profile-picture';
                img.onerror = () => {
                    // Keep the existing content (initials) if image fails
                    console.log(`Failed to load profile picture for ${contactId}`);
                };

                // Only replace if image loads successfully
                img.onload = () => {
                    avatar.innerHTML = '';
                    avatar.appendChild(img);
                };
            }
        });
    }

    /**
     * Save profile picture URL to local storage
     */
    saveProfilePictureToStorage(contactId, profilePicUrl) {
        try {
            let profilePictures = JSON.parse(localStorage.getItem('wa_profile_pictures') || '{}');
            profilePictures[contactId] = {
                url: profilePicUrl,
                timestamp: Date.now()
            };
            localStorage.setItem('wa_profile_pictures', JSON.stringify(profilePictures));
            console.log(`Profile picture saved to storage for ${contactId}`);
        } catch (error) {
            console.error('Error saving profile picture to storage:', error);
        }
    }

    /**
     * Load profile picture from local storage
     */
    loadProfilePictureFromStorage(contactId) {
        try {
            const profilePictures = JSON.parse(localStorage.getItem('wa_profile_pictures') || '{}');
            const profileData = profilePictures[contactId];

            if (profileData) {
                // Check if profile picture is not too old (7 days)
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                if (profileData.timestamp > sevenDaysAgo) {
                    return profileData.url;
                } else {
                    // Remove old profile picture
                    delete profilePictures[contactId];
                    localStorage.setItem('wa_profile_pictures', JSON.stringify(profilePictures));
                }
            }
            return null;
        } catch (error) {
            console.error('Error loading profile picture from storage:', error);
            return null;
        }
    }

    /**
     * Load all profile pictures from storage on app start
     */
    loadAllProfilePicturesFromStorage() {
        try {
            const profilePictures = JSON.parse(localStorage.getItem('wa_profile_pictures') || '{}');
            let loadedCount = 0;

            Object.keys(profilePictures).forEach(contactId => {
                const profileData = profilePictures[contactId];

                // Check if not too old (7 days)
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                if (profileData.timestamp > sevenDaysAgo) {
                    // Apply profile picture to UI
                    this.applyProfilePictureToUI(contactId, profileData.url);
                    loadedCount++;
                }
            });

            if (loadedCount > 0) {
                console.log(`Loaded ${loadedCount} profile pictures from storage`);
                this.showNotificationStatus(`${loadedCount} foto profil dimuat dari cache`, 'info');
            }
        } catch (error) {
            console.error('Error loading profile pictures from storage:', error);
        }
    }

    /**
     * Apply profile picture to UI elements
     */
    applyProfilePictureToUI(contactId, profilePicUrl) {
        // Update chat header avatar if this is current chat
        if (contactId === this.state.currentChatId && this.elements.chatContactImg) {
            const img = document.createElement('img');
            img.src = profilePicUrl;
            img.alt = 'Profile';
            img.className = 'profile-picture';
            img.onerror = () => {
                this.elements.chatContactImg.innerHTML = `<i class="bi bi-person"></i>`;
            };
            img.onload = () => {
                this.elements.chatContactImg.innerHTML = '';
                this.elements.chatContactImg.appendChild(img);
            };
        }

        // Update chat list avatars
        const chatItems = document.querySelectorAll(`[data-chat-id="${contactId}"] .chat-item-avatar`);
        chatItems.forEach(avatar => {
            const img = document.createElement('img');
            img.src = profilePicUrl;
            img.alt = 'Profile';
            img.className = 'profile-picture';
            img.onerror = () => {
                console.log(`Failed to load cached profile picture for ${contactId}`);
            };
            img.onload = () => {
                avatar.innerHTML = '';
                avatar.appendChild(img);
            };
        });
    }

    /**
     * Handle contact info response
     */
    handleContactInfo(contactInfo) {
        if (contactInfo.error) {
            console.error('Error getting contact info:', contactInfo.error);
            return;
        }

        // Update contact details modal
        this.updateContactDetailsModal(contactInfo);
    }

    /**
     * Update contact details modal
     */
    updateContactDetailsModal(contactInfo) {
        // Update name and number
        const nameElement = document.getElementById('contact-details-name');
        const numberElement = document.getElementById('contact-details-number');

        if (nameElement) {
            nameElement.textContent = contactInfo.name || contactInfo.number || 'Unknown';
        }

        if (numberElement) {
            numberElement.textContent = contactInfo.number || 'Unknown number';
        }

        // Update about/status
        const aboutElement = document.getElementById('contact-about-text');
        if (aboutElement) {
            if (contactInfo.about || contactInfo.statusMessage) {
                aboutElement.textContent = contactInfo.about || contactInfo.statusMessage;
                aboutElement.className = 'about-text';
            } else {
                aboutElement.textContent = 'No status available';
                aboutElement.className = 'about-text about-empty';
            }
        }

        // Update status badges
        this.updateStatusBadges(contactInfo);

        // Update contact info grid
        this.updateContactInfoGrid(contactInfo);

        // Update group info if it's a group
        if (contactInfo.isGroup && contactInfo.groupMetadata) {
            this.updateGroupInfo(contactInfo.groupMetadata);
        } else {
            const groupSection = document.getElementById('group-info-section');
            if (groupSection) {
                groupSection.style.display = 'none';
            }
        }
    }

    /**
     * Update status badges
     */
    updateStatusBadges(contactInfo) {
        const badgesContainer = document.getElementById('contact-status-badges');
        if (!badgesContainer) return;

        const badges = [];

        if (contactInfo.isMyContact) {
            badges.push('<span class="status-badge">Contact</span>');
        }

        if (contactInfo.isBusiness) {
            badges.push('<span class="status-badge">Business</span>');
        }

        if (contactInfo.isEnterprise) {
            badges.push('<span class="status-badge">Enterprise</span>');
        }

        if (contactInfo.isGroup) {
            badges.push('<span class="status-badge">Group</span>');
        }

        if (contactInfo.isBlocked) {
            badges.push('<span class="status-badge">Blocked</span>');
        }

        badgesContainer.innerHTML = badges.join('');
    }

    /**
     * Update contact info grid
     */
    updateContactInfoGrid(contactInfo) {
        const gridContainer = document.getElementById('contact-info-grid');
        if (!gridContainer) return;

        const infoItems = [];

        // Phone number
        if (contactInfo.number) {
            infoItems.push(`
                <div class="info-item">
                    <div class="info-icon">
                        <i class="bi bi-telephone"></i>
                    </div>
                    <div class="info-content">
                        <div class="info-label">Phone Number</div>
                        <div class="info-value">${contactInfo.number}</div>
                    </div>
                </div>
            `);
        }

        // Push name
        if (contactInfo.pushname && contactInfo.pushname !== contactInfo.name) {
            infoItems.push(`
                <div class="info-item">
                    <div class="info-icon">
                        <i class="bi bi-person-badge"></i>
                    </div>
                    <div class="info-content">
                        <div class="info-label">Display Name</div>
                        <div class="info-value">${contactInfo.pushname}</div>
                    </div>
                </div>
            `);
        }

        // Contact type
        const contactType = contactInfo.isGroup ? 'Group' :
                           contactInfo.isBusiness ? 'Business' :
                           contactInfo.isMyContact ? 'Contact' : 'Unknown';

        infoItems.push(`
            <div class="info-item">
                <div class="info-icon">
                    <i class="bi bi-info-circle"></i>
                </div>
                <div class="info-content">
                    <div class="info-label">Type</div>
                    <div class="info-value">${contactType}</div>
                </div>
            </div>
        `);

        gridContainer.innerHTML = infoItems.join('');
    }

    /**
     * Update group info
     */
    updateGroupInfo(groupMetadata) {
        const groupSection = document.getElementById('group-info-section');
        const groupDetails = document.getElementById('group-details');
        const groupParticipants = document.getElementById('group-participants');

        if (!groupSection) return;

        groupSection.style.display = 'block';

        // Group details
        if (groupDetails) {
            const details = [];

            if (groupMetadata.desc) {
                details.push(`
                    <div class="info-item">
                        <div class="info-icon">
                            <i class="bi bi-chat-quote"></i>
                        </div>
                        <div class="info-content">
                            <div class="info-label">Description</div>
                            <div class="info-value">${groupMetadata.desc}</div>
                        </div>
                    </div>
                `);
            }

            if (groupMetadata.creation) {
                const creationDate = new Date(groupMetadata.creation * 1000).toLocaleDateString();
                details.push(`
                    <div class="info-item">
                        <div class="info-icon">
                            <i class="bi bi-calendar"></i>
                        </div>
                        <div class="info-content">
                            <div class="info-label">Created</div>
                            <div class="info-value">${creationDate}</div>
                        </div>
                    </div>
                `);
            }

            groupDetails.innerHTML = details.join('');
        }

        // Group participants
        if (groupParticipants && groupMetadata.participants) {
            const participantItems = groupMetadata.participants.map(participant => {
                const isAdmin = groupMetadata.admins?.includes(participant.id._serialized);
                const isOwner = groupMetadata.owner === participant.id._serialized;

                let role = 'Member';
                if (isOwner) role = 'Owner';
                else if (isAdmin) role = 'Admin';

                return `
                    <div class="participant-item">
                        <div class="participant-avatar">
                            <i class="bi bi-person"></i>
                        </div>
                        <div class="participant-info">
                            <div class="participant-name">${participant.name || participant.id.user}</div>
                            <div class="participant-role">
                                ${role}
                                ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            groupParticipants.innerHTML = participantItems;
        }
    }

    /**
     * Handle my status response
     */
    handleMyStatus(myStatus) {
        if (myStatus.error) {
            console.error('Error getting my status:', myStatus.error);
            return;
        }

        // Update my status in modal
        const myStatusAvatar = document.getElementById('my-status-avatar');
        const myStatusName = document.getElementById('my-status-name');
        const myStatusAbout = document.getElementById('my-status-about');

        if (myStatusAvatar && myStatus.profilePic) {
            myStatusAvatar.innerHTML = `<img src="${myStatus.profilePic}" alt="My Profile" class="profile-picture">`;
        }

        if (myStatusName) {
            myStatusName.textContent = myStatus.name || 'Your Name';
        }

        if (myStatusAbout) {
            myStatusAbout.textContent = myStatus.about || 'No status';
        }
    }

    /**
     * Handle status stories response
     */
    handleStatusStories(statusData) {
        console.log('Status stories received:', statusData);

        const recentContainer = document.getElementById('recent-status-stories');
        const viewedContainer = document.getElementById('viewed-status-stories');
        const recentSection = document.getElementById('recent-updates-section');
        const viewedSection = document.getElementById('viewed-updates-section');

        if (!recentContainer || !viewedContainer) return;

        // Handle recent updates
        if (statusData.recentUpdates && statusData.recentUpdates.length > 0) {
            let recentItems = '';
            statusData.recentUpdates.forEach(story => {
                const timeAgo = this.getTimeAgo(story.lastUpdate);
                const profilePic = story.profilePic ?
                    `<img src="${story.profilePic}" alt="${story.name}">` :
                    `<div class="status-avatar-placeholder">${story.name.charAt(0).toUpperCase()}</div>`;

                recentItems += `
                    <div class="status-story-item" data-contact-id="${story.id}" onclick="waMonitor.viewContactStatus('${story.id}', '${story.name}')">
                        <div class="status-story-avatar has-status">
                            ${profilePic}
                            <div class="status-indicator"></div>
                        </div>
                        <div class="status-story-info">
                            <div class="status-story-name">${story.name}</div>
                            <div class="status-story-time">${timeAgo}</div>
                            <div class="status-story-count">${story.statusCount} update${story.statusCount > 1 ? 's' : ''}</div>
                        </div>
                    </div>
                `;
            });
            recentContainer.innerHTML = recentItems;
            recentSection.style.display = 'block';
        } else {
            recentContainer.innerHTML = `
                <div class="no-status">
                    <i class="bi bi-circle-fill"></i>
                    <p>No recent status updates</p>
                </div>
            `;
        }

        // Handle viewed updates
        if (statusData.viewedUpdates && statusData.viewedUpdates.length > 0) {
            let viewedItems = '';
            statusData.viewedUpdates.forEach(story => {
                const timeAgo = this.getTimeAgo(story.lastUpdate);
                const profilePic = story.profilePic ?
                    `<img src="${story.profilePic}" alt="${story.name}">` :
                    `<div class="status-avatar-placeholder">${story.name.charAt(0).toUpperCase()}</div>`;

                viewedItems += `
                    <div class="status-story-item" data-contact-id="${story.id}" onclick="waMonitor.viewContactStatus('${story.id}', '${story.name}')">
                        <div class="status-story-avatar has-status viewed">
                            ${profilePic}
                            <div class="status-indicator viewed"></div>
                        </div>
                        <div class="status-story-info">
                            <div class="status-story-name">${story.name}</div>
                            <div class="status-story-time">${timeAgo}</div>
                            <div class="status-story-count">${story.statusCount} update${story.statusCount > 1 ? 's' : ''}</div>
                        </div>
                    </div>
                `;
            });
            viewedContainer.innerHTML = viewedItems;
            viewedSection.style.display = 'block';
        } else {
            viewedSection.style.display = 'none';
        }
    }

    /**
     * View contact status
     */
    viewContactStatus(contactId, contactName) {
        console.log(`Viewing status for: ${contactName}`);

        // Show status viewer modal
        this.modals.statusViewer.show();

        // Update status viewer with contact info
        const statusViewerName = document.getElementById('status-viewer-name');
        const statusViewerTime = document.getElementById('status-viewer-time');
        const statusContent = document.getElementById('status-content');

        if (statusViewerName) {
            statusViewerName.textContent = contactName;
        }

        if (statusViewerTime) {
            statusViewerTime.textContent = this.getRandomStatusTime();
        }

        if (statusContent) {
            // Simulate different types of status
            const statusTypes = ['text', 'image', 'video'];
            const randomType = statusTypes[Math.floor(Math.random() * statusTypes.length)];

            switch (randomType) {
                case 'text':
                    statusContent.innerHTML = `
                        <div class="status-text">
                            <p>${this.getRandomStatusText()}</p>
                        </div>
                    `;
                    break;
                case 'image':
                    statusContent.innerHTML = `
                        <img src="https://picsum.photos/300/400?random=${Math.floor(Math.random() * 1000)}" alt="Status Image">
                    `;
                    break;
                case 'video':
                    statusContent.innerHTML = `
                        <video controls autoplay muted>
                            <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    `;
                    break;
            }
        }

        // Mark status as viewed
        this.markStatusAsViewed(contactId);

        // Start status progress animation
        this.startStatusProgress();
    }

    /**
     * Get random status time
     */
    getRandomStatusTime() {
        const times = ['2 minutes ago', '1 hour ago', '3 hours ago', '5 hours ago', '12 hours ago', '1 day ago'];
        return times[Math.floor(Math.random() * times.length)];
    }

    /**
     * Get random status text
     */
    getRandomStatusText() {
        const texts = [
            'Having a great day! 😊',
            'Life is beautiful ✨',
            'Working hard 💪',
            'Weekend vibes 🎉',
            'Coffee time ☕',
            'Sunset views 🌅',
            'Good morning! 🌞',
            'Feeling blessed 🙏'
        ];
        return texts[Math.floor(Math.random() * texts.length)];
    }

    /**
     * Mark status as viewed
     */
    markStatusAsViewed(contactId) {
        // Mark in chat list
        const chatAvatar = document.querySelector(`[data-chat-id="${contactId}"] .chat-avatar`);
        if (chatAvatar && chatAvatar.classList.contains('has-status')) {
            chatAvatar.classList.add('viewed');
            const statusIndicator = chatAvatar.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.classList.add('viewed');
            }
        }

        // Mark in status modal
        const statusStoryItem = document.querySelector(`[data-contact-id="${contactId}"]`);
        if (statusStoryItem) {
            const statusAvatar = statusStoryItem.querySelector('.status-story-avatar');
            const statusIndicatorModal = statusStoryItem.querySelector('.status-indicator');

            if (statusAvatar) {
                statusAvatar.classList.add('viewed');
            }
            if (statusIndicatorModal) {
                statusIndicatorModal.classList.add('viewed');
            }
        }

        // Send to server
        this.socket.emit('mark-status-viewed', contactId);
    }

    /**
     * Start status progress animation
     */
    startStatusProgress() {
        const progressBar = document.getElementById('status-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';

            // Animate progress bar over 5 seconds
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                progressBar.style.width = `${progress}%`;

                if (progress >= 100) {
                    clearInterval(interval);
                    // Auto-close modal after completion
                    setTimeout(() => {
                        this.modals.statusViewer.hide();
                    }, 500);
                }
            }, 100);
        }
    }

    /**
     * Handle profile pictures loaded
     */
    handleProfilePicturesLoaded(data) {
        console.log('Profile pictures loading completed:', data);

        // Update notification
        const notification = document.getElementById('profile-pics-notification');
        const progressText = document.getElementById('profile-pics-text');
        const progressBar = document.getElementById('profile-pics-progress');

        if (notification && progressText && progressBar) {
            progressBar.style.width = '100%';
            progressText.textContent = `Completed: ${data.loaded} loaded, ${data.errors} errors`;

            // Hide notification after 3 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        }

        // Show notification about profile pictures loading
        if (data.loaded > 0) {
            console.log(`📸 Loaded ${data.loaded} profile pictures successfully`);
        }

        if (data.errors > 0) {
            console.log(`⚠️ Failed to load ${data.errors} profile pictures`);
        }
    }

    /**
     * Handle download already completed
     */
    handleDownloadAlreadyCompleted(data) {
        console.log('Download already completed:', data);

        // Show notification that download was already completed
        const notification = document.getElementById('auto-download-notification');
        const progressText = document.getElementById('auto-download-text');
        const progressBar = document.getElementById('auto-download-progress');

        if (notification && progressText && progressBar) {
            notification.classList.remove('hidden');
            progressText.textContent = `Download completed earlier today: ${data.totalMessages} messages from ${data.totalChats} chats`;
            progressBar.style.width = '100%';

            // Hide notification after 5 seconds
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * Update auto-download notification
     */
    updateAutoDownloadNotification(progress) {
        const notification = document.getElementById('auto-download-notification');
        const progressBar = document.getElementById('auto-download-progress');
        const progressText = document.getElementById('auto-download-text');

        if (!notification || !progressBar || !progressText) return;

        if (progress.isDownloading) {
            // Show notification
            notification.classList.remove('hidden');

            // Update progress
            const overallPercent = progress.totalChats > 0 ?
                Math.round((progress.processedChats / progress.totalChats) * 100) : 0;

            progressBar.style.width = `${overallPercent}%`;

            // Update text
            if (progress.currentChat) {
                progressText.textContent = `Processing ${progress.currentChat}... (${progress.processedChats}/${progress.totalChats} chats)`;
            } else {
                progressText.textContent = `Preparing download... (${progress.processedMessages} messages processed)`;
            }
        } else {
            // Hide notification after a delay
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 3000);

            progressText.textContent = 'Download completed!';
            progressBar.style.width = '100%';
        }
    }

    /**
     * Show auto-download notification on ready
     */
    showAutoDownloadNotification() {
        const notification = document.getElementById('auto-download-notification');
        if (notification) {
            notification.classList.remove('hidden');

            // Update initial text
            const progressText = document.getElementById('auto-download-text');
            if (progressText) {
                progressText.textContent = 'Starting automatic download...';
            }
        }
    }

    /**
     * Show profile pictures loading notification
     */
    showProfilePicturesLoadingNotification() {
        console.log('📸 Starting profile pictures loading...');

        // Create temporary notification for profile pictures
        const existingNotification = document.getElementById('profile-pics-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'profile-pics-notification';
        notification.className = 'auto-download-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="bi bi-person-circle"></i>
                </div>
                <div class="notification-text">
                    <h6>Loading profile pictures...</h6>
                    <p>Downloading profile pictures for all contacts and groups.</p>
                    <div class="notification-progress">
                        <div class="progress">
                            <div class="progress-bar" id="profile-pics-progress"></div>
                        </div>
                        <small class="progress-text" id="profile-pics-text">Starting...</small>
                    </div>
                </div>
            </div>
        `;

        // Insert after auto-download notification
        const autoDownloadNotification = document.getElementById('auto-download-notification');
        if (autoDownloadNotification && autoDownloadNotification.parentNode) {
            autoDownloadNotification.parentNode.insertBefore(notification, autoDownloadNotification.nextSibling);
        } else {
            // Fallback: add to welcome screen
            const welcomeContent = document.querySelector('.welcome-content');
            if (welcomeContent) {
                welcomeContent.appendChild(notification);
            }
        }

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WAMonitorDashboard();
});


