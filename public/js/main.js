// Inisialisasi socket.io
const socket = io();

// Elemen DOM
const chatList = document.getElementById('chat-list');
const chatBody = document.getElementById('chat-body');
const welcomeScreen = document.getElementById('welcome-screen');
const chatScreen = document.getElementById('chat-screen');
const chatContactName = document.getElementById('chat-contact-name');
const chatContactImg = document.getElementById('chat-contact-img');
const chatContactStatus = document.getElementById('chat-contact-status');
const searchInput = document.getElementById('search-input');
const logoutBtn = document.getElementById('logout-btn');
const userName = document.getElementById('user-name');

// Variabel untuk menyimpan data
let currentChatId = null;
let allChats = [];
let allContacts = [];
let mediaModal = new bootstrap.Modal(document.getElementById('mediaModal'));
let downloadMediaBtn = document.getElementById('downloadMediaBtn');

// Format waktu
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format tanggal
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hari Ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Kemarin';
    } else {
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}

// Format teks WhatsApp (bold, italic, strikethrough, monospace)
function formatWhatsAppText(text) {
    if (!text) return '';

    // Bold: *text*
    text = text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Italic: _text_
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');

    // Strikethrough: ~text~
    text = text.replace(/~(.*?)~/g, '<del>$1</del>');

    // Monospace: ```text```
    text = text.replace(/```(.*?)```/g, '<code>$1</code>');

    // Monospace (single line): `text`
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');

    // Ganti newline dengan <br>
    text = text.replace(/\n/g, '<br>');

    // Konversi emoji
    if (window.joypixels) {
        text = window.joypixels.shortnameToImage(text);
    }

    return text;
}

// Mendapatkan nama kontak dari ID
function getContactName(id) {
    // Hapus bagian @c.us dari ID
    const formattedId = id.replace('@c.us', '');

    // Cari di daftar kontak
    const contact = allContacts.find(c => c.id._serialized === id);

    if (contact && contact.name) {
        return contact.name;
    } else if (contact && contact.pushname) {
        return contact.pushname;
    } else {
        return formattedId;
    }
}

