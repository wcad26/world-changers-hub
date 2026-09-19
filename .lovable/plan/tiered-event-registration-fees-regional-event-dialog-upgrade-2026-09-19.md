# Tiered Event Registration Fees + Regional Event Dialog Upgrade

## What you'll get

1. **Regional event create/edit dialog rebuilt to match Super Admin** — same design, same special-event settings panel (lodging, meals, pledges, linked fundraising campaign), plus French fields, speakers/FAQs/testimonials where they already exist on super admin.
2. **Event cost moves into Special Event Settings** and becomes **tiered registration fees**: the creator adds one or more fee rows, each assigned to a category — **Leader**, **Member** (covers members and visitors), or **Child**.
3. **Pre-registration shows each person their fee automatically**, based on who they are in the system, in a new "Registration Fees" card just above the "Pledge to support" section. Families see a per-person breakdown and a family total.
4. **Registration fees flow into the linked fundraising campaign** and are tracked **separately from pledges** on the admin finance pages, so you can see "fees expected / fees collected" vs "pledges promised / donations received" at a glance.

## How a person's category is decided

- **Leader**: the person has any active admin role (Super Admin, Regional Admin, or DCG Admin) — checked server-side against their roles, not the browser.
- **Child**: under 16 and linked to an adult family member (the existing child rule).
- **Member**: everyone else, whether their record says member or visitor.
- Priority order if several could apply: Child first (a child never pays the leader/member rate), then Leader, then Member.
- If the event defines no fee for a person's category, that person registers free (fee shown as 0) — and the event creator is warned in the dialog if a category has no fee.

## Changes in the pre-registration flow

- After identity lookup, each attendee (you + each family member) gets their category resolved on the server.
- New **Registration Fees** card above the pledge card lists: name — category badge — fee, plus a total for the group. Free attendees show "Free".
- Re-registration of an existing attendee refreshes their fee like the rest of their data.
- The admin report (special event planning report) gains a "Fees expected / collected" summary and a fee column per attendee.

## Collecting the money (no online payment yet)

- Registration records the fee each person owes. Payment itself stays offline (cash/MoMo at the desk).
- A new **"Record fee payment"** action on the event's pre-registration list (regional + super admin) marks a person's fee as paid. Each payment also records a donation on the linked fundraising campaign, tagged as a registration fee — so the campaign's raised amount includes it automatically.
- Unpaid fees count toward the campaign's **expected** total in reports, collected fees toward **raised**.

## Admin finance pages

- The fundraising campaign report gains three numbers: **Pledges promised**, **Donations received**, **Registration fees (expected / collected)** — kept visually separate so the funding mix is clear.
- Paid registration fees also appear in the regional ledger (and global books for global events) under a new "Event Registration Fees" income category.

## Technical details

**Database (one migration):**
- New table `event_registration_fees`: `id, event_id, category ('leader'|'member'|'child'), label, amount (minor units), currency_code, sort_order, created_at/updated_at` + grants + RLS (public read for public special events; regional/super admins manage).
- `event_pre_registrations` gains: `registration_fee_category text`, `registration_fee_amount bigint`, `fee_status text ('unpaid'|'paid'|'waived')`, `fee_paid_at timestamptz`.
- New income category row in `financial_transaction_categories`: "Event Registration Fees".
- The existing `raised`/`pledged_total` triggers keep campaign totals correct automatically since paid fees insert into `fundraising_donations`.

**Edge functions:**
- `event-special-register`: resolve category per attendee server-side (roles query + child rule), snapshot `registration_fee_category`/`registration_fee_amount` onto each pre-registration row, return the breakdown so the UI can render the card.
- New `record-event-fee-payment` (admin-only): validates caller's admin role, marks the registration paid, inserts the linked `fundraising_donations` row (status `completed`) and the `financial_transactions` ledger entry under "Event Registration Fees".

**Frontend:**
- `src/pages/admin/regional/Events.tsx`: schema + dialog aligned with super admin (special settings panel, campaign picker, FR fields); `cost`/`cost_currency_code` removed from the main form in **both** regional and super admin dialogs and replaced by the fee-rows editor (add/remove rows: category, optional label, amount) inside Special Event Settings.
- `src/pages/SpecialEventRegister.tsx`: new Registration Fees card above the pledge card; server-returned breakdown rendered per attendee with badges and group total.
- Pre-registration admin list + special event report: fee status column, "Record payment" / "Waive" actions, expected/collected totals.
- Fundraising report + finance tabs: separate pledge/donation/registration-fee figures.

**Notes / edge cases handled:**
- Fee changes after people registered don't rewrite existing registrations (their snapshot stays; admins see the stored amount).
- Family registrations price each person individually; children priced by the child rule.
- Category resolution never trusts the browser — a user cannot claim to be a child to pay less; the server decides from roles and family links.

## Out of scope (unless you ask)

- Online payment collection (fees are recorded when paid offline).
- The DCG event dialog stays simple (DCG meetings are free, non-special events).
