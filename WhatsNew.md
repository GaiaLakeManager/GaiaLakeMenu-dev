# Gaia Lake Menu — What's New

## v2.0.5 — 1 Oct 2026
- **Per-item date.** When "Allow a different date/time for individual items" is on, every item shows its own "Please select date" picker (no longer optional) and the single order date is hidden. Items from "Any time" categories also get their own Breakfast / Lunch / Dinner choice. "For Breakfast / Lunch / Dinner" now sits beside the quantity, only for items from those categories. More space between the date picker and the date shown, and the Bed & Breakfast tick box lines up with its text.
- **"For Breakfast / Lunch / Dinner" shows beside the quantity**, only for items from those categories (nothing is shown for "Any time" items).
- **Group rule tightened:** a group order can have only ONE item for each Breakfast, Lunch or Dinner sitting (same date and meal). Quantity is unlimited, but a second dish, or a different option of the same dish, is refused with a message to call the manager. "Any time" categories (drinks, desserts) are not limited. Enforced on the server too (`Code.gs`).
- Order window: the optional-date wording is replaced by "Please select date", more space between the date picker and the date shown, and the Bed & Breakfast tick box lines up with its text. Needs the new `style.css`.
- Update `Code.gs` in Apps Script and deploy a New version.

## v2.0.4 — 30 Sep 2026
- **Each category can be fixed to a meal.** Admin → Add/Edit Category has a new "Served at" choice: Any time, Breakfast only, Lunch only or Dinner only. Items in a fixed category are always served at that meal's serving time, so a guest cannot order breakfast items for lunch or dinner (or the other way round). The guest picks only the date and sees e.g. "For Lunch" — no clock time. A special time (late lunch on arrival, early breakfast on check-out) goes in the order Note and staff confirm it. Existing "Included on Bed & Breakfast" categories count as Breakfast only until you save them otherwise. Enforced on the server (`Code.gs`) too.
- **Categories set to "Any time"** (drinks, desserts etc.): the guest picks a date and then Breakfast, Lunch, Dinner or a specific time. A specific time must be within Kitchen Opens – Latest dining time.
- **Group orders are strict.** When the guest picks a Group/bulk-order label, only ONE category can be ordered for each meal sitting (date + Breakfast/Lunch/Dinner), and "Specific time" is not offered. Anything different means calling the manager. (Tightened in v2.0.5.)
- **Rooms, villas, cottages.** Admin → Settings → "Rooms / Villas / Cottages": names are shown exactly as entered (up to 30 characters) in the order form, review, and kitchen alerts; the field's own name (Room, Villa, Cottage…) is set in the same panel. No "Room" wording is hard-coded any more.
- **New Admin settings (Settings → Accepting Orders):** Daily Breakfast, Lunch and Dinner serving times, a switch to ask guests for a dining date & time at all, and a switch for the optional different date/time per item (kept on for now).
- **Date and time fields are clear on phones and PCs.** They no longer show blank or "--/--/--": the date is pre-filled and a readable line under each field shows what was chosen (e.g. "Thu, 01 Oct 2026", "7:30 PM").
- Meal orders (For Breakfast / Lunch / Dinner) are never refused for the time of day, so a guest can still ask for a late lunch on arrival or an early breakfast before check-out by writing it in the Note (staff confirm). Only a *specific time* chosen on an "Any time" item that has already passed today is refused.
- Junior Guest Privileges now reads: 50% off main meal rates (Breakfast/Lunch/Dinner) for all children under 12 years.
- Fixed: ticking or unticking the Bed & Breakfast box could wipe the name and phone you had just typed.
- New optional `ENV_LABEL` line in `config.js`: set it (e.g. "DEV") on a development copy and a red badge appears on the guest and admin pages. Leave it empty on the live site.
- Update `Code.gs` in Apps Script and deploy a New version.

