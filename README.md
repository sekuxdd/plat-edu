# EduPlatforma

Platforma edukacyjna z publiczną stroną główną, logowaniem, panelem nauczyciela i panelem ucznia.

## Funkcje

- Publiczna strona główna z opisem platformy.
- Logowanie przez backend API z sesją w HttpOnly cookie.
- Panel nauczyciela do zarządzania rozdziałami, tematami, materiałami i testami.
- Panel ucznia do nauki i rozwiązywania testów.
- Prisma + SQL Server jako warstwa danych.

## Uruchomienie lokalne

Wymagane są zmienne środowiskowe `DATABASE_URL` i `SESSION_SECRET`.

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Azure App Service

Najprostszy wariant wdrożenia:

1. Utwórz Azure SQL Database.
2. Ustaw `DATABASE_URL` na connection string SQL Server.
3. Ustaw `SESSION_SECRET`.
4. Na App Service wybierz Node.js 20 LTS.
5. Ustaw startup command na `npm run azure:start`.

Przykładowy connection string:

```text
sqlserver://twoj-serwer.database.windows.net:1433;database=EduPlatforma;user=twoj-user;password=twoje-haslo;encrypt=true;trustServerCertificate=false
```

Po pierwszym wdrożeniu warto uruchomić seed danych demo przez `npm run db:seed`.

## Szybkie uruchomienie na Windows

```bash
npm run launch
```

Skrypt przygotowuje bazę, buduje aplikację i uruchamia serwer pod adresem sieciowym.

## Dane demo

- Nauczyciel: `nauczyciel@demo.pl` / `teacher123`
- Uczeń: `uczen@demo.pl` / `student123`

## API

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/overview`
- `GET|POST /api/chapters`
- `PUT|DELETE /api/chapters/[id]`
- `GET|POST /api/topics`
- `PUT|DELETE /api/topics/[id]`
- `GET|POST /api/materials`
- `PUT|DELETE /api/materials/[id]`
- `GET|POST /api/tests`
- `PUT|DELETE /api/tests/[id]`

## Strony

- `/` - strona główna
- `/login` - logowanie
- `/teacher` - panel nauczyciela
- `/student` - panel ucznia
