# PINpall Builder – DAILY MODE

## 1. Start dnia (dev)

1. `git pull`
2. Upewnij się, że masz `.env` (na bazie `.env.example`).
3. Zainstaluj paczki (tylko gdy coś się zmieniło):
   ```bash
   npm install
Uruchom backend:

bash
Skopiuj kod
npx tsx server/index.ts
Sprawdź:

GET http://127.0.0.1:3000/api/health

testowy upload na /api/parse-chat z małym plikiem TXT.

2. Flow pracy nad feature
Wybierz jedno zadanie z TODO/PROD_CHECKLIST (max 1 naraz).

Utwórz branch:

bash
Skopiuj kod
git checkout -b feature/<krotki-opis>
Zmieniasz tylko to, co dotyczy zadania (np. server/middleware/security.ts albo server/broker/*).

Test:

lokalny request na endpoint,

sprawdzenie odpowiedzi i ewentualnych błędów w konsoli.

3. Przed commitem
Szybki smoke-test:

upload pliku na /api/parse-chat,

/api/projects,

/api/projects/:id/download.

Usuń zbędne console.log (szczególnie z danymi wejściowymi).

Commit:

bash
Skopiuj kod
git commit -am "feat: <opis zadania>"
git push
4. Tryb PROD
Ustaw NODE_ENV=production w .env (lokalnie do testu).

Uruchom:

bash
Skopiuj kod
npx tsx server/index.ts
Sprawdź:

/api/health zwraca env: "production",

CORS działa tylko dla dopuszczonych originów,

rate-limit faktycznie odcina przy spamie.

5. Priorytety
Kolejność prac:

🔐 Stabilny i bezpieczny backend (bez crashy, z sensownymi błędami).

🧠 Broker / adapter (żeby każdy projekt miał projectKind i sensowny spec).

📦 ZIP + projekty działają w całości.

🎨 Dopiero potem UX/front / ładne ekrany.

yaml
Skopiuj kod

---

### KROK 3 – Krótki status vs. CHECKLIST (żebyś widział, że nie robimy syfu)

Możesz w `PROD_CHECKLIST.md` dopisać sobie inline:

- przy backend/core i endpointach – `[DONE]`,
- przy security – `[TODO]`,
- przy broker v1 – `[IN PROGRESS]`,
- przy broker v2 (logika projektowa) – `[LATER]`.

To nie jest kosmetyka – to będzie **Twoja mapa**, żebyśmy się nie zgubili przy kolejnych iteracjach.

---

## 3. Co dalej po tym?

Następny logiczny krok po przeniesieniu checklisty + DAILY_MODE:

1. **Domknąć security** – tak, żeby pasowało do checklisty:
   - upewnić się, że:
     - `server/config/env.ts` jest,
     - `server/middleware/{logger,security,error}.ts` mają treść, którą Ci wcześniej podałem,
     - `server/index.ts` ich realnie używa (`applySecurity`, `httpLogger`, `errorHandler`, itd.).
2. Zrobić **smoke test**:
   - `npm run build`,
   - `npx tsx server/index.ts`,
   - 2–3 requesty (`/api/health`, `/api/parse-chat`, `/api/projects`).

Jeśli chcesz, mogę w następnej odpowiedzi:

- przelecieć *konkretnie* po Twoim obecnym `server/index.ts` (wkleisz)  
  i dopasować go 1:1 do checklisty PROD (security + logger + error handler),
- albo rozpisać **mini-ROADMAPĘ** z checklisty w stylu:
  - Dzień 1: security,
  - Dzień 2: broker PINpall v2,
  - Dzień 3: docs & polish.

Ty wybierasz, a ja robię za autopilota.
::contentReference[oaicite:0]{index=0}






