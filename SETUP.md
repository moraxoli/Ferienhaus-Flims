# Ferienhaus-App – Setup-Anleitung

## 1. Datenbank einrichten (Neon PostgreSQL – kostenlos)

1. Erstelle ein kostenloses Konto auf [neon.tech](https://neon.tech)
2. Erstelle ein neues Projekt: "ferienhaus"
3. Kopiere den Connection String (Format: `postgresql://...@...neon.tech/ferienhaus`)

## 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Bearbeite `.env` und fülle aus:
- `DATABASE_URL` → Neon Connection String
- `NEXTAUTH_SECRET` → Zufälliges Secret (generiere mit `openssl rand -base64 32`)
- `NEXTAUTH_URL` → Nach Deployment: Vercel-URL (lokal: `http://localhost:3000`)
- `RESEND_API_KEY` → API-Key von [resend.com](https://resend.com) (kostenlos bis 3.000 E-Mails/Monat)
- `EMAIL_*` → E-Mail-Adressen der Familien

## 3. Datenbank-Schema anlegen

```bash
npx prisma db push
```

## 4. Demo-Accounts anlegen

```bash
npx prisma db seed
```

Dieser Befehl erstellt drei Accounts:
| Account | E-Mail | Passwort |
|---|---|---|
| Administrator | admin@ferienhaus.de | admin123 |
| Familie Müller | familie1@ferienhaus.de | familie1 |
| Familie Schmidt | familie2@ferienhaus.de | familie2 |

**Ändere die Passwörter** nach dem ersten Login (direkt in der Datenbank oder über einen Admin-Bereich).

## 5. Lokal starten

```bash
npm run dev
```

App läuft auf http://localhost:3000

## 6. Deployment auf Vercel

1. Pushe das Projekt auf GitHub
2. Importiere auf [vercel.com](https://vercel.com)
3. Setze alle Umgebungsvariablen im Vercel-Dashboard (Settings → Environment Variables)
4. Bei `NEXTAUTH_URL`: Setze die fertige Vercel-URL (z.B. `https://ferienhaus.vercel.app`)

---

## Accounts und Passwörter ändern

Die Passwörter können über die Datenbank (Neon Dashboard) geändert werden.
Verbinde dich mit deiner Neon DB und führe aus:

```sql
-- Passwort-Hash erstellen: in Node.js mit bcrypt.hash("neuesPasswort", 12)
UPDATE "User" SET password = '<bcrypt-hash>' WHERE email = 'admin@ferienhaus.de';
```

Alternativ erstelle eine Admin-Seite zum Passwort-Ändern (auf Anfrage erweiterbar).

---

## Funktionen im Überblick

### Wintersaison (Dezember – April)
- **Admin** weist Aufenthalte über `/admin/zuweisung` zu
- Die Reinigung wird automatisch für den **ersten Montag** nach dem Aufenthalt geplant
- Jede Familie kann ihren Aufenthalt unter `/buchungen` **freigeben**

### Sommersaison (Mai – November)
- Familien stellen Anfragen unter `/anfragen`
- Die andere Familie muss **mindestens eine Genehmigung** geben
- Bei Genehmigung wird die Reinigung automatisch geplant
- Manuelle Reinigungsbestellung unter `/reinigung` möglich

### Chat
- Alle drei Accounts können unter `/chat` kommunizieren
- Neue Nachrichten lösen In-App-Benachrichtigungen aus

### Benachrichtigungen
- In-App: `/benachrichtigungen` mit ungelesener-Zähler in der Sidebar
- E-Mail: Via Resend bei wichtigen Ereignissen
