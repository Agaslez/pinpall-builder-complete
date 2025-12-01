# PINpall Builder + Adapter – ROADMAP v1

## Legenda
- Priorytet: 🔴 wysoki, 🟠 średni, 🟢 niski
- Status: TODO / IN PROGRESS / DONE

| Faza | Obszar         | Zadanie                                                                 | Priorytet | Status |
|------|----------------|-------------------------------------------------------------------------|-----------|--------|
| 1    | Infra/Repo     | Repo na GitHub z czystym main, .gitignore, .env.example                 | 🔴        | DONE   |
| 1    | Builder/Core   | Działający lokalnie serwer + frontend (npm run build + npx tsx server) | 🔴        | DONE   |
| 1    | Builder/Bezp.  | Usunięcie wszystkich kluczy z repo, rotacja Stripe                      | 🔴        | DONE   |
| 2    | Builder/Bezp.  | Walidacja wejścia (Zod) dla /api/import-chat, /api/parse-chat           | 🔴        | TODO   |
| 2    | Builder/Bezp.  | Blokada SSRF (allowlista domen, brak lokalnych IP, timeout, limit roz.) | 🔴        | TODO   |
| 2    | Builder/Bezp.  | Limit uploadu + obsługa błędów (413 + komunikat na UI)                  | 🔴        | TODO   |
| 2    | Builder/Bezp.  | CORS whitelist (localhost + docelowa domena)                            | 🔴        | TODO   |
| 2    | Builder/Bezp.  | Prost y rate limiting (np. 30 req/min/IP)                               | 🟠        | TODO   |
| 3    | Builder/Parser | Strict Mode: FILE-markery + „last version wins”                         | 🔴        | TODO   |
| 3    | Builder/Parser | MissingFileDetector + analiza importów (brakujące pliki)                | 🔴        | TODO   |
| 3    | Builder/Parser | Lepsze orphan blocks (próba dopinania do istniejących plików)           | 🟠        | TODO   |
| 4    | Builder/Checklist | `shared/checklist.ts` – definicja Production Checklist               | 🔴        | TODO   |
| 4    | Builder/Checklist | `server/checklist.ts` – uruchamianie checklisty po parsingu          | 🔴        | TODO   |
| 4    | Builder/Checklist | GENERACJA `CHECKLIST_REPORT.md` w ZIP                                | 🔴        | TODO   |
| 4    | Builder/UI     | Strona „How to talk with Builder / PINpall Protocol v1”                 | 🟠        | TODO   |
| 4    | Builder/UI     | Wyświetlanie wyników checklisty w UI + gotowe prompty do czatu          | 🟠        | TODO   |
| 5    | Builder/ZIP    | ZIP modes: FULL / MINIMAL / SAFE / CUSTOM                              | 🟠        | TODO   |
| 5    | Builder/ZIP    | Preflight check przed ZIP (brakujące pliki, ostrzeżenia)                | 🟠        | TODO   |
| 5    | Tests          | Smoke test backendu (health, parse, zip)                                | 🔴        | TODO   |
| 5    | Tests          | Unit testy parsera (FILE, sekcje, imports)                              | 🔴        | TODO   |
| 5    | Tests          | Test ZIP buildera (struktura, nazwy plików)                             | 🟠        | TODO   |
| 6    | Adapter/Core   | Nowe repo `pinpall-adapter-core`                                       | 🔴        | TODO   |
| 6    | Adapter/Core   | Endpoint `/v1/completion` (provider, model, messages)                   | 🔴        | TODO   |
| 6    | Adapter/Core   | Provider Fireworks (Llama 3.3 70B), czytający klucz z .env              | 🔴        | TODO   |
| 6    | Adapter/Core   | Provider DeepSeek                                                        | 🟠        | TODO   |
| 7    | Adapter/Bezp.  | Policy layer (limity per project, allowed models)                       | 🟠        | TODO   |
| 7    | Adapter/Bezp.  | Audit log (kto, model, projekt, timestamp – bez raw promptów)           | 🟠        | TODO   |
| 7    | Adapter/Builder| Integracja Builder → Adapter (/v1/analyze-project / /v1/completion)     | 🔴        | TODO   |
| 8    | Deploy         | Pierwszy deploy na VPS (builder.pinpall.com)                            | 🔴        | TODO   |
| 8    | Deploy         | Prost y monitoring (health check, logi, restart pm2/systemd)            | 🟠        | TODO   |
| 8    | Biznes         | README z ofertą, licencją i planem cenowym                              | 🟢        | TODO   |