## v2.0.3 — 29 Sep 2026
- **Ordering hours.** Same-day orders now stop at a set cutoff (default 7:00 PM) — after that, the earliest dining date guests can pick is tomorrow. The dining time picker only allows Kitchen Opens through a new **Latest dining time** (default 9:00 PM), even though the kitchen itself may stay open later; anything outside that window is asked to go in the order Note instead. Admin → Settings → Accepting Orders has the two new fields (Same-day order cutoff, Latest dining time). Orders placed while the kitchen is closed are still accepted, but the guest sees a notice and the Telegram/email alert is marked "Received outside kitchen hours" so staff know it wasn't seen live. All of this is enforced on the server (`Code.gs`) too, not just the page.
- **Bed & Breakfast waiver.** When a guest's cart has at least one item from a category marked "Included on Bed & Breakfast" (new checkbox in Admin → Add/Edit Category), a checkbox appears: "On Bed & Breakfast — this breakfast is included in my room rate." If ticked, those items show as Included and are charged USD 0, with the real price still recorded for billing (`bbValue`) and the guest warned that an incorrect tick means the full price is billed. The alert to staff is flagged in bold to verify the room plan with the manager before billing. On "Amend this order", the tick carries over and has to be manually unchecked.
- **Group / Bulk-order labels.** New Admin → Settings panel, managed like Room Numbers, for labels such as "Group" or "Bungalow". These are added to the guest Room dropdown alongside real room numbers — no code change needed to add or rename one. The Room field is now dropdown-only (no typing). Selecting a group label shows the Group Selection Policy reminder on the order Review screen.
- **Ordering-paused banner.** When Accepting Orders is off, the guest menu no longer shows "Currently Closed" or the "Open to Order" hours line. Instead it shows a banner asking guests to message or email the item code, name and quantity for each item, with WhatsApp and Email buttons (using the same "For orders" settings as the order fallback screen).
- Fixed: the order confirmation screen said "call us on the number at the top of the menu" even when no phone number was set; it now shows the actual number as a tap-to-call link, or a generic "contact the reception" line if none is set.
- Fixed: pasting a hex colour code in Admin → Settings → Brand Colours had no effect (the box's old length limit blocked a paste). Pasting now works, and codes without a `#`, with stray spaces, or in 3-digit short form are also accepted.
- Fixed: guest ordering silently showed no "+ Add" buttons anywhere, because `orders.js` was reading its own empty copy of the menu instead of the one `index.html` had loaded.

## v2.0.2 — 28 Sep 2026
- **Orders are now in USD.** The order window, review screen, kitchen Telegram/email alerts and the saved order files all use USD prices; each saved order has `currency: "USD"`. Conversion to LKR is left for final billing. The guest menu still shows both prices.
- An item without a USD price cannot be added to an order (its "+ Add" button is hidden), and the script refuses it. Set the USD price in Admin to make it orderable.
- The fallback message (`#GLORDER`) shows the total in USD. Update `Code.gs` in Apps Script and deploy a New version.

## v2.0.1 — 28 Sep 2026
- "+ Add" now sits on its own line below the price (sub-option name and price stay on one line as before). Added items show "✓ Added (n)" and stay in sync with the order.
- Order window: the menu behind is blurred, "Close" is now "Go back" (keeps your selections) and a new "Cancel order" clears them and resets the menu buttons. Better spacing for date/time on phones, tablets and PCs; the total also shows the approximate USD amount when every item has a USD price. Orders are charged in LKR.
- Room number is now a dropdown. Manage the list in Admin → Settings → Room Numbers (falls back to typing if the list is empty).
- Admin → Settings → Brand Colours: type a hex code as well as using the colour picker.

## v2.0 — 28 Sep 2026 (guest ordering, part 1)
- **Guests can order.** Every dish (or each sub-option) has a "+ Add" button; a bar at the bottom shows the running total. The order window has quantity, dining date and time for the whole order (with an optional different date/time per item), room number, name and phone. A Review screen with Edit and Confirm & send follows.
- **Sending.** The order goes to a Google Apps Script web app (new file `Code.gs`), which re-checks every price against the live menu, validates room and phone, ignores bots (hidden trap field, rate limit), saves the order as a file in the private Orders folder, emails the orders address and sends a Telegram message.
- **If sending fails**, the guest gets buttons for WhatsApp, Email, SMS, Call and Copy text, with the order already written out, including a `#GLORDER` line for the Admin paste box (coming in the next drop).
- **Amend.** After sending, "Amend this order" creates a new order that points back to the earlier order number.
- Admin → Settings has a new **For orders** section (orders email and WhatsApp number).
- New files: `orders.js` (guest ordering code, loaded by index.html) and `Code.gs` (paste into Apps Script). config.js has two new lines: `ORDER_SCRIPT_URL` and `ORDERS_FOLDER_ID`.
- Not in this drop yet: Admin Orders tab (list, auto-refresh, Pending/Served/Billed/Paid) and the `#GLORDER` paste box.

## v1.7 — 28 Sep 2026
- **Backups no longer pile up.** The Backup folder now uses the same tiered system as the Inventory app: one backup for each day, week and month, holding the menu as it was before that period's first save. The newest 14 daily, 8 weekly and 12 monthly copies are kept and older ones are moved to Drive's Trash automatically. Files are named `menu-backup-daily-YYYY-MM-DD.json`, `menu-backup-weekly-YYYY-Www.json` and `menu-backup-monthly-YYYY-MM.json`. The Dashboard shows how many of each exist. The earlier per-save test files (`menu-backup-YYYY-MM-DD_hh-mm-ss.json`) are left alone and can be deleted by hand.
- **One version number for both pages.** The version in config.js and this file covers index.html and admin.html together. Admin now shows it in a footer at the bottom of the left menu, with the same developer and copyright line and colours as the guest page.
- Admin page names updated: "Gaia Lake - Kandalama", "Guest Food & Beverage Menu", "Admin Control Panel" on the sign-in screen, the sidebar and the browser tab.
- Added a dark/light mode button to the Admin top bar (remembered separately from the guest page).
- QR code page: the QR is now generated inside the page (no outside QR service). It has your logo in the centre, and the restaurant name, "Guest Food & Beverage Menu" and "Scan to view menu" below it; the downloaded PNG includes all of that. The code colour is a darker shade of the brand green because the pure brand green scanned poorly in testing.
- Guest menu dark/light button: on phones or PCs set to dark mode, the first tap could appear to do nothing. It now always follows what the page is actually showing.

## v1.7 — 28 Sep 2026
- Backups now follow the same system as the Inventory app instead of creating a new file on every save. There is one backup per day, one per week and one per month (for example `menu-backup-daily-2026-09-28.json`, `menu-backup-weekly-2026-W40.json`, `menu-backup-monthly-2026-09.json`).
- Each file holds the menu as it stood before that period's first save, and is never overwritten. If a backup for the period already exists (even one made from another device), nothing new is created.
- Only the newest 14 daily, 8 weekly and 12 monthly backups are kept. Older ones are moved to Drive's Trash automatically. The limits can be changed with BACKUP_KEEP in config.js.
- Dates use local time, so a save just after midnight goes into the correct day.
- Backup files from v1.6 (named with a date and time, one per save) are left alone; you can delete them by hand.

## v1.6 — 28 Sep 2026
- Fixed backups and deleted-photo handling failing silently. Before, if the Backup or Deleted Images folder could not be found or written to, nothing happened and no message appeared. Now every save says whether a backup was created, and any problem is shown in the message.
- Admin Dashboard now shows the status of the DishImages, Backup and Deleted Images folders (found, view-only, or not found) each time you sign in.
- A backup now keeps the menu as it was before the save (previously it copied the new version), so it can be used to go back a step. Backup files are named with your local date and time.
- New optional settings in config.js, BACKUP_FOLDER_ID and DELETED_IMAGES_FOLDER_ID, for folders that are not inside GuestView.

## v1.5 — 27 Sep 2026
- Every dish now has a permanent, sequential item code (#001, #002 …). Numbers come from a counter that only goes up, so a code is never reused, even after the dish is deleted. Existing dishes were numbered once in menu order (category order, then dish order) the first time the admin page loads after this update. Codes show on Admin dish cards, in the Add/Edit Dish window, and as a small tag on the guest menu photo.
- Dishes are now listed in category order (Breakfast … Soup) in both Admin (including the "All" view) and the guest menu. Category order is also cleaned up automatically so duplicate positions can no longer scramble it.
- Dish price on the top line now uses the same font and size as sub-option prices (this was visible on PC).
- Added "Rise & Shine Inclusions" (complimentary morning Ceylon tea or coffee and seasonal fresh fruits with breakfast orders) as the first bullet of the guest ordering policy note.

## v1.4 — 26 Sep 2026
- Fixed the dark/light toggle button, which stopped working after the v1.3 style.css split (the dark-mode colour override was targeting the wrong element once the base colours moved onto the page's `<body>`).
- Admin → Menu → Dishes now shows each dish's full description and, for dishes with sub-options, every sub-option's own price — nothing is hidden behind an "N options" count anymore.
- Added "Junior Guest Privileges" (50% off meal rates for children under 12) as the first bullet in the guest ordering policy note.

## v1.3 — 26 Sep 2026
- Version number and "What's New" note are now hardcoded in config.js and updated by the developer with each release — no more typing a version number into Admin → Settings each time. Settings now just shows the current version and note, read-only.
- Added a new logo.png reference on the Admin sign-in screen — replace the placeholder leaf icon with your actual logo by uploading a `logo.png` file alongside admin.html on GitHub Pages.
- Added dish "sub-options": a dish (e.g. "Hopper Night") can now have any number of named sub-items (e.g. Creamy Chicken Curry, Rich Prawn Curry, Traditional Black Pork Curry), each with its own price. When a dish has sub-options, its own top-level price is hidden and each sub-option's price is shown instead — both in Admin (Add/Edit Dish) and on the guest menu.
- Split all CSS out of index.html and admin.html into a shared style.css file, making both HTML files shorter and easier to work with. Both pages must now also load style.css from the same folder.

## v1.2 — 26 Sep 2026
- Removed the "Prices are shown for reference and may vary slightly at time of order." line from the guest page footer.
- Fixed the version number in the developer footer not updating — it's now written directly from the App Version field in Admin → Settings into its own element, instead of a text search-and-replace on the footer sentence, so it always matches what's saved there.
- Centered the logo and restaurant name on the banner on PC, tablet, and mobile (previously it only centered on narrow screens and drifted left on wider ones).
- Gave the logo/name a subtle frosted dark badge over the banner photo, so it stays readable regardless of the photo underneath.
- Added a "Guest Food & Beverage Menu" title centered just below the banner.
- Updated the restaurant display name to "Gaia Lake - Kandalama" (the fresh-install default; on the live site this is controlled by Admin → Profile → Restaurant Name).
- Added this WhatsNew.md file and a "What's New" panel in Admin → Settings, showing the latest version, date, and a short update note.
