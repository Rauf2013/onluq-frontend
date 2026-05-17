# Onluq — Frontend (React + Vite)

Bacariq.az / Onluq freelance platformasının frontend interfeysi.

## Quraşdırma

```bash
npm install
cp .env.example .env
# .env içində VITE_API_URL və VITE_GOOGLE_CLIENT_ID doldur
npm run dev
```

Dev: `http://localhost:5173`

## Production build

```bash
npm run build
npm run preview
```

`dist/` qovluğu hazır build-i saxlayır.

## Stack

- **React 18 + Vite** — UI
- **react-router-dom** — routing
- **socket.io-client** — real-time
- **lucide-react** — ikonlar
- **react-toastify** — bildirişlər

## Özəlliklər

- Google ilə giriş + email/şifrə
- Profil + portfolyo qalereyası + dairəvi avatar kropçısı (YouTube tarzı)
- Xidmət vitrini, kateqoriya filtrlər, trend carousel
- WhatsApp tarzı real-time mesajlaşma (emoji, fayl, custom təklif)
- Sifariş və ödəniş axını
- Rəylər + satıcı cavabları
- Tam dark mode + mobil uyumluluq
- Admin panel (yalnız allowlist-dəki emaillər üçün)

## Backend repo

→ [onluq-backend](https://github.com/Rauf2013/onluq-backend) (ayrı repo)
