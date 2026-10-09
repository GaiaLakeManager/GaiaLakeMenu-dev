# Gaia Lake Menu — What's New

## v3.0.13 — 9 Oct 2026
- **Admin → Orders tab.** Lists the orders from the private Orders folder, newest first, and refreshes by itself (every 30 seconds while the tab is open, every minute otherwise). A red number on the **Orders** menu item shows how many are still Pending, and a short message appears when a new order arrives. Each order shows the guest, room, phone, items with dish number, option, dining date and meal, the total, the guest's note, and warnings (marked BB, price differed, received outside kitchen hours). Verified-login orders show the booking basis and the plan-included value that was waived.
- **Status.** Each order has Pending, Served, Billed and Paid buttons. The change and who made it are saved with the order. Filter by status, or search by name, room, order number, dish or note. "Load older orders" shows earlier ones.
- **Amended orders** show "Amends GL-…" and the original shows "Later amended by GL-…".
- **#GLORDER paste box.** When a guest sends an order by WhatsApp, email or SMS, paste the whole message into the box, press Read order, check the items and prices (always taken from the live menu), then Save this order. It is added to the list as Pending. An order already received is refused, so nothing is entered twice. Saving here does not send a Telegram or email alert.
- Only `admin.html` and the new `adminorders.js` change; `Code.gs` is unchanged (`admin.html`, `adminorders.js`).

## v3.0.12 — 9 Oct 2026
- **Group members can browse; one device orders.** After a group's first order, the group code still logs in on other phones, but those phones are view-only: the **+ Add** buttons and the order bar are hidden, and a notice under the header says "Group orders are submitted through one primary device. Feel free to browse here and pass your choices to your group leader." The server still refuses any order from another device. A phone that already had items in its cart is told the same thing when it taps Review order, and the page reloads view-only (`Code.gs`, `login.js`, `orders.js`, `index.html`).
- The refusal message now says "contact Gaia Lake staff" instead of "reception".
- Upload `Code.gs` to Apps Script and deploy a **New version**.

## v3.0.11 — 9 Oct 2026
- **Group bookings: one device places the order.** When a group guest sends the first order, that phone or browser is locked to the group code. Anyone trying the same code on another device sees "This group code is already in use on another device…" (at login and when ordering). Individual guests are not affected. The lock is shown on the guest's card in Admin → Guest Codes ("device locked"); **Clear device lock** frees it (for example if the leader changes phone), and **New code** also clears it. The lock is written to the history as "device locked" (`Code.gs`, `orders.js`).
- **Group message.** Group guests see "Displaying your ordering for the whole group — group selection policy applies." at the top of the order and review screens (`orders.js`).
- Upload `Code.gs` to Apps Script and deploy a **New version**.

## v3.0.10 — 4 Oct 2026
- **Link preview picture.** The menu page now carries preview tags (title, description and the picture `welcome.jpg`), so when the menu link is shared on WhatsApp it shows the picture and title. The picture address is a full URL in `index.html` (the `og:image` line): the DEV file points to the dev repo, so change that one line to the live repo's address when launching (`index.html`).

## v3.0.9 — 4 Oct 2026
- **Stronger login protection.** Any 3 wrong logins from the same phone or browser (whatever codes were tried) pause login for 10 minutes; 3 more wrong ones stop login for that browser for several hours with a "contact management" message. A code that gets 3 + 3 wrong tries is locked until a new code is issued. If many wrong logins arrive across all guests, login pauses for everyone for 10 minutes (`Code.gs`, `login.js`).
- **Past meal times.** Once today's Breakfast, Lunch or Dinner time has passed, that meal can no longer be ordered for today; the date picker starts from tomorrow and the server enforces it too (`orders.js`, `Code.gs`).
- **Clearer date message.** Picking a date outside the stay now shows "Oops! That date is beyond your stay. Please select a date within your stay (Check-out: …)" and leaves the date blank instead of changing it.
- **Photo beside the item name.** The dish photo now sits at the top right of each order line, so the date selector keeps its full width.
- **Guest list backups** now go into a "Backup" sub-folder of the GuestLog folder, named `guestlogin-backup-daily-YYYY-MM-DD.json` (7 kept) and `guestlogin-backup-weekly-W##.json` (4 kept). A "Back up now" button was added to Admin → Guest Codes.
- **WhatsApp welcome image.** Admin → Profile has a new "WhatsApp welcome image link" field; if filled, the link is added to the first line of the guest login WhatsApp message (`admin.html`, `guestcodes.js`).
- Copyright notice added at the top of `index.html` and `admin.html` (hidden comment).

