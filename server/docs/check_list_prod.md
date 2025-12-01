0. ZASADY OGÓLNE (bezpieczeństwo & brak vaulta)

 Builder NIE jest password managerem:

 nigdzie w kodzie ani storage nie zapisujemy:

PIN-ów,

haseł,

seed phrase,

kluczy API.

 Specyfikacje projektów (PINpall/Talism/DeepIntel) opisują strukturę, pliki, moduły, a nie konkretne sekrety.

 W dokumentacji jest jasno napisane:

 “PINpall Builder nie służy do przechowywania haseł. Do tego używaj Bitwarden/1Password/Passbolt itd.”

 Logi nie zawierają treści czatów ani danych wrażliwych – tylko metadane.

1. Backend CORE (server/index + routes)

 Entry point serwera (server/index.ts):

 inicjalizuje Express,

 ustawia parsowanie JSON / urlencoded z limitami rozmiaru,

 podłącza security middleware (CORS, helmet, rate limit, compression),

 rejestruje registerRoutes(app),

 ma /api/health z prostą odpowiedzią.

 registerRoutes(app):

 wszystkie endpointy opisane niżej działają,

 błędy nie zatrzymują serwera (żadne throw bez try/catch).

(To mamy w większości, tylko security middleware jeszcze dopełnimy – to jest kolejny krok)

2. ENDPOINTY API
2.1 /api/parse-chat (upload TXT/MD)

 Przyjmuje multipart/form-data z polem chatFile.

 Maksymalny rozmiar pliku: 50 MB (jest w multer).

 W przypadku braku pliku:

 HTTP 400, { error: "No file uploaded" }.

 Poprawnie:

 czyta plik do UTF-8,

 przepuszcza przez ChatParser,

 tworzy projectId (UUID),

 tworzy entry w storage.createParseProject,

 zapisuje wszystkie pliki (createParsedFile),

 zapisuje unrecognized (createUnrecognizedElement),

 zwraca:

{
  "projectId": "...",
  "projectKind": "pinpall|talism|deepintel|generic",
  "projectName": "[kind] nazwa",
  "filesFound": 12,
  "unrecognizedCount": 3
}


 Odczyt projectKind:

 nagłówek x-project-kind lub req.body.projectKind,

 jeśli brak – domyślnie generic.

2.2 /api/import-chat (URL / JSON)

 Walidacja requestu przez importChatSchema (Zod).

 Obsługuje:

 url (https, po assertSafeUrl),

 json (string lub obiekt).

 Zabezpieczenia:

 assertSafeUrl:

tylko https://,

allowlista hostów (jak masz).

 Przepływ:

 pobranie / parsowanie czatu (ChatImporter),

 przepuszczenie przez ChatParser,

 tworzenie projektu / plików / unrecognized – identycznie jak parse-chat,

 odczyt projectKind tak jak wyżej,

 użycie buildProjectSpec (broker),

 odpowiedź JSON jak wyżej.

2.3 /api/projects

 Zwraca listę projektów z storage.getAllParseProjects().

 W przypadku błędu: 500 + error.

2.4 /api/projects/:id

 Zwraca pojedynczy projekt z storage.getParseProject(id).

 Gdy brak: 404 + { error: "Project not found" }.

2.5 /api/unrecognized/:id (update)

 Przyjmuje JSON { resolved, suggestedType }.

 Aktualizuje element storage.updateUnrecognizedElement.

 Zwraca { success: true } lub 500 z opisem błędu.

2.6 /api/projects/:id/download

 Pobiera pełny projekt storage.getFullProject.

 Gdy brak: 404.

 Tworzy ZIP:

 pliki file.fileType === "file" i content.trim() → zip.file,

 foldery fileType === "folder" → zip.folder,

 UNRECOGNIZED_ELEMENTS.md z listą unrecognized.

 Ustawia nagłówki:

Content-Type: application/zip,

Content-Disposition: attachment; filename="nazwa.zip".

2.7 /api/checkout

 Walidacja body (checkoutSchema).

 Gdy brak STRIPE_SECRET_KEY:

501 + Stripe not configured on server.

 Gdy OK:

createCheckoutSession(tier, email) → session.url.

Zwraca { url: "..." }.

