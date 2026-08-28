# Student AI — Cloudflare Hosting Qo'llanmasi (Cloudflare Pages & Workers)

Loyihani Cloudflare Pages platformasida 100% to'liq va uzluksiz ishga tushirish uchun barcha konfiguratsiyalar (`_redirects`, `_headers`, `wrangler.jsonc`, `wrangler.toml` va `/functions/api/` Serverless Edge Functions) to'liq tayyorlandi.

---

## 🚀 1-Usul: Cloudflare Dashboard (GitHub orqali avtomatik deploy)

1. **GitHub omboriga yuklash:**
   - Ushbu loyiha kodlarini o'zingizning GitHub hisobingizga yuklang (Push qiling).

2. **Cloudflare hisobiga kirish:**
   - [Cloudflare Dashboard](https://dash.cloudflare.com/) ga kiring.
   - Chap paneldan **Workers & Pages** bo'limiga o'ting.
   - **Create Application** -> **Pages** -> **Connect to Git** tugmasini bosing.

3. **Loyiha sozlamalari (Build Settings):**
   - **Project Name:** `student-ai` (yoki ixtiyoriy nom)
   - **Framework Preset:** `Vite` (yoki `None`)
   - **Build command:** `npm run build` (yoki `npm run build:cf`)
   - **Build output directory:** `dist`
   - **Root directory:** `/`

4. **Muhit o'zgaruvchilari (Environment Variables):**
   - **Settings** -> **Environment variables** bo'limiga o'tib, quyidagi o'zgaruvchini qo'shing:
     - `GEMINI_API_KEY`: *Sizning Google Gemini API kalitingiz*
     - `NODE_VERSION`: `20` (tavsiya etiladi)

5. **Save and Deploy** tugmasini bosing.
   - Cloudflare loyihangizni avtomatik ravishda quradi va `https://student-ai.pages.dev` kabi bepul global tezkor subdomenda ishga tushiradi!

---

## ⚡ 2-Usul: Wrangler CLI orqali to'g'ridan-to'g'ri terminaldan deploy qilish

Agar loyihani to'g'ridan-to'g'ri terminal orqali Cloudflare'ga chiqarmoqchi bo'lsangiz:

```bash
# 1. Loyihani quring
npm run build:cf

# 2. Cloudflare'ga bevosita deploy qiling
npx wrangler pages deploy dist --project-name=student-ai
```

---

## 🛡️ Loyihadagi Cloudflare Funksiyalari:

- **Edge Serverless API (`/functions/api/`):** Cloudflare Edge tarmog'ida barcha API so'rovlari (`/api/ai/*`, `/api/subjects`, `/api/auth/*`, va h.k.) avtomatik ishlaydi.
- **SPA Routing (`_redirects`):** Sahifani qayta yuklaganda (refresh) 404 xatoligi bermasligi uchun barcha sahifalar `index.html` ga yo'naltirilgan.
- **Security & Speed Headers (`_headers`):** HTTPS, HSTS, XSS himoyasi, X-Frame-Options va kesh boshqaruvi optimallashtirilgan.
- **Global CDN:** 300+ shaharlardagi Cloudflare serverlarida < 50ms tezlikda yuklanadi.