## v3.0.8 — 4 Oct 2026
- **Welcome before check-in.** A logged-in guest whose check-in date is still ahead no longer sees "Open to Order …" or the Open/Closed badge; they see "Welcome! Please pre-order your meals below". After check-in the opening-hours line shows as before.
- **Notices are easier to see.** The "date set to the nearest available date" and "selections restored" messages are now bright yellow with dark text, readable in dark and light mode.
- **Login screen.** The reception phone number in "Need help?" is now bold and readable in dark mode.
- **Guest list backups.** `guestlogin.json` is backed up automatically before the first change each day and each week, into the same private GuestLog folder: the newest 7 daily and 4 weekly copies are kept, older ones go to Drive's Trash (`guestcodes.js`).

## v3.0.7 — 4 Oct 2026
- **No more accidental refresh.** Swiping down at the top of the page on a phone (Chrome's pull-to-refresh) no longer reloads the menu or the order screen.
- **Your order is kept if the page reloads.** Items, quantities, options, dates, meals and the note are saved on the phone as you go and restored automatically (a short "selections restored" message appears). Items no longer on the menu, and dates that are no longer allowed, are dropped. The saved order is cleared when the order is sent or cancelled, and after 12 hours. Each guest's order is stored separately (`orders.js`).

## v3.0.6 — 4 Oct 2026
- **Photo on each order line.** Each item on "Your order" now shows a small photo at the bottom right, next to the date selector (items without a photo show a plate icon). **Tap the photo to see it full size** with the item number and name, then tap anywhere to close, so guests can see the dish clearly before ordering. The line does not get taller (`orders.js`).

## v3.0.5 — 4 Oct 2026
- **Room Only fix.** The "Confirm and send" screen and the fallback message no longer say "breakfast included" for Room Only guests. They now show the right line for each plan (BB, HB, FB), and nothing for RO. Prices were already correct.
- **Date pickers behave the same on phone and PC.** If a phone lets the guest scroll to a date outside the allowed range (before check-in, after check-out, or already closed), the date now snaps to the nearest allowed date with a short note, instead of showing an error (`orders.js`, `Code.gs`).

## v3.0.4 — 3 Oct 2026
- **Delete guests.** Every guest card in Admin → Guest Codes has a Delete button (asks for confirmation; extra warning if the guest is still active). A new "Delete all expired / revoked" button clears old records in one go, so the guest file stays small and loads fast. Active guests are never touched by the bulk delete (`guestcodes.js`).

## v3.0.3 — 3 Oct 2026
- **Review order opens at once.** The quiet login re-check now runs in the background (the server still re-checks every order when it is sent).
- **Guest Note.** The guest's note is labelled "Guest Note" in the Telegram and email order messages so staff don't confuse it with other notes.
- **Check-out day.** Guests can pre-order breakfast, lunch and dinner for their check-out day, and the date is not restricted. Only on the check-out day itself are those categories hidden (too late to prepare).
- **Before check-in.** The "Same-day orders are closed for today" notice no longer shows to guests whose check-in date is still ahead; they just see the check-in date rule. After check-in it shows as before.
- **Room Only (RO)** added as a booking basis: the full menu is shown and orderable, nothing is included or hidden.
- **Guest Codes list** now shows the newest guest first. The "Set meals for this guest" section now lists the plan's meal categories correctly (`guestcodes.js`, `orders.js`, `login.js`, `Code.gs`).

## v3.0.2 — 3 Oct 2026
- **Meal plan & ordering (login mode).** Categories included in the guest's plan (BB = breakfast, HB = breakfast + dinner, FB = breakfast, lunch + dinner, matched by each category's "Served at" setting) show an "Included in your plan" tag and are free on the order. Any-time categories are never plan-included. The Bed & Breakfast tick box is hidden.
- **Set menus.** In Admin → Guest Codes → Edit, tick "Fixed — no selection" for any plan category: that category is hidden from the guest and replaced by the message for their plan.
- **Check-out day.** Breakfast, Lunch and Dinner categories are hidden on the check-out day and cannot be ordered for it; drinks, snacks and other categories remain orderable until the 9:00 AM cut-off.
- **Order dates** are limited to check-in → check-out (tomorrow instead of today after the same-day cut-off).
- **Details locked.** Name, phone and room / group name come from the verified booking and cannot be edited. The page re-checks the login quietly before each order.
- **Checked by the server.** Apps Script re-reads the guest's record on every order and applies the name, phone, room/group, plan, dates and set-menu rules itself, regardless of what the browser sends (`Code.gs`, `orders.js`, `login.js`, `index.html`, `guestcodes.js`).

## v3.0.1 — 3 Oct 2026
- **Admin → Guest Codes tab.** Add a guest (name, phone with country code, check-in and check-out dates, BB/HB/FB, individual room or group name) and a unique 6-character code is generated and saved to the private guest file. Each guest card has: Copy message and WhatsApp (ready-to-send login text), Edit, New code (the old code stops at once and the change is kept in History), Revoke / Reactivate, Clear device lock, and History. Search by name, phone, code or room.
- **"Require guest login" switch** at the top of the tab turns login on or off for the whole app, with no redeploy. In `config.js`, `GUEST_LOGIN_FORCE` is now `false` and the new `GUESTLOGIN_FILE_ID` line must hold the guest file's ID (new `guestcodes.js`, `admin.html`).