// Render daftar chat
function renderChatList(chats) {
    chatList.innerHTML = '';

    if (!chats || chats.length === 0) {
        chatList.innerHTML = '<div class="text-center p-5"><p>Tidak ada chat</p></div>';
        return;
    }

    // Tampilkan semua chat termasuk grup
    // Urutkan berdasarkan timestamp pesan terakhir (terbaru di atas)
    chats.sort((a, b) => {
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

    chats.forEach(chat => {
        const contactName = chat.isGroup ? chat.name : getContactName(chat.id._serialized);
        const lastMessage = chat.lastMessage ?
            (chat.lastMessage.hasMedia ? '📎 Media' : chat.lastMessage.body.substring(0, 30) + (chat.lastMessage.body.length > 30 ? '...' : '')) :
            '';
        const lastMessageTime = chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : '';
        const unreadCount = chat.unreadCount;

        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${currentChatId === chat.id._serialized ? 'active' : ''} ${chat.isGroup ? 'group-chat' : ''}`;
        chatItem.dataset.chatId = chat.id._serialized;

        chatItem.innerHTML = `
            <img src="https://placehold.co/49x49/128C7E/FFFFFF.png?text=${encodeURIComponent(contactName.substring(0, 2))}" alt="${contactName}" class="chat-avatar">
            <div class="chat-info">
                <div class="chat-name">${contactName}</div>
                <div class="chat-last-message">${lastMessage}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">${lastMessageTime}</div>
                ${unreadCount > 0 ? `<div class="chat-badge">${unreadCount}</div>` : ''}
            </div>
        `;

        chatItem.addEventListener('click', () => {
            // Hapus kelas active dari semua chat item
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });

            // Tambahkan kelas active ke chat item yang dipilih
            chatItem.classList.add('active');

            // Tampilkan chat
            showChat(chat.id._serialized, contactName);
        });

        chatList.appendChild(chatItem);
    });
}

// Tampilkan chat
function showChat(chatId, contactName) {
    currentChatId = chatId;

    // Tampilkan layar chat
    welcomeScreen.classList.add('d-none');
    chatScreen.classList.remove('d-none');

    // Atur informasi kontak
    chatContactName.textContent = contactName;
    chatContactImg.src = `https://placehold.co/40x40/128C7E/FFFFFF.png?text=${encodeURIComponent(contactName.substring(0, 2))}`;

    // Kosongkan chat body dan tampilkan loading
    chatBody.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Memuat pesan...</p>
        </div>
    `;

    // Minta pesan untuk chat ini
    socket.emit('get-messages', chatId);
}

// Render pesan
function renderMessages(chatId, messages) {
    console.log(`Rendering messages for chat ${chatId}`);
    console.log(`Number of messages: ${messages ? messages.length : 0}`);

    if (currentChatId !== chatId) {
        console.log(`Current chat ID (${currentChatId}) doesn't match requested chat ID (${chatId})`);
        return;
    }

    chatBody.innerHTML = '';

    if (!messages || messages.length === 0) {
        console.log('No messages to display');
        chatBody.innerHTML = '<div class="text-center p-5"><p>Tidak ada pesan</p></div>';
        return;
    }

    console.log('Messages available, rendering...');

    let currentDate = null;

    // Cek apakah ini adalah grup
    const isGroup = chatId.endsWith('@g.us');

    // Urutkan pesan dari yang terlama ke terbaru
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    sortedMessages.forEach(message => {
        const messageDate = formatDate(message.timestamp);

        // Tambahkan pemisah tanggal jika tanggal berubah
        if (messageDate !== currentDate) {
            currentDate = messageDate;
            const dateDivider = document.createElement('div');
            dateDivider.className = 'date-divider';
            dateDivider.innerHTML = `<span>${messageDate}</span>`;
            chatBody.appendChild(dateDivider);
        }

        const isFromMe = message.fromMe;
        const messageTime = formatTime(message.timestamp);

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isFromMe ? 'sent' : 'received'}`;

        let messageContent = '';

        // Tambahkan nama pengirim jika ini adalah grup dan bukan pesan dari saya
        if (isGroup && !isFromMe && message.author) {
            const authorName = getContactName(message.author);
            messageContent += `<div class="message-author">${authorName}</div>`;
        }

        // Cek apakah pesan memiliki media
        if (message.hasMedia) {
            const mediaType = message._data && message._data.mimetype ? message._data.mimetype.split('/')[0] :
                             (message.mimetype ? message.mimetype.split('/')[0] : 'unknown');

            // Cek apakah pesan memiliki mediaPath (sudah diunduh)
            if (message.mediaPath) {
                if (mediaType === 'image') {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <img src="${message.mediaPath}" alt="Image" class="media-preview">
                        </div>
                    `;
                } else if (mediaType === 'video') {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <video controls class="media-preview">
                                <source src="${message.mediaPath}" type="${message.mimetype}">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                } else if (mediaType === 'audio') {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <audio controls>
                                <source src="${message.mediaPath}" type="${message.mimetype}">
                                Your browser does not support the audio tag.
                            </audio>
                        </div>
                    `;
                } else {
                    // Dokumen atau tipe lainnya
                    const filename = message.mediaPath.split('/').pop();
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <div class="document-preview">
                                <i class="bi bi-file-earmark-text document-icon"></i>
                                <div class="document-info">
                                    <span class="document-name">${filename}</span>
                                    <a href="${message.mediaPath}" download class="document-download">
                                        <i class="bi bi-download"></i> Unduh
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                // Media belum diunduh, tampilkan ikon dan unduh otomatis
                if (mediaType === 'image') {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <div class="message-media-icon">
                                <i class="bi bi-image"></i>
                                <span>Foto</span>
                                <div class="media-loading">
                                    <div class="spinner-border spinner-border-sm text-success" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span>Mengunduh...</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (mediaType === 'video') {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <div class="message-media-icon">
                                <i class="bi bi-camera-video"></i>
                                <span>Video</span>
                                <div class="media-loading">
                                    <div class="spinner-border spinner-border-sm text-success" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span>Mengunduh...</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (mediaType === 'audio') {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <div class="message-media-icon">
                                <i class="bi bi-file-earmark-music"></i>
                                <span>Audio</span>
                                <div class="media-loading">
                                    <div class="spinner-border spinner-border-sm text-success" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span>Mengunduh...</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    messageContent = `
                        <div class="message-media" data-message-id="${message.id.id}" data-chat-id="${chatId}">
                            <div class="message-media-icon">
                                <i class="bi bi-file-earmark"></i>
                                <span>Dokumen</span>
                                <div class="media-loading">
                                    <div class="spinner-border spinner-border-sm text-success" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <span>Mengunduh...</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Unduh media secara otomatis
                setTimeout(() => {
                    socket.emit('download-media', { messageId: message.id.id, chatId: chatId });
                }, 500);
            }
        }

        // Tambahkan teks pesan jika ada
        if (message._isDeleted) {
            // Pesan yang dihapus
            let messageBody = message.body;

            // Coba ambil body dari _data jika ada
            if (!messageBody && message._data && message._data.body) {
                messageBody = message._data.body;
            }

            if (messageBody && messageBody !== '(Pesan ini telah dihapus)') {
                messageContent += `<div class="message-text deleted-message">
                    <i class="bi bi-trash"></i> Pesan ini telah dihapus: ${formatWhatsAppText(messageBody)}
                </div>`;
            } else {
                messageContent += `<div class="message-text deleted-message">
                    <i class="bi bi-trash"></i> Pesan ini telah dihapus
                </div>`;
            }

            // Debug info
            console.log('Pesan yang dihapus:', message);
            if (message._data) {
                console.log('Data pesan yang dihapus:', message._data);
            }
        } else if (message.body) {
            // Format teks pesan (bold, italic, dll)
            const formattedText = formatWhatsAppText(message.body);
            messageContent += `<div class="message-text">${formattedText}</div>`;
        }

        // Tambahkan debug info untuk membantu troubleshooting
        console.log(`Rendering message: ${message.id ? message.id.id : 'unknown'}, isDeleted: ${message._isDeleted ? 'yes' : 'no'}, body: ${message.body ? message.body.substring(0, 30) : 'empty'}`);

        messageDiv.innerHTML = `
            <div class="message-content" data-message-id="${message.id.id}">
                ${messageContent}
                <div class="message-time">${messageTime}</div>
            </div>
        `;

        chatBody.appendChild(messageDiv);
    });

    // Scroll ke pesan terbaru
    chatBody.scrollTop = chatBody.scrollHeight;

    // Tambahkan event listener untuk media
    document.querySelectorAll('.message-media').forEach(media => {
        media.addEventListener('click', function() {
            const messageId = this.dataset.messageId;
            const chatId = this.dataset.chatId;

            // Minta download media
            socket.emit('download-media', { messageId, chatId });

            // Tampilkan loading di modal
            document.getElementById('mediaModalBody').innerHTML = `
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Mengunduh media...</p>
            `;

            // Tampilkan modal
            mediaModal.show();
        });
    });
}

