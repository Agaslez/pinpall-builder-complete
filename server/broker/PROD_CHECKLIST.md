# PINpall Builder – PROD CHECKLIST

## 1. Core backend

- [ ] `server/index.ts` używa:
  - [ ] `applySecurity` (CORS, helmet, compression, rate limit)
  - [ ] `requestId` + `httpLogger`
  - [ ] `notFoundHandler` + `errorHandler`
- [ ] `config/env.ts` waliduje:
  - [ ] `NODE_ENV`
  - [ ] `PORT`
  - [ ] `CORS_ORIGIN`
  - [ ] `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- [ ] `/api/health` zwraca `{"status":"ok","env":"production"}` w PROD

## 2. Security

- [ ] CORS ograniczone do:
  - [ ] domeny produkcyjnej frontendu
  - [ ] ewentualnie panelu admina
- [ ] Helmet:
  - [ ] włączone CSP w produkcji
  - [ ] brak błędów w konsoli przeglądarki
- [ ] Rate limiting:
  - [ ] sensowne limity (np. 100 req / 15 min / IP)
  - [ ] logi przy przekroczeniu limitu (bez danych wrażliwych)
- [ ] Upload:
  - [ ] limit rozmiaru pliku (np. 5–10 MB)
  - [ ] walidacja rozszerzeń (TXT/MD)
  - [ ] odrzucanie nieobsługiwanych typów

## 3. Broker / adapter

- [ ] Folder `server/broker/`:
  - [ ] `types.ts` z `ProjectKind` i `NormalizedProjectSpec`
  - [ ] `registry.ts` z adapterami: `pinpall`, `talism`, `deepintel`, `generic`
  - [ ] `index.ts` z `buildProjectSpec`
- [ ] Endpointy:
  - [ ] `/api/parse-chat` przyjmują `projectKind` (nagłówek lub body)
  - [ ] `/api/import-chat` przyjmują `projectKind`
  - [ ] każdy projekt zapisuje `kind` w strukturze `project`
- [ ] W przyszłości:
  - [ ] PINpall adapter ma własne reguły (vault, sekcje, bezpieczeństwo)
  - [ ] Talism adapter – emocje, avatary, NFT
  - [ ] DeepIntel adapter – leady, scoring, pipeline

## 4. Observability

- [ ] Logi:
  - [ ] format JSON lub `combined`
  - [ ] zawierają `x-request-id`
  - [ ] **nie** zawierają treści czatów ani plików
- [ ] Monitoring:
  - [ ] metryka healthcheck (np. uptime checker)
  - [ ] alert jeśli `/api/health` nie działa

## 5. Build & deploy

- [ ] Build:
  - [ ] `npm run build` przechodzi bez błędów
  - [ ] statyczne pliki w `dist/public`
- [ ] Serwer:
  - [ ] w PROD uruchamiany przez proces managera (np. PM2/systemd)
  - [ ] restart przy craszu
- [ ] Konfiguracja:
  - [ ] `.env` produkcyjne trzymane poza repo
  - [ ] backup `.env` w bezpiecznym miejscu

## 6. API kontrakty

- [ ] Dokumentacja:
  - [ ] opisane endpointy:
    - [ ] `POST /api/parse-chat`
    - [ ] `POST /api/import-chat`
    - [ ] `GET /api/projects`
    - [ ] `GET /api/projects/:id`
    - [ ] `GET /api/projects/:id/download`
  - [ ] przykładowe request/response
- [ ] Błędy:
  - [ ] spójny format błędów: `{ error, message, requestId }`
  - [ ] statusy HTTP poprawne (400/404/429/500)
