# Correct the event “What to expect” section

## Finding

The current public section is not driven by a real “What to expect” field. It converts three Special Event Settings switches—collect lodging needs, collect meal/health information, and collect pledges—into public experience cards.

Those switches control what the registration form collects. They do not describe the programme or what attendees will experience, and “Lodging” can wrongly imply that accommodation is provided. The event forms currently contain an event description and preparation requirements, but no dedicated expectations content.

## Proposed information structure

Keep four ideas distinct on the public page:

1. **About the event** — the existing description: purpose and overall event story.
2. **What to expect** — new event-specific content: programme highlights, activities, atmosphere, sessions, speakers, worship, networking, or intended outcomes.
3. **Registration information** — the existing lodging, meal/health, pledge, and fee settings, described accurately as information requested during registration rather than benefits promised by the event.
4. **What to prepare** — the existing requirements: items, documents, clothing, eligibility, or other attendee preparation.

## Event creation and editing

- Add dedicated **What to expect** and **What to expect (French)** fields to event creation and editing.
- Make the content a simple multi-line list: one expectation per line. This is fast for event creators, easy to translate, and produces consistent public cards without a complex editor.
- Add clear examples beneath the field, such as “Teaching sessions”, “Worship and prayer”, or “Networking with other members”.
- Place the English field after the event description and the French field inside the existing French translation area.
- Support the fields in the Super Admin and Regional event forms, including create, edit, duplicate, defaults, validation, and saving. Include the DCG form where those events can appear publicly, while keeping its current simpler form style.

## Public event page

- Render **What to expect** only from the new event-specific content, one concise item per card or row.
- Hide the section when no expectations were entered; do not manufacture generic content.
- Move lodging, meal/health, and pledge indicators beside registration under **Registration information**.
- Use precise language:
  - “Accommodation needs requested” rather than “Lodging”.
  - “Meal, allergy and health details requested”.
  - “Optional campaign support available”, only when a linked campaign is configured.
- Keep fees in the registration area and do not mix them into “What to expect”.
- Preserve English/French browser-language delivery and the current mobile-first event design.

## Data and compatibility

- Add nullable bilingual event fields for expectations; existing events remain valid and simply hide the section until content is added.
- Update generated event types and all event save/load paths.
- Do not change registration collection, family pricing, fundraising, attendance, or reporting behavior.

## Verification

- Create, edit, duplicate, and reopen events in every applicable portal and confirm expectations persist.
- Verify English and French content independently.
- Check events with multiple expectations, one expectation, and none.
- Confirm registration indicators accurately follow the existing switches and never imply guaranteed lodging or meals.
- Test the revised sections at mobile, tablet, and desktop sizes and confirm the preview build remains clean.
