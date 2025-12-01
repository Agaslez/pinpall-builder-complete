# PINpall Builder – Production Checklist

## 1. Bezpieczeństwo

- [ ] Żadne klucze API (Stripe, Fireworks, DeepSeek) nie są w repo
- [ ] `.env` jest w `.gitignore`
- [ ] Endpointy API mają walidację wejścia (Zod)
- [ ] SSRF zablokowany (allowlista domen, brak lokalnych IP)
- [ ] Limit uploadu (max 10–20 MB) + poprawna obsługa błędów
- [ ] CORS ograniczony do naszej domeny i localhost
- [ ] Rate limiting ustawiony na sensownym poziomie (min. dla publicznych endpointów)

## 2. Jakość / Stabilność

- [ ] `npm run build` przechodzi bez błędów
- [ ] `npm test` przechodzi (smoke tests)
- [ ] Smoke test: /api/health → status ok
- [ ] Smoke test: prosty czat → poprawny ZIP do ściągnięcia
- [ ] Brak errorów w konsoli przeglądarki przy typowym flow

## 3. ZIP / Parser

- [ ] Strict Mode działa (FILE markers, last version wins)
- [ ] MissingFileDetector generuje raport braków
- [ ] `CHECKLIST_REPORT.md` jest generowany i trafia do ZIP
- [ ] ZIP modes działają (FULL / MINIMAL / SAFE / CUSTOM)
- [ ] Ścieżki plików w ZIP są spójne z tym, co pokazuje UI

## 4. Dokumentacja

- [ ] README.md w repo: opis działania, wymagania, komendy
- [ ] `docs/ROADMAP_PINPALL_BUILDER.md` – aktualny
- [ ] `docs/PROD_CHECKLIST_BUILDER.md` – aktualny
- [ ] Krótki opis dla użytkowników: „How to talk to Builder” (w UI + w docs)

## 5. Deploy

- [ ] Konfiguracja serwera (Node, reverse proxy, certyfikat HTTPS)
- [ ] Domeny: `builder.pinpall.com` wskazuje na serwer
- [ ] Healthcheck w monitoringu (np. UptimeRobot / Hetzner)
- [ ] Procedura restartu: opisana w `docs/DEPLOY_NOTES.md`