// Event listener untuk pencarian
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();

    if (!allChats || allChats.length === 0) return;

    // Filter chat berdasarkan nama kontak
    const filteredChats = allChats.filter(chat => {
        const contactName = getContactName(chat.id._serialized).toLowerCase();
        return contactName.includes(searchTerm);
    });

    renderChatList(filteredChats);
});

// Event listener untuk logout
logoutBtn.addEventListener('click', function() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        window.location.href = '/index.html';
    }
});

// Socket events
socket.on('chats', (chats) => {
    console.log(`Received ${chats ? chats.length : 0} chats from server`);
    allChats = chats;
    renderChatList(chats);
});

socket.on('contacts', (contacts) => {
    console.log(`Received ${contacts ? contacts.length : 0} contacts from server`);
    allContacts = contacts;
    // Re-render chat list dengan nama kontak yang benar
    renderChatList(allChats);
});

socket.on('messages', (data) => {
    console.log(`Received messages for chat ${data.chatId} from server`);
    console.log(`Number of messages received: ${data.messages ? data.messages.length : 0}`);
    renderMessages(data.chatId, data.messages);
});

socket.on('new-message', (data) => {
    // Jika pesan untuk chat yang sedang aktif, tambahkan ke tampilan
    if (currentChatId === data.chatId) {
        socket.emit('get-messages', currentChatId);
    }

    // Update daftar chat
    socket.emit('get-chats');
});

socket.on('media-downloaded', (data) => {
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
                <span>${filename}</span>
            </div>
        `;
    }

    document.getElementById('mediaModalBody').innerHTML = mediaContent;
    downloadMediaBtn.href = filePath;

    // Update pesan di chat jika chat sedang aktif
    if (currentChatId === chatId) {
        // Cari pesan dengan ID yang sesuai
        const mediaElements = document.querySelectorAll(`.message-media[data-message-id="${messageId}"]`);

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
                // Dokumen atau tipe lainnya
                const filename = filePath.split('/').pop();
                element.innerHTML = `
                    <div class="document-preview">
                        <i class="bi bi-file-earmark-text document-icon"></i>
                        <div class="document-info">
                            <span class="document-name">${filename}</span>
                            <a href="${filePath}" download class="document-download">
                                <i class="bi bi-download"></i> Unduh
                            </a>
                        </div>
                    </div>
                `;
            }
        });
    }

    // Minta server untuk memperbarui pesan dengan path media
    socket.emit('update-media-path', { messageId, chatId, mediaPath: filePath, mimetype });
});

// Event untuk pesan yang dihapus
socket.on('message_deleted', (data) => {
    console.log(`Pesan dihapus di chat: ${data.chatId}`);

    // Jika pesan yang dihapus ada di chat yang sedang aktif, perbarui tampilan
    if (currentChatId === data.chatId) {
        // Cari pesan di tampilan
        const messageElements = document.querySelectorAll('.message');
        let found = false;

        messageElements.forEach(element => {
            const messageContent = element.querySelector('.message-content');
            if (messageContent && messageContent.dataset.messageId === data.messageId) {
                // Tambahkan kelas untuk menandai pesan yang dihapus
                const messageText = messageContent.querySelector('.message-text');
                if (messageText) {
                    if (data.message.body) {
                        messageText.innerHTML = `
                            <i class="bi bi-trash"></i> Pesan ini telah dihapus: ${formatWhatsAppText(data.message.body)}
                        `;
                    } else {
                        messageText.innerHTML = `
                            <i class="bi bi-trash"></i> Pesan ini telah dihapus
                        `;
                    }
                    found = true;
                }
            }
        });

        // Jika pesan tidak ditemukan di tampilan, mungkin perlu memuat ulang pesan
        if (!found) {
            socket.emit('get-messages', currentChatId);
        }
    }
});


