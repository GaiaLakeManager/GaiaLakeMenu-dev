# Gaia Lake Menu System — Setup Guide

Five files: `config.js` (shared settings + app version), `style.css` (shared styles for
both pages), `admin.html` (your private dashboard), `index.html` (the public page
guests reach via QR code — named index.html so it serves directly at your GitHub
Pages root), and `WhatsNew.md` (version history, kept alongside the app and
updated with each release). Optionally add a `logo.png` file (your actual logo)
in the same folder — the Admin sign-in screen will use it automatically, falling
back to a placeholder leaf icon if it's missing. A separate, isolated Google
Cloud project — nothing shared with the Asset Inventory app.

---

## 1. Create the Google Cloud project

1. Go to https://console.cloud.google.com/projectcreate
2. Name it something like **Gaia Lake Menu** → Create.
3. Make sure this new project is selected (top-left dropdown) before continuing.

## 2. Enable the Google Drive API

1. https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Confirm the new project is selected → click **Enable**.

## 3. Create the OAuth Client ID (for admin.html sign-in)

1. https://console.cloud.google.com/apis/credentials/consent
   - User type: **External** (unless you have Google Workspace, then Internal is fine).
   - Fill in app name (e.g. "Gaia Lake Menu Admin"), your email as support/contact.
   - Scopes: you can skip adding any here — the app requests them directly.
   - Add yourself as a **test user** if the consent screen stays in "Testing" mode.
