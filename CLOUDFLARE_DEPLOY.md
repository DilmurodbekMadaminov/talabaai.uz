# 🌐 Talaba AI (Student AI Pro) — Cloudflare Hosting To'liq Qo'llanmasi

Cloudflare platformasida (Cloudflare Pages yoki Cloudflare Workers) loyihaning to'liq va xatosiz ishlashi uchun barcha zaruriy konfiguratsiyalar amalga oshirildi.

---

## ❓ Nima uchun avval Cloudflare'da ishlamagan bo'lishi mumkin?

1. **SPA Routing (404 Not Found xatosi):** 
   - Cloudflare Pages saytni statik fayl sifatida tarqatadi. Agar foydalanuvchi sahifani yangilasa (`F5`) yoki to'g'ridan-to'g'ri `/math`, `/notes` kabi havolaga kirsa, Cloudflare 404 xatoligini berardi. 
   - **Tuzatildi:** `/public/_redirects` (`/* /index.html 200`) va `wrangler.toml` ichidagi SPA routing qo'shildi.

2. **Backend / API arxitekturasi:**
   - Cloudflare Pages/Workers an'anaviy `node server.ts` ni emas, balki serverless **Edge Functions** (`/functions/api/`) mexanizmini ishlatadi.
   - **Tuzatildi:** Barcha AI, Fanlar (Matematika, Informatika), Testlar, Foydalanuvchilar, HEMIS fanlari (`/api/db/edu_data`), Hamyon va WebAuthn funksiyalari Cloudflare Edge Functions (`/functions/api/[[catchall]].ts`) ga to'liq ulandi.

3. **GEMINI_API_KEY muhit o'zgaruvchisi:**
   - Cloudflare serverlarida `process.env.GEMINI_API_KEY` bo'lmagani uchun AI so'rovlari ishlamay qolishi mumkin edi.
   - **Tuzatildi:** Cloudflare Edge funksiyasiga ham `env.GEMINI_API_KEY`, ham ilova ichidagi Sozlamalardan (LocalStorage) API kalitni qabul qilish imkoniyati qo'shildi.

---

## 🚀 1-USUL: Cloudflare Pages (GitHub orqali 1 marta ulab qo'yish — Tavsiya etiladi)

1. **Kodingizni GitHub omboringizga yuklang (Push qiling).**
2. [Cloudflare Dashboard](https://dash.cloudflare.com/) ga kiring.
3. Chap paneldan **Workers & Pages** bo'limiga o'ting.
4. **Create application** ➔ **Pages** ➔ **Connect to Git** ni bosing.
5. O'zingizning GitHub omboringizni tanlang.
6. **Loyiha sozlamalarini quyidagicha belgilang:**
   - **Framework preset:** `Vite` (yoki `None`)
   - **Build command:** `npm run build` *(yoki `npm run build:cf`)*
   - **Build output directory:** `dist`
   - **Root directory:** `/`
7. **Environment variables (Muhit o'zgaruvchilari):**
   - **Add variable** tugmasini bosing:
     - **Variable name:** `GEMINI_API_KEY`
     - **Value:** `Sizning_Google_Gemini_API_Kalitingiz`
8. **Save and Deploy** tugmasini bosing. 
   - Cloudflare 1-2 daqiqada butun dunyo bo'ylab eng tezkor CDN tarmog'ida saytingizni ishga tushiradi!

---

## ⚡ 2-USUL: Wrangler CLI orqali to'g'ridan-to'g'ri terminaldan deploy qilish

Agar GitHub sizda ulanmagan bo'lsa, o'z kompyuteringiz terminalidan quyidagi buyruqlarni bering:

```bash
# 1. Loyihani build qilish
npm run build:cf

# 2. Cloudflare hisobingizga kirish (1 marta so'raladi)
npx wrangler login

# 3. Cloudflare-ga deploy qilish
npx wrangler deploy
```

---

## 🛡️ Cloudflare-da ishlaydigan barcha imkoniyatlar:
- ✅ **Barcha AI xizmatlari:** Gemini matn tahlili, darslikdan test generatsiya qilish, konspekt va ta'lim murabbiyi.
- ✅ **Matematika va Quiz banki:** Barcha testlar va fanlar uzluksiz yuklanadi.
- ✅ **SPA Routing:** Istalgan sahifa yangilanganda ham bir zumda ochiladi (404 xatosi yo'q).
- ✅ **Xavfsizlik:** Cloudflare DDoS Shield, HTTPS va HSTS shifrlash avtomatik faol.
