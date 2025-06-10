const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const moment = require('moment');

// Inisialisasi Express
const app = express();
const server = http.createServer(app);

// Security and performance middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));
app.use(compression());

// Socket.IO with CORS configuration
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Folder untuk menyimpan media
const mediaFolder = path.join(__dirname, 'media');
fs.ensureDirSync(mediaFolder);

// Serve static files
app.use(express.static('public'));
app.use('/media', express.static('media'));

// Inisialisasi WhatsApp client dengan konfigurasi yang lebih robust
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './wa-session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        timeout: 60000
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
    // Disable read receipts to prevent marking messages as read
    markOnlineOnConnect: false,
    restartOnAuthFail: true
});

// Variabel untuk menyimpan data chat
let chats = [];
let contacts = [];
let messages = {};
let deletedMessages = {}; // Untuk menyimpan pesan yang dihapus
let deletedMediaCache = new Map(); // Cache untuk media yang dihapus
let callLogsCache = new Map(); // Cache untuk call logs

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client terhubung');

    // Kirim data yang sudah ada ke client baru
    if (client.info) {
        socket.emit('whatsapp-info', client.info);
    }

    socket.emit('chats', chats);
    socket.emit('contacts', contacts);

    // Handle permintaan pesan untuk chat tertentu
    socket.on('get-messages', async (chatId) => {
        console.log(`Menerima permintaan pesan untuk chat: ${chatId}`);
        try {
            let allMessages = [];

            // Ambil pesan dari WhatsApp
            const chat = await client.getChatById(chatId);
            // Ambil 50 pesan terakhir tanpa membaca pesan (keepUnread: true)
            const fetchedMessages = await chat.fetchMessages({ limit: 50, keepUnread: true });
            console.log(`Berhasil mengambil ${fetchedMessages.length} pesan untuk chat ${chatId}`);

            // Simpan pesan di cache
            messages[chatId] = fetchedMessages;

            // Gabungkan dengan pesan yang dihapus
            allMessages = [...fetchedMessages];

            // Cek apakah ada pesan yang dihapus untuk chat ini
            if (deletedMessages[chatId] && deletedMessages[chatId].length > 0) {
                console.log(`Menambahkan ${deletedMessages[chatId].length} pesan yang dihapus`);

                // Tambahkan pesan yang dihapus yang belum ada di allMessages
                deletedMessages[chatId].forEach(deletedMsg => {
                    const exists = allMessages.some(msg => msg.id.id === deletedMsg.id.id);
                    if (!exists) {
                        allMessages.push(deletedMsg);
                    }
                });
            }

            // Cek folder pesan yang dihapus
            try {
                const chatFolder = path.join(mediaFolder, chatId.replace(/[^a-zA-Z0-9]/g, '_'));
                if (fs.existsSync(chatFolder)) {
                    const files = fs.readdirSync(chatFolder);
                    const deletedFiles = files.filter(file => file.startsWith('deleted_') && file.endsWith('.json'));

                    if (deletedFiles.length > 0) {
                        console.log(`Menemukan ${deletedFiles.length} file pesan yang dihapus`);

                        for (const file of deletedFiles) {
                            try {
                                const filePath = path.join(chatFolder, file);
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                const deletedMsg = JSON.parse(fileContent);

                                // Tambahkan flag bahwa pesan ini dihapus
                                deletedMsg._isDeleted = true;

                                // Pastikan body pesan tetap ada
                                if (deletedMsg._data && deletedMsg._data.body) {
                                    deletedMsg.body = deletedMsg._data.body;
                                }

                                // Cek apakah pesan sudah ada di allMessages
                                const exists = allMessages.some(msg => msg.id && msg.id.id === deletedMsg.id.id);
                                if (!exists) {
                                    // Pastikan objek pesan memiliki semua properti yang diperlukan
                                    if (!deletedMsg.id) {
                                        deletedMsg.id = { id: file.replace('deleted_', '').replace('.json', '') };
                                    }

                                    // Tambahkan ke daftar pesan
                                    allMessages.push(deletedMsg);
                                    console.log(`Menambahkan pesan yang dihapus dari file: ${deletedMsg.id.id}, body: ${deletedMsg.body || 'tidak ada'}`);
                                }
                            } catch (fileError) {
                                console.error(`Error saat membaca file ${file}:`, fileError);
                            }
                        }
                    }
                }
            } catch (folderError) {
                console.error('Error saat memeriksa folder pesan yang dihapus:', folderError);
            }

            // Urutkan pesan berdasarkan timestamp
            allMessages.sort((a, b) => b.timestamp - a.timestamp);

            socket.emit('messages', { chatId, messages: allMessages });
        } catch (error) {
            console.error('Error saat mengambil pesan:', error);
            socket.emit('error', { message: 'Gagal mengambil pesan' });
        }
    });

    // Handle permintaan download media
    socket.on('download-media', async (data) => {
        try {
            const { messageId, chatId } = data;
            const chat = await client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit: 50, keepUnread: true });
            const message = messages.find(msg => msg.id.id === messageId);

            if (message && message.hasMedia) {
                const media = await message.downloadMedia();
                if (media) {
                    // Buat nama file yang unik
                    const extension = media.mimetype.split('/')[1];
                    const filename = `${Date.now()}-${messageId}.${extension}`;
                    const filePath = path.join(mediaFolder, filename);

                    // Simpan file
                    fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));

                    // Tambahkan path file ke pesan di cache
                    if (messages[chatId]) {
                        const msgIndex = messages[chatId].findIndex(msg => msg.id.id === messageId);
                        if (msgIndex !== -1) {
                            messages[chatId][msgIndex].mediaPath = `/media/${filename}`;
                            messages[chatId][msgIndex].mimetype = media.mimetype;
                        }
                    }

                    // Kirim path file ke client
                    socket.emit('media-downloaded', {
                        messageId,
                        chatId,
                        filePath: `/media/${filename}`,
                        mimetype: media.mimetype
                    });
                }
            }
        } catch (error) {
            console.error('Error saat mengunduh media:', error);
            socket.emit('error', { message: 'Gagal mengunduh media' });
        }
    });

    // Handle update media path
    socket.on('update-media-path', (data) => {
        try {
            const { messageId, chatId, mediaPath, mimetype } = data;

            // Update pesan di cache
            if (messages[chatId]) {
                const msgIndex = messages[chatId].findIndex(msg => msg.id && msg.id.id === messageId);
                if (msgIndex !== -1) {
                    messages[chatId][msgIndex].mediaPath = mediaPath;
                    messages[chatId][msgIndex].mimetype = mimetype;
                    console.log(`Media path updated for message ${messageId} in chat ${chatId}`);
                }
            }
        } catch (error) {
            console.error('Error saat update media path:', error);
        }
    });

    // Handle permintaan call logs
    socket.on('get-call-logs', (chatId) => {
        try {
            const callLogs = callLogsCache.get(chatId) || [];
            socket.emit('call-logs', { chatId, callLogs });
        } catch (error) {
            console.error('Error getting call logs:', error);
            socket.emit('error', { message: 'Gagal mengambil call logs' });
        }
    });

    // Handle permintaan deleted media
    socket.on('get-deleted-media', (messageId) => {
        try {
            const mediaInfo = deletedMediaCache.get(messageId);
            if (mediaInfo) {
                socket.emit('deleted-media', { messageId, mediaInfo });
            }
        } catch (error) {
            console.error('Error getting deleted media:', error);
        }
    });
});

// WhatsApp client events
client.on('qr', (qr) => {
    // Generate QR code sebagai URL data
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Error saat membuat QR code:', err);
            return;
        }
        io.emit('qr', url);
        console.log('QR Code generated');
    });
});

client.on('ready', async () => {
    console.log('Client siap!');
    io.emit('ready', { status: true });

    // Ambil semua chat
    chats = await client.getChats();
    io.emit('chats', chats);

    // Ambil semua kontak
    contacts = await client.getContacts();
    io.emit('contacts', contacts);
});

client.on('authenticated', () => {
    console.log('Authenticated');
    io.emit('authenticated', { status: true });
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
    io.emit('auth_failure', { status: false, message: msg });
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
    io.emit('disconnected', { status: false, message: reason });
    // Reset data
    chats = [];
    contacts = [];
    messages = {};
});

// Menangani pesan baru
client.on('message', async (message) => {
    console.log(`Pesan baru diterima dari: ${message.from}`);
    console.log(`Isi pesan: ${message.body.substring(0, 30)}${message.body.length > 30 ? '...' : ''}`);
    console.log(`Tipe pesan: ${message.type}`);

    // PENTING: Jangan tandai pesan sebagai dibaca untuk monitoring
    // WhatsApp Web secara default akan menandai pesan sebagai dibaca ketika dilihat
    // Kita akan mencegah ini dengan tidak memanggil message.getChat().sendSeen()

    // Jika chat belum ada di messages, buat array baru
    if (!messages[message.from]) {
        messages[message.from] = [];
        console.log(`Membuat array pesan baru untuk chat: ${message.from}`);
    }

    // Tambahkan pesan ke array
    messages[message.from].unshift(message);
    console.log(`Pesan ditambahkan ke cache. Total pesan untuk chat ${message.from}: ${messages[message.from].length}`);

    // Deteksi panggilan dari pesan
    if (message.type === 'call_log') {
        console.log('Call log detected in message');
        const callInfo = {
            id: message.id.id,
            from: message.from,
            to: message.to,
            timestamp: message.timestamp * 1000,
            isVideo: message.body.includes('video') || message.body.includes('Video'),
            fromMe: message.fromMe,
            type: 'call',
            duration: 0, // Call logs in messages don't have duration
            status: message.body.includes('Missed') ? 'missed' :
                   message.fromMe ? 'outgoing' : 'incoming'
        };

        // Simpan ke cache call logs
        if (!callLogsCache.has(message.from)) {
            callLogsCache.set(message.from, []);
        }
        callLogsCache.get(message.from).push(callInfo);

        // Emit ke client
        io.emit('call_log', {
            chatId: message.from,
            callInfo: callInfo
        });
    }

    // Jika pesan memiliki media, download dan simpan
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media) {
                const extension = media.mimetype.split('/')[1] || 'bin';
                const filename = `${Date.now()}-${message.id.id}.${extension}`;
                const filePath = path.join(mediaFolder, filename);

                fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));

                // Tambahkan path file ke pesan
                message.mediaPath = `/media/${filename}`;

                console.log(`Media disimpan: ${filename}, tipe: ${media.mimetype}`);
            }
        } catch (error) {
            console.error('Error saat mengunduh media dari pesan baru:', error);
        }
    }

    // Kirim pesan ke semua client
    io.emit('new-message', { chatId: message.from, message });

    // Update daftar chat
    chats = await client.getChats();
    io.emit('chats', chats);
});

// Menangani pesan yang dihapus oleh saya
client.on('message_revoke_me', async (message) => {
    console.log(`Pesan dihapus oleh saya: ${message.body.substring(0, 30)}${message.body.length > 30 ? '...' : ''}`);

    // Tandai pesan sebagai dihapus oleh saya
    message._isDeletedByMe = true;

    // Jika chat belum ada di messages, buat array baru
    if (!messages[message.from]) {
        messages[message.from] = [];
    }

    // Tambahkan pesan ke array
    messages[message.from].unshift(message);

    // Simpan pesan yang dihapus ke file untuk persistensi
    try {
        const chatFolder = path.join(mediaFolder, message.from.replace(/[^a-zA-Z0-9]/g, '_'));
        fs.ensureDirSync(chatFolder);

        const deletedMsgFile = path.join(chatFolder, `deleted_by_me_${message.id.id}.json`);
        fs.writeFileSync(deletedMsgFile, JSON.stringify(message));
        console.log(`Pesan yang dihapus oleh saya disimpan ke ${deletedMsgFile}`);
    } catch (error) {
        console.error('Error saat menyimpan pesan yang dihapus oleh saya:', error);
    }
});

// Menangani pesan yang dihapus untuk semua orang
client.on('message_revoke_everyone', async (after, before) => {
    console.log('Pesan dihapus untuk semua orang');

    try {
        // Jika kita memiliki pesan sebelum dihapus
        if (before) {
            console.log(`Pesan yang dihapus: ${before.body ? before.body.substring(0, 30) + (before.body.length > 30 ? '...' : '') : 'Tidak ada teks'}`);
            console.log(`ID pesan yang dihapus: ${before.id.id}`);

            // Buat salinan pesan yang dihapus dengan informasi yang diperlukan
            const deletedMessage = {
                id: before.id,
                from: before.from,
                to: before.to,
                body: before.body || '',
                _data: before._data || {},
                hasMedia: before.hasMedia,
                timestamp: before.timestamp,
                _isDeleted: true,
                author: before.author || before.from,
                deviceType: before.deviceType,
                isForwarded: before.isForwarded,
                forwardingScore: before.forwardingScore
            };

            // Pastikan body pesan tetap ada
            if (before._data && before._data.body) {
                deletedMessage.body = before._data.body;
            }

            // Jika pesan memiliki media, coba download
            if (before.hasMedia) {
                try {
                    const media = await before.downloadMedia();
                    if (media) {
                        const extension = media.mimetype.split('/')[1];
                        const filename = `${Date.now()}-${before.id.id}.${extension}`;
                        const filePath = path.join(mediaFolder, filename);

                        fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));

                        // Tambahkan path file ke pesan
                        deletedMessage.mediaPath = `/media/${filename}`;
                        deletedMessage.mimetype = media.mimetype;
                    }
                } catch (mediaError) {
                    console.error('Error saat mengunduh media dari pesan yang dihapus:', mediaError);
                }
            }

            // Simpan pesan yang dihapus
            if (!deletedMessages[before.from]) {
                deletedMessages[before.from] = [];
            }

            deletedMessages[before.from].push(deletedMessage);

            // Jika pesan ada di cache pesan normal, tandai sebagai dihapus
            if (messages[before.from]) {
                const msgIndex = messages[before.from].findIndex(msg => msg.id && msg.id.id === before.id.id);
                if (msgIndex !== -1) {
                    // Salin properti dari deletedMessage ke pesan yang ada
                    Object.assign(messages[before.from][msgIndex], deletedMessage);
                    console.log(`Pesan yang dihapus ditemukan di cache dan ditandai`);
                } else {
                    // Jika pesan tidak ditemukan di cache, tambahkan
                    messages[before.from].unshift(deletedMessage);
                    console.log(`Pesan yang dihapus ditambahkan ke cache`);
                }
            } else {
                // Jika chat belum ada di messages, buat array baru
                messages[before.from] = [deletedMessage];
                console.log(`Cache baru dibuat untuk chat dengan pesan yang dihapus`);
            }

            // Simpan pesan yang dihapus ke file untuk persistensi
            try {
                const chatFolder = path.join(mediaFolder, before.from.replace(/[^a-zA-Z0-9]/g, '_'));
                fs.ensureDirSync(chatFolder);

                const deletedMsgFile = path.join(chatFolder, `deleted_${before.id.id}.json`);
                fs.writeFileSync(deletedMsgFile, JSON.stringify(deletedMessage));
                console.log(`Pesan yang dihapus disimpan ke ${deletedMsgFile}`);

                // Kirim notifikasi ke semua client bahwa pesan telah dihapus
                io.emit('message_deleted', {
                    chatId: before.from,
                    messageId: before.id.id,
                    message: deletedMessage
                });

                // Kirim pesan baru ke semua client untuk memastikan pesan yang dihapus tetap ditampilkan
                io.emit('new-message', {
                    chatId: before.from,
                    message: deletedMessage
                });
            } catch (error) {
                console.error('Error saat menyimpan pesan yang dihapus:', error);
            }
        } else if (after) {
            console.log('Pesan yang dihapus tidak tersedia, menggunakan pesan after');
            console.log(`ID pesan after: ${after.id.id}`);

            // Buat salinan pesan yang dihapus dengan informasi yang diperlukan
            const deletedMessage = {
                id: after.id,
                from: after.from,
                to: after.to,
                body: '(Pesan ini telah dihapus)',
                hasMedia: false,
                timestamp: after.timestamp,
                _isDeleted: true,
                author: after.author || after.from,
                deviceType: after.deviceType
            };

            // Jika pesan ada di cache pesan normal, tandai sebagai dihapus
            if (messages[after.from]) {
                const msgIndex = messages[after.from].findIndex(msg => msg.id && msg.id.id === after.id.id);
                if (msgIndex !== -1) {
                    // Salin properti dari deletedMessage ke pesan yang ada
                    Object.assign(messages[after.from][msgIndex], deletedMessage);
                    console.log(`Pesan after yang dihapus ditandai di cache`);

                    // Kirim notifikasi ke semua client
                    io.emit('message_deleted', {
                        chatId: after.from,
                        messageId: after.id.id,
                        message: messages[after.from][msgIndex]
                    });

                    // Kirim pesan baru ke semua client untuk memastikan pesan yang dihapus tetap ditampilkan
                    io.emit('new-message', {
                        chatId: after.from,
                        message: messages[after.from][msgIndex]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error saat menangani pesan yang dihapus:', error);
    }
});

// Event untuk menangani panggilan (call logs)
client.on('call', async (call) => {
    console.log('Panggilan terdeteksi:', call);

    try {
        const callInfo = {
            id: call.id || `call_${Date.now()}`,
            from: call.from,
            to: call.to,
            timestamp: Date.now(),
            isVideo: call.isVideo || false,
            isGroup: call.isGroup || false,
            fromMe: call.fromMe || false,
            type: 'call',
            duration: call.duration || 0,
            status: call.status || 'unknown' // incoming, outgoing, missed
        };

        // Simpan ke cache call logs
        const chatId = call.from;
        if (!callLogsCache.has(chatId)) {
            callLogsCache.set(chatId, []);
        }
        callLogsCache.get(chatId).push(callInfo);

        // Emit ke client
        io.emit('call_log', {
            chatId: chatId,
            callInfo: callInfo
        });

        console.log(`Call log disimpan untuk chat ${chatId}`);
    } catch (error) {
        console.error('Error handling call:', error);
    }
});

// Inisialisasi WhatsApp client
client.initialize();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 WA Monitor Pro server running on port ${PORT}`);
    console.log(`📱 Access the application at: http://localhost:${PORT}`);
    console.log(`🔒 Mobile-optimized and secure monitoring system ready!`);
});
