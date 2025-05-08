# WhatsApp Monitor

Aplikasi pemantauan WhatsApp yang memungkinkan Anda memantau pesan WhatsApp tanpa mengubah status **"dibaca"** pesan tersebut. Dibangun dengan whatsapp-web.js dan Bootstrap 5.

![WhatsApp Monitor Screenshot](https://placehold.co/600x400/128C7E/FFFFFF.png?text=WhatsApp+Monitor)

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