3. BROKER / ADAPTER (to co właśnie dłubiemy)
3.1 Hook (v1 – struktura)

 ProjectKind (pinpall | talism | deepintel | generic) – wprowadzone.

 resolveProjectKind(req) – nagłówek / body / domyślnie generic.

 ChatInput – struktura wejścia (rawText + source).

 buildProjectSpec(kind, input) – prosty adapter (passthrough).

 /api/parse-chat wykorzystuje buildProjectSpec.

 /api/import-chat wykorzystuje buildProjectSpec.

 Odpowiedź JSON zawiera:

projectKind,

projectName z prefiksem [kind].

3.2 Logika projektowa (v2 – do zrobienia)

 PINpall adapter:

 opisuje strukturę: vault UI, PINnode, offline PWA/Electron, adapter API.

 nie przenosi realnych PIN-ów – tylko “slots”, “fields”.

 Talism adapter:

 sekcje: avatar, emotion engine, NFT, integracje.

 DeepIntel adapter:

 sekcje: źródła danych, scraper, scoring, dashboard, alerty.

 Możliwość eksportu tych speców (np. /api/projects/:id/spec).

4. BEZPIECZEŃSTWO / SECURITY

(część mamy, część do dopięcia – to jest kolejny krok po brokerze v1)

 CORS:

 allowlist na frontend (dev: http://127.0.0.1:3000, prod: domena appki),

 inne originy → 403 / blokada.

 Helmet:

 włączone security headers,

 w PROD włączone CSP (bez rozwalania frontu).

 Rate limiting:

 np. 100 req / 15 min / IP na /api,

 sensowny komunikat przy 429.

 Body size limit:

 JSON / urlencoded limit np. 2mb (poza uploadami).

 SSRF:

 assertSafeUrl z HTTPS + allowlista.

 Brak sekretów w kodzie:

 klucze Stripe, API, inne tylko przez .env.

5. STORAGE & DATA LIFECYCLE

 Storage:

 ma schemę na projekty, pliki, unrecognized,

 nie trzyma wrażliwych danych (PIN, hasła).

 Strategia retencji:

 czy projekty mają TTL / manualne kasowanie?

 dokumentujemy, jak usuwać “wszystko”.

 Eksport ZIP:

 użytkownik ma jasność, co dostaje (kod, README z unrecognized).

6. OBSERVABILITY (logi / monitoring)

 Logi serwera:

 logują błędy z minimalnym kontekstem (endpoint, status),

 nie logują treści czatów ani plików.

 Dla krytycznych błędów:

 stack trace na serwerze,

 sensowny status dla klienta (5xx).

 Healthcheck /api/health:

 używany przez zewnętrzny ping (uptime monitor).

7. BUILD & DEPLOY

 npm run build przechodzi bez błędów.

 W PROD:

 serwer uruchamiany przez PM2/systemd/Docker,

 restart przy craszu.

 Konfiguracja:

 .env produkcyjne poza repo, w bezpiecznym miejscu,

 .env.example z listą wymaganych zmiennych.

8. DOKUMENTACJA (pod usera i pod Ciebie)

 README.md:

 jak uruchomić lokalnie (npm install, build, start),

 lista endpointów,

 info o x-project-kind / projectKind.

 PROD_CHECKLIST.md:

 ta lista, z dopiskami [DONE]/[TODO].

 DAILY_MODE.md:

 Twój tryb pracy: start dnia, branch, co testować, w jakiej kolejności.

3. Co proponuję TERAZ (bez chodzenia na skróty)

Zamykamy broker v1
– to co już masz w routes.ts z ProjectKind i buildProjectSpec.
Jeśli chcesz, mogę jeszcze raz wysłać CAŁY plik z minimalnymi poprawkami przy tych liniach, które wkleiłeś (góra/dół).

Tworzymy realny PROD_CHECKLIST.md
– możesz wkleić checklistę powyżej 1:1, a ja w kolejnym kroku:

dopiszę [DONE]/[TODO] na podstawie tego, co już jest w repo (na tyle, na ile wiemy),

ułożę kolejność zadań pod Ciebie (co robić w jakim dniu/sprincie).

Dopiero potem:

adapter PINpall v2 = brak sekretów, tylko struktura,

security middleware (CORS/helmet/rate limit) w server/index.ts,

dokumentacja.