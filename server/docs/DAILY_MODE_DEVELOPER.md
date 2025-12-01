PINpall – DAILY MODE™ (DEVELOPER)

Standard pracy dla każdego dewelopera dołączającego do projektu.

🟩 0. START DNIA – RESET

Zamknij wszystkie zbędne aplikacje / karty.

W folderze projektu wykonaj:

git pull


Otwórz w VS Code pliki:

docs/ROADMAP_PINPALL_BUILDER.md

docs/DAILY_MODE_DEVELOPER.md

🟦 1. WYBÓR ZADANIA (1 task / 1 blok)

Każdy dev wybiera jedno zadanie dziennie.

Z roadmapy wybierz task oznaczony:
NEXT, HIGH PRIORITY, lub przypisany do Ciebie.

Dopisz:

## TODAY FOCUS – <imię>
- [ ] <wybrane zadanie>

🟧 2. BLOK PRACY (25–50 minut)

Uruchom backend:

npm run build
npx tsx server/index.ts


Uruchom frontend:

http://127.0.0.1:3000


Prowadź notatki:

### ACTIVE WORK – <imię>
- wykonuję:
- zauważone problemy:
- zmiany w kodzie:


Zasada: jeden blok = jeden task.

🟨 3. SMOKE TESTY

Po ukończeniu zadania:

Backend:
curl http://127.0.0.1:3000/api/health

ZIP Builder:

test generacji,

test struktury projektu,

test zapisanych plików.

Jeśli działa — task = DONE.

🟪 4. KOMIT + PUSH
git add .
git commit -m "Dev: <opis zadania>"
git push

🟥 5. KONIEC DNIA – RAPORT

Deweloper dopisuje:

### DONE TODAY – <imię>
- ukończone:
- napotkane problemy:
- potrzebne decyzje:
- propozycje usprawnień:

📌 ZASADY STAŁE DLA DEVÓW

Nie ruszamy folderu dist/.

Nie commitujemy .env.

Nie dopisujemy funkcjonalności bez wpisu do roadmapy.

Każda nowa funkcja musi mieć:

walidację,

log,

test smoke.

Każdy Pull Request musi mieć opis + checklistę gotowości produkcyjnej.