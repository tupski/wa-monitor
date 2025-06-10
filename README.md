# 🚀 WA Monitor Pro v2.0 - Advanced WhatsApp Monitoring System

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/wa-monitor-pro)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Mobile First](https://img.shields.io/badge/design-mobile--first-purple.svg)](#mobile-first-design)

> **Advanced WhatsApp monitoring system with mobile-first design, real-time message tracking, and deleted message recovery.**

![WA Monitor Pro Screenshot](https://placehold.co/800x500/6366f1/FFFFFF.png?text=WA+Monitor+Pro+v2.0)

## ✨ What's New in v2.0

### 🔄 **Complete Library Upgrades**
- **Bootstrap**: 5.3.6 → 5.3.3+ (Latest)
- **Socket.IO**: 4.8.1+ (Latest with enhanced real-time capabilities)
- **Express**: 4.19.2+ (Latest stable)
- **WhatsApp-Web.js**: 1.27.0+ (Latest with improved stability)
- **Security**: Added Helmet.js and Compression middleware
- **Performance**: Enhanced with modern optimization techniques

### 📱 **Mobile-First Responsive Design**
- **Completely redesigned UI** with mobile-first approach
- **Touch-friendly interface** optimized for smartphones and tablets
- **Responsive sidebar** with mobile drawer navigation
- **Adaptive layouts** that work seamlessly across all screen sizes
- **PWA capabilities** with offline support and app-like experience

### 🎨 **Visual Differentiation from WhatsApp Web**
- **Custom color scheme** with modern gradient design (Purple/Indigo theme)
- **Unique UI components** that clearly distinguish from original WhatsApp Web
- **Enhanced typography** with Inter font family
- **Modern card-based layouts** with subtle shadows and animations
- **Professional monitoring interface** suitable for business use

### 🔧 **Enhanced Features**
- **Real-time message monitoring** with instant updates
- **Deleted message recovery** with persistent storage and playback
- **Media download and preview** with automatic handling
- **Advanced search functionality** with highlighting and navigation
- **Export capabilities** (JSON, TXT, HTML formats)
- **Call logs tracking** with duration and status
- **Location message support** with interactive maps
- **View-once media handling** for ephemeral content
- **Enhanced document display** with type-specific icons
- **Sticker support** with full rendering
- **Audio/Video players** with enhanced controls
- **Stealth monitoring** without marking messages as read
- **Chat information** with detailed statistics
- **Mobile-optimized interface** with perfect responsiveness

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn package manager
- Chrome/Chromium browser (for WhatsApp Web automation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/wa-monitor-pro.git
   cd wa-monitor-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:3002`
   - Scan the QR code with your WhatsApp mobile app
   - Start monitoring conversations in real-time

### Development Mode
```bash
npm run dev  # Runs with nodemon for auto-restart
```

## 📱 Mobile-First Design

### Desktop Experience
- **Sidebar navigation** with conversation list
- **Main content area** with message display
- **Advanced features** like export and search
- **Professional monitoring dashboard**

### Mobile Experience
- **Collapsible sidebar** with overlay navigation
- **Touch-optimized controls** and gestures
- **Responsive message bubbles** and media previews
- **Mobile-friendly modals** and action sheets
- **PWA installation** for app-like experience

### Tablet Experience
- **Adaptive layout** that utilizes available screen space
- **Enhanced touch targets** for better usability
- **Optimized typography** for comfortable reading
- **Balanced information density**

## 🆕 Latest Features (v2.1 Complete Profile & Media Edition)

### 📞 **Call Logs & Phone Tracking**
- **Automatic Call Detection**: Detects and logs all incoming/outgoing calls
- **Call Duration Tracking**: Shows call duration when available
- **Call Status Indicators**: Visual indicators for missed, incoming, outgoing calls
- **Video Call Support**: Differentiated icons for video calls
- **Call History**: Complete call log with timestamps
- **Color-coded Icons**: Green (incoming), Blue (outgoing), Red (missed), Purple (video)

### 💾 **Deleted Content Recovery**
- **Deleted Messages**: Preserve and display deleted text messages
- **Deleted Media Recovery**: Images, videos, audio files remain accessible
- **Deleted Stickers**: Stickers that were deleted remain visible
- **Deleted Documents**: Document files remain downloadable
- **Media Playback**: Deleted media can still be played/viewed
- **Visual Indicators**: Clear marking of deleted content

### 🔍 **Advanced Message Search**
- **Real-time Search**: Instant search as you type
- **Search Highlighting**: Visual highlighting of search terms
- **Result Navigation**: Previous/Next buttons for search results
- **Result Counter**: Shows "X of Y" results
- **Keyboard Shortcuts**: Enter (next), Shift+Enter (previous), Escape (close)
- **Proper Positioning**: Search bar positioned correctly on all devices

### 📍 **Enhanced Message Types**
- **Location Messages**: Interactive location sharing with map links
- **View Once Media**: Handle ephemeral photos and videos
- **Document Messages**: Enhanced display with file type icons
- **Sticker Support**: Full sticker rendering and display
- **Contact Cards**: Contact sharing support
- **Voice Messages**: Voice note playback with controls

### 🎵 **Enhanced Media Players**
- **Audio Player**: Enhanced audio controls with progress bar
- **Video Player**: Full video player with controls and metadata
- **Media Information**: File size and type information
- **Responsive Design**: Optimized for mobile and desktop
- **Preload Support**: Metadata preloading for better performance

### 📊 **Chat Management & Information**
- **Chat Info Modal**: Detailed chat statistics and information
- **Message Statistics**: Total messages, media count, call count
- **Date Tracking**: First message date and last activity
- **Chat Type Detection**: Individual vs Group chat identification
- **Export Integration**: Direct export from chat info

### 📁 **Multiple Export Formats**
- **JSON Export**: Structured data with full message information
- **Text Export**: Human-readable chat transcript
- **HTML Export**: Styled web page with formatting
- **Date Filtering**: Export by date range (today, week, month, all)
- **Automatic Download**: Files download automatically
- **Filename Generation**: Smart filename with contact name and date

### 🔒 **Stealth Monitoring Mode**
- **No Read Receipts**: Messages remain unread in WhatsApp
- **Silent Monitoring**: Monitor without affecting chat status
- **Server-side Prevention**: Read status prevention at API level
- **Real-time Updates**: Still receive instant updates
- **Privacy Focused**: Monitor without leaving traces

### 📥 **Automatic Message Download**
- **Complete History**: Automatically downloads ALL messages from ALL chats
- **Background Processing**: Downloads happen automatically after WhatsApp connection
- **Batch Processing**: Efficient batch downloading with progress tracking
- **Media Preservation**: All media files are downloaded and preserved
- **Progress Monitoring**: Real-time progress tracking with detailed statistics
- **Error Handling**: Robust error handling with retry mechanisms
- **Persistent Storage**: Messages saved to local files for permanent access
- **Resume Capability**: Can resume interrupted downloads
- **Memory Efficient**: Optimized memory usage during large downloads

### 👤 **Profile Pictures & Contact Details**
- **Profile Picture Display**: Automatic download and display of contact/group profile pictures
- **Contact Information**: Complete contact details including name, number, status, and about
- **Group Information**: Detailed group info with participants, admins, creation date, and description
- **Status Display**: View contact status/about without marking as read
- **Business Indicators**: Visual indicators for business and enterprise accounts
- **Contact Type Detection**: Automatic detection of contact types (individual, group, business)
- **Profile Picture Caching**: Local caching of profile pictures for faster loading
- **Real-time Updates**: Profile pictures and status updates in real-time

### 📱 **Status Monitoring (Stealth Mode)**
- **My Status Display**: View your own status and profile information
- **Status Stories**: Monitor status updates from contacts (when available)
- **Stealth Viewing**: View status without marking as read or seen
- **Status History**: Track status changes over time
- **Profile Picture Updates**: Monitor profile picture changes
- **Privacy Protection**: No read receipts sent when viewing status
- **Real-time Monitoring**: Instant updates when status changes occur

### 🎵 **Enhanced Media Players**
- **Advanced Audio Player**: Custom audio player with waveform visualization
- **Enhanced Video Player**: Custom video controls with progress bar and fullscreen
- **Playback Controls**: Play, pause, seek, volume control, and download options
- **Progress Tracking**: Visual progress bars for audio and video playback
- **Multiple Format Support**: Support for all WhatsApp media formats
- **Download Integration**: Direct download buttons for all media files
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Auto-pause**: Automatic pausing of other media when starting new playback

## Fitur Utama

- **Pemantauan Tanpa Membaca**: Memantau pesan WhatsApp tanpa mengubah status "dibaca" pesan
- **Tampilan Mirip WhatsApp Web**: Antarmuka yang familiar dan mudah digunakan
- **Pesan yang Dihapus**: Menampilkan pesan yang telah dihapus oleh pengirim
- **Dukungan Media**: Menampilkan dan menyimpan gambar, video, audio, dan dokumen
- **Dukungan Grup**: Menampilkan pesan grup dengan nama pengirim
- **Dukungan Format Teks**: Mendukung format teks WhatsApp seperti *bold*, _italic_, ~strikethrough~, dan `monospace`
- **Dukungan Emoji**: Menampilkan emoji dengan benar
- **Unduh Media Otomatis**: Mengunduh dan menyimpan media secara otomatis

## Persyaratan

- Node.js (versi 14 atau lebih baru)
- NPM (versi 6 atau lebih baru)
- Browser Chromium (untuk whatsapp-web.js)

## Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/tupski/wa-monitor.git
   cd wa-monitor
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Jalankan aplikasi:
   ```bash
   npm start
   ```

4. Buka browser dan akses `http://localhost:3000`

5. Pindai kode QR dengan WhatsApp di ponsel Anda untuk masuk

## Cara Penggunaan

1. Setelah memindai kode QR, Anda akan diarahkan ke dashboard
2. Pilih chat di sidebar untuk melihat pesan
3. Media akan diunduh dan ditampilkan secara otomatis
4. Pesan yang dihapus akan tetap ditampilkan dengan indikator

## Teknologi yang Digunakan

- **whatsapp-web.js**: Library untuk berinteraksi dengan WhatsApp Web
- **Express**: Framework web untuk Node.js
- **Socket.IO**: Untuk komunikasi real-time antara server dan client
- **Bootstrap 5**: Framework CSS untuk tampilan responsif
- **JoyPixels**: Untuk dukungan emoji

## Kelebihan Dibandingkan Aplikasi Serupa

- **Preservasi Pesan yang Dihapus**: Menyimpan dan menampilkan pesan yang telah dihapus oleh pengirim
- **Status Pesan Tetap Unread**: Tidak mengubah status "dibaca" pesan di WhatsApp
- **Tampilan Mirip WhatsApp Web**: Antarmuka yang familiar dan mudah digunakan
- **Dukungan Format Teks**: Mendukung semua format teks WhatsApp
- **Dukungan Media Lengkap**: Menampilkan dan menyimpan semua jenis media
- **Dukungan Grup**: Menampilkan pesan grup dengan nama pengirim
- **Ringan dan Cepat**: Dioptimalkan untuk kinerja yang baik

## Kontribusi

Kontribusi selalu diterima! Jika Anda ingin berkontribusi:

1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan Anda (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.

## Kontak

Angga Artupas - [@artupski](https://twitter.com/artupski) - artupski@gmail.com

Link Proyek: [https://github.com/tupski/wa-monitor](https://github.com/tupski/wa-monitor)