2. https://console.cloud.google.com/apis/credentials → **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: "Gaia Lake Menu Admin".
   - **Authorized JavaScript origins** — add every origin you'll open admin.html from:
     - `http://127.0.0.1:5500` (or whatever port your local Live Server uses)
     - `https://gaialakemanager.github.io` (once hosted — see step 6)
   - Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`).
   - Paste it into `config.js` as `GOOGLE_CLIENT_ID`.

## 4. Create the API Key (for the guest menu's read-only access)

1. Same Credentials page → **Create Credentials → API key**.
2. Click into the new key → **Restrict key**:
   - **API restrictions** → restrict to **Google Drive API** only.
   - **Application restrictions** → **Websites**, and add your GitHub Pages domain
     (`gaialakemanager.github.io/*`) once hosted. Leave unrestricted only while testing locally.
3. Copy the key into `config.js` as `GOOGLE_API_KEY`.

## 5. Confirm your Drive folder sharing

You've already set this up:
- **GuestView** folder — Anyone with the link: **Viewer**. `config.js`'s
  `GUEST_FOLDER_ID` is already filled in from your link.
- **DishImages** (inside GuestView) — inherits the Viewer sharing, so guests can
  see dish photos. Admin uploads here.
- **Backup** and **Deleted Images** — kept private (admin-only), exactly as you set up.

The admin app finds these three subfolders **by name** automatically, but only
**inside GuestView** — no need to hunt for their IDs. If a folder is renamed, update
the matching `_FOLDER_NAME` value in `config.js`.

If your **Backup** or **Deleted Images** folder sits somewhere else in Drive (for
example outside GuestView to keep it private), paste its folder ID into
`BACKUP_FOLDER_ID` / `DELETED_IMAGES_FOLDER_ID` in `config.js` (the ID is the long
code at the end of the folder's Drive URL). The signed-in admin account needs
**Editor** access to each folder. Note that a folder inside GuestView inherits the
"Anyone with the link" sharing, so it is not private.

After signing in to admin.html, the Dashboard shows whether each of the three
folders was found and is writable. The first save of each day, week and month says
"Backup created"; any backup problem is shown in the save message.

## 6. Test locally, then go live

**Local test (VS Code Live Server or similar):**
1. Put `config.js`, `style.css`, `admin.html`, `index.html` (and `WhatsNew.md`,
   `logo.png` if you have it) in one folder, open it in
   VS Code, right-click `admin.html` → "Open with Live Server."
2. Add that local origin (e.g. `http://127.0.0.1:5500`) to the OAuth Client's
   Authorized JavaScript origins (step 3) if it isn't already there.
3. Sign in, and on first run the admin app will create `gaia_lake_menu.json`
   inside GuestView and show you its **file ID** on the Dashboard.
4. Copy that ID into `MENU_FILE_ID` in `config.js` — **the same config.js both
   files load**, so one edit covers both apps.

**Go live (GitHub Pages, same as your other Gaia Lake apps):**
1. Push `config.js`, `style.css`, `admin.html`, `index.html`, `WhatsNew.md`, and
   (optionally) `logo.png` to a GitHub repo → Settings → Pages → enable for the
   `main` branch.
2. Add the resulting `https://gaialakemanager.github.io/GaiaLakeMenu` origin to the
   OAuth Client's Authorized JavaScript origins, and to the API key's website
   restriction.
3. Update `GUEST_MENU_URL` in `config.js` to the real
   the resulting root address, then open **Admin → QR Code** to generate
   and download the print-ready QR code.

## Opening the admin dashboard

Once hosted, `admin.html` isn't linked from anywhere on the guest menu (by
design — guests should never stumble onto it). Bookmark its direct URL:

```
https://gaialakemanager.github.io/GaiaLakeMenu/admin.html
```

(Your public guest menu is the same path without `admin.html` at the end.)

## 7. Add admin accounts

Edit `ADMIN_EMAILS` in `config.js`:
```js
ADMIN_EMAILS: ["you@gmail.com", "someone-else@gmail.com"],
```
Anyone not on this list who signs in will see an access-denied message —
they still need Google's own Editor permission on the file to actually write,
this list is just an extra in-app gate. Leaving it empty lets anyone with
Editor access sign in (fine for solo testing, add your email before going live).

## About the GitHub "secrets detected" email

If GitHub emails you saying it found a Google API Key in `config.js`, this is
expected and not a leak in the usual sense — that key is meant to be public in
a browser-only app like this one (see "No secrets are exposed" below). What
actually matters is that the key is **restricted** the way step 4 describes
(Drive API only, your GitHub Pages domain only) — an unrestricted key is what
would let a stranger rack up usage on your Google Cloud project.
To resolve GitHub's alert: open the repo's **Security → Secret scanning
alerts**, open the flagged alert, and mark it **"Used in tests"** or **"Revoke"**
depending on the option GitHub offers — either dismisses the warning once
you've confirmed the key is properly restricted. You do not need to remove
the key from `config.js` or hide the file.

## Notes

- **No secrets are exposed.** The API key and Client ID are meant to be public
  for a browser-only app like this — real access control is Google's sign-in
  plus your Drive folder permissions.
- **Backups**: automatic and tiered, like the Inventory app. The Backup folder gets
  one file per day, one per week and one per month, each holding the menu as it was
  before that period's first save. Only the newest 14 daily, 8 weekly and 12 monthly
  files are kept; older ones go to Drive's Trash. Change the limits with
  `BACKUP_KEEP` in `config.js`.
- **Deleted dish photos** move to "Deleted Images" instead of being permanently
  removed, so an accidental delete is recoverable from Drive directly.

## Guest ordering (v2.0) — one-time setup

Sign in to Google as the orders account (gaialakewebapps@gmail.com) for steps 1 to 4.

1. **Orders folder.** In Drive create a folder named `Orders` outside GuestView. Share it as Editor with each admin account. Copy its ID (the end of the folder URL) into `ORDERS_FOLDER_ID` in config.js.
2. **Menu access.** The script must be able to read the menu file. GuestView is shared "Anyone with the link", so this already works; otherwise share `gaia_lake_menu.json` with the orders account.
3. **Telegram bot.** In Telegram, message @BotFather, send `/newbot` and follow the prompts to get a bot token. Open your new bot and press Start, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and copy the number after `"chat":{"id":`. (Do not share the token.)
4. **Apps Script.** Go to script.google.com > New project, paste the contents of `Code.gs`. Project Settings > Script Properties, add: `MENU_FILE_ID` (same as config.js), `ORDERS_FOLDER_ID`, `ORDER_EMAIL`, `TELEGRAM_TOKEN`, `TELEGRAM_CHAT`. Then Deploy > New deployment > Web app > Execute as **Me**, access **Anyone**, and approve the permissions (Drive, Mail, external requests). Copy the web app URL (ending in `/exec`).
5. Paste that URL into `ORDER_SCRIPT_URL` in config.js and upload `config.js`, `index.html`, `orders.js`, `style.css` and `admin.html` to GitHub.
6. Admin → Settings → **For orders**: the orders email is optional (guests see priyagaialake@gmail.com from config.js unless you enter another); enter the WhatsApp number if it differs from the bungalow phone, then Save.
7. Test with a real order from a phone. When you later change `Code.gs`, use Deploy > Manage deployments > Edit > New version so the URL stays the same.

Ordering buttons appear only when `ORDER_SCRIPT_URL` is filled in and Accepting Orders is on.
