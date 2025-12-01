# GIT FLOW – PINpall Builder

## Codzienna praca (solo dev)

1. Upewnij się, że jesteś na main:
   - `git status`
   - `git switch main` (jeśli trzeba)
   - `git pull`

2. Jeśli robisz większą zmianę:
   - `git switch -c feature/nazwa-zmiany`

3. Po pracy:
   - `git status` (sprawdź co zmieniłeś)
   - `git add .`
   - `git commit -m "Krótki opis zmiany"`
   - `git push` (na main albo na branch feature)

4. Po ważnej zmianie:
   - Update w `docs/ROADMAP_PINPALL_BUILDER.md` (Status → DONE)
   - Jak zbliżamy się do deploy:
     - przejście po `PROD_CHECKLIST_BUILDER.md`

## Release / Deploy

1. Upewnij się, że wszystkie TODO na daną wersję w ROADMAP są DONE.
2. Przejdź pełną Production Checklist.
3. Zrób tag (opcjonalnie):
   - `git tag v0.1.0`
   - `git push --tags`
4. Na serwerze:
   - `git pull`
   - `npm install`
   - `npm run build`
   - restart procesu (`pm2 restart` / `systemctl restart` itd.)
