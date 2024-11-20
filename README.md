# AFy Forecast 🌟

AFy Forecast adalah aplikasi web ramalan zodiak dan tarot yang ditenagai oleh AI. Aplikasi ini menyediakan ramalan harian yang personal dan pembacaan tarot yang mendalam dalam bahasa Indonesia dan Inggris.

## ✨ Fitur

- 🔮 Ramalan zodiak harian
- 🎴 Pembacaan tarot
- 🌏 Dukungan multi-bahasa (ID/EN)
- 🔒 Autentikasi pengguna
- 📱 Responsif di semua perangkat
- 🔄 Berbagi ramalan di media sosial

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Realtime Database
- **AI**: Google Gemini Pro
- **Deployment**: Vercel
- **Monitoring**: Discord Bot

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 atau lebih baru)
- npm atau yarn
- Firebase account
- Google AI (Gemini) API key
- Discord Bot (untuk monitoring)

### Installation

1. Clone repository
bash
git clone https://github.com/AkmalFirliyanto/AFyForecast.git
cd forecast-web

2. Install dependencies
bash
npm install
atau
yarn install

3. Setup environment variables
bash
cp .env.example .env.local

4. Isi environment variables yang dibutuhkan di `.env.local`:
plaintext
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
GEMINI_API_KEY=
DISCORD_BOT_TOKEN=
DISCORD_CHANNEL_ID=

5. Jalankan development server
bash
npm run dev
atau
yarn dev

## 📱 Fitur Utama

### Ramalan Zodiak
- Ramalan harian untuk 12 zodiak
- Mencakup aspek karir, cinta, kesehatan, dan tips
- Profil zodiak lengkap dengan elemen, planet, dan karakteristik

### Pembacaan Tarot
- Spread 3 kartu (Past, Present, Future)
- Interpretasi mendalam berbasis AI
- 78 kartu tarot lengkap dengan makna

### Sistem Multi-bahasa
- Dukungan bahasa Indonesia dan Inggris
- Penyimpanan preferensi bahasa
- Konten dinamis sesuai bahasa

## 🔒 Security

- Autentikasi pengguna wajib
- Rate limiting untuk API calls
- Validasi input ketat
- Caching untuk optimasi performa

## 🤝 Contributing

Kontribusi selalu diterima! Silakan buat pull request atau laporkan issues.

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Your Name - [@akmlfy_](https://instagram.com//akmlfy_)

Project Link: https://github.com/AkmalFirliyanto/AFyForecast.git

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Google Gemini](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

Made with ❤️ by Akmal (https://github.com/akmalfirliyanto)