## v3.0.0 — 3 Oct 2026
- **Guest login (part 1).** When login is required, guests first see a login screen: Guest Name, Phone Number (with country code) and a 6-character code from reception. Name, phone and code must all belong to the same booking; any mismatch shows one generic message. Codes work until 9:00 AM on the check-out date. After 3 wrong tries a code pauses for 15 minutes, then allows 3 more, then asks the guest to contact management; a global limit pauses everyone for a few minutes if many wrong codes are tried. The guest stays signed in on the device and is quietly re-checked each visit. Guest records are kept in a private file read only by the Apps Script (new `login.js`, `Code.gs`).
- Not in this part yet: Admin Guest Codes tab, meal-plan tags, group device lock, check-in/checkout date limits on orders.

## v2.0.11 — 2 Oct 2026
- **Faster, safer sending.** v2.0.9 made guests wait too long (up to about two minutes) before an error. Sending now waits at most about 12 seconds per try, twice at most. If the server's reply never reaches the guest's phone (the order can still arrive in Telegram and email), the page sends the same order once more without waiting for the reply; the server ignores a repeated order number, and any answer proves it received the order, so the guest sees "Order sent" with a short note instead of a false failure.
- The "Couldn't send automatically" screen now says the order may already have reached the kitchen and asks the guest to check with staff before sending it again.

## v2.0.10 — 2 Oct 2026
- **Bed & Breakfast tick box locked to one line.** The box and its text now carry their layout directly in `orders.js`, so no stylesheet rule (and no old cached `style.css`) can push the text onto a separate line. The text is dimmed until the box is ticked; ticking it shows "If this isn't correct, your order will be billed at the full price."

## v2.0.9 — 2 Oct 2026
- **Fixed: false "Couldn't send automatically".** An order could reach Telegram and email while the guest's screen said it had not been sent, because the page gave up after 10 seconds while the server was still finishing. The page now waits up to 20 seconds per try, shows "Still sending — please wait…", and before it ever shows the failure screen it asks the server whether the order was saved; if it was, the guest gets the normal "Order sent" screen. The server answers that check from a new `doGet` in `Code.gs`. Update `Code.gs` and deploy a New version.
- **Fixed: Bed & Breakfast tick box and text on separate lines.** An older style rule kept overriding the earlier fix; the new rule is strong enough, so the box and its text now sit on one line. Needs the new `style.css`.

## v2.0.8 — 2 Oct 2026
- **Specific time is back.** For "Any time" categories the choice is Breakfast, Lunch, Dinner or Specific time. Choosing Specific time changes the label from "Serve for" to "Serve at" and shows a time picker with the time shown beside it (e.g. 7:30 PM). The time must be within Kitchen Opens – Latest dining time, and a time that has already passed today is refused. Items from Breakfast/Lunch/Dinner categories still take just the date. Works with both per-item dates and one date for the whole order, and is enforced on the server (`Code.gs`).
- Update `Code.gs` in Apps Script and deploy a New version.

## v2.0.7 — 2 Oct 2026
- **Serve for is Breakfast, Lunch or Dinner only.** The "Specific time" choice and the time picker are gone. A special time (late lunch on arrival, early breakfast on check-out) goes in the Note and staff confirm. The server also refuses any clock time.
- **Group orders:** the always-on group note and the group note in the Review window are removed. The message "Group orders can include only one item for each Breakfast sitting (date)…" now appears only when the rule is broken.
- **Messages sit just above the Name field** (all order errors, not only the group one), and the window scrolls to them, so guests see them on the same screen as the button.
- **Bed & Breakfast tick box:** the box and its text are on one line and dimmed until ticked. The "If this isn't correct, your order will be billed at the full price." line appears only after ticking.
- **Admin → Settings:** the Save Settings button is also in the top bar of the Settings page, so there is no scrolling to save.
- Update `Code.gs` in Apps Script and deploy a New version.

## v2.0.6 — 1 Oct 2026
- **One date switch.** The two Admin switches ("Ask guests for a dining date & time" and "Allow a different date/time for individual items") are combined into one: **Date for each item**. On = every item has its own "Please select date" picker; off = the guest picks one date for the whole order. The "no date at all" option is removed, so guests are always asked for a date and the Breakfast/Lunch/Dinner category rules always apply. An old saved "ask for date" setting is ignored and cleared the next time Settings is saved.
- Update `Code.gs` in Apps Script and deploy a New version.

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
