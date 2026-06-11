# Super Admin Create Event Dialog — Full Parity with Regional

## Goal
The Super Admin Create Event dialog (`/admin/super/events`) is a stripped-down version of the Regional one. It is missing many sections and fields. Bring it to full parity so Super Admin can create rich global events the same way regional admins create regional events. Apply the same upgrade to the Edit Event dialog.

## Gap analysis

**Sections/fields the Regional dialog has but Super Admin is missing**

1. Cost & Currency — `cost`, `cost_currency_code`
2. Event Card Image (EN) + French version — `event_card_image`, `event_card_image_fr` (`image_url`, `image_url_fr` on events)
3. Event Hero Images slider (EN, up to 5) + French version — `image_files`, `image_files_fr` → `event_images` rows with `is_hero_image=true`
4. Event Gallery Images (EN, up to 10) + French version — `gallery_images`, `gallery_images_fr` → `event_images` rows with `is_hero_image=false`
5. Organizer Name, Organizer Email
6. WhatsApp Contact
7. French Translations collapsible section — `name_fr`, `description_fr`, `location_name_fr`, `address_fr`
8. Testimonials collapsible section with French translations — written to `event_testimonials`
9. FAQs collapsible section with French translations — written to `event_faqs`
10. Speakers collapsible section (photo, bio, LinkedIn/Twitter/Website, French translations) — written to `event_speakers`
11. Visual styling parity: gradient header, glow orbs, glass panels, rounded inputs

Everything Super Admin already has stays (slug, capacity, attendance_target, is_public/is_featured/is_special, requires_pre_registration, collect_lodging/meal/pledges, linked_fundraising_campaign_id, registration_url).

## Implementation

All changes are in **`src/pages/admin/super/Events.tsx`** (no schema or DB changes required — the `events`, `event_images`, `event_testimonials`, `event_faqs`, `event_speakers` tables already support all of these columns; Regional already writes them).

1. **Imports** — add `useFieldArray`, `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent`, `ChevronDown`, `X`, `Languages`, `Card`, `FormDescription`, `Textarea`, `useCurrencies`.

2. **Schema** — replace the slim `eventSchema` with the same one used by Regional Events: add `name_fr`, `description_fr`, `location_name_fr`, `address_fr`, `cost`, `cost_currency_code`, `event_card_image`, `event_card_image_fr`, `image_files`, `image_files_fr`, `gallery_images`, `gallery_images_fr`, `organizer_name`, `organizer_email`, `whatsapp_contact`, and the `testimonials`/`faqs`/`speakers` array shapes. Keep the existing Super-Admin-only fields (`collect_*`, `linked_fundraising_campaign_id`, `slug`, `attendance_target`).

3. **State** — add image-preview state arrays for card/hero/gallery (EN + FR) and `speakerPhotoPreviews`, mirroring Regional.

4. **Field arrays** — `useFieldArray` for `testimonials`, `faqs`, `speakers` on both `form` and `editForm`.

5. **Form body (`renderEventForm`)** — replace with the Regional layout: 2-column grid for primary fields, then collapsible sections for French translations / Testimonials / FAQs / Speakers, then the boolean toggles (`is_public`, `is_featured`, `is_special` + the Special Event Settings block already present). Keep the Special Event sub-section (collect_lodging, collect_meal_preferences, collect_pledges, linked_fundraising_campaign_id) and pre-registration toggle.

6. **`onSubmit` / `onEditSubmit`** — mirror Regional's flow:
   - Upload card image (EN/FR) → `event-images` storage → URLs
   - Upload hero images (EN/FR) → URLs
   - Upload gallery images (EN/FR) → URLs
   - Insert event with `region_id: null`, `dcg_id: null`, plus all new fields (cost, organizer_*, whatsapp_contact, *_fr fields, image_url, image_url_fr)
   - Insert `event_images` rows for hero + gallery (with `image_url_fr` populated when provided)
   - Insert `event_testimonials`, `event_faqs`
   - Upload speaker photos + insert `event_speakers`
   - Reset all previews/state on success

7. **Edit dialog** — reuse the same form schema and `renderEventForm`. In `openEditDialog`, also load existing event_images / testimonials / FAQs / speakers and prefill the form (matching Regional's edit flow). Stretch goal acceptable: at minimum support editing all the new scalar fields, French text fields and adding new media/testimonials/FAQs/speakers; deletion of existing media can follow the Regional pattern.

8. **Dialog shell** — bump `DialogContent` from `max-w-2xl` to a wider, scrollable shell (e.g. `max-w-3xl max-h-[90vh] overflow-hidden p-0`) and add the gradient header + glow orbs used in Regional, per the project's glass dialog standard.

## Out of scope
- No DB migrations.
- No changes to the DCG portal Create Event dialog.
- No new shared component extraction (kept inline to keep the diff focused on parity; can be refactored later).

## Files touched
- `src/pages/admin/super/Events.tsx` (schema, state, form body, submit handlers, edit prefill)
