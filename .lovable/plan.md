## Goal
Give the name field a bounding box (like the QR box) with auto text-wrapping so long names stay inside the box on both certificates and badges.

## Model change
Extend the name position from a single point to a box + text options:

```
NamePosition {
  x, y,               // top-left of box (image coords)
  width, height,      // box size
  fontSize,           // starting/max font size
  fontFamily,
  color,
  align?: 'center' | 'left' | 'right',   // horizontal (default center)
  verticalAlign?: 'middle' | 'top' | 'bottom', // default middle
  autoShrink?: boolean // if true, shrink font down to a min (e.g. 60% of fontSize) when even wrapped text overflows height
}
```

Backwards compatibility: old templates stored `{x, y, fontSize, ...}` (point-based). At load, if `width`/`height` are missing, synthesize a default box centered on the existing `x,y` (e.g. width = 60% of image width, height = 2× fontSize) so existing templates keep working; the user can then adjust.

## Wrapping algorithm (shared)
Word-wrap the name into lines that fit `width` at the current font size using canvas `measureText`. If `autoShrink` is on and total wrapped height exceeds `height`, step font size down (e.g. by 2px, min 50% of original) and re-wrap. Draw each line respecting `align` and `verticalAlign` inside the box.

Single very long token: break inside the word at the character level as a fallback so it never overflows horizontally.

## Files to change

1. **`src/utils/certificateUtils.ts`** — `generateCertificateImage`
   - Add `wrapText(ctx, text, maxWidth)` and `drawWrappedText(ctx, text, box, opts)` helpers.
   - Replace the single `fillText(recipientName, x, y)` with the box-based wrapped draw.
   - Keep the QR drawing unchanged.

2. **`src/components/admin/regional/CertificatePositionPicker.tsx`**
   - Render the name area as a dashed rectangle (like the QR box) instead of a crosshair.
   - Add inputs for `Width`, `Height`, `Align`, `Vertical Align`, `Auto-shrink`.
   - Click-to-place sets the box top-left (or drag a rectangle — MVP: click sets top-left, keep current W/H; user adjusts via numeric inputs and presets).
   - Update the on-canvas preview to draw wrapped "Sample Name" (and offer a "Long name preview" toggle to sanity-check wrapping).
   - Add presets: "Full-width name band" (spans ~80% width centered).

3. **`src/components/admin/regional/PreviewCertificateDialog.tsx`**
   - Types updated to include width/height/align — just pass through to `generateCertificateImage`.

4. **`src/components/admin/regional/EditCertificateTemplateDialog.tsx`**
   - Same type extension; ensure saved `name_position` JSON includes the new fields.

5. **`src/pages/admin/super/Certificates.tsx`** and **`src/pages/admin/regional/Certificates.tsx`**
   - Update the default `namePosition` state to include `width`, `height`, `align`, `verticalAlign`, `autoShrink`.
   - Sensible defaults per output type: **badge** → smaller box, autoShrink on; **certificate** → wider band.

6. **`supabase/functions/generate-certificates/index.ts`**
   - Port the same wrap/shrink helpers to the Deno canvas path so server-side generation matches the client preview.

## Data / schema
`name_position` is already `jsonb`, so no migration is required. Old records without `width`/`height` are auto-upgraded in memory at read time. New saves persist the full shape.

## Out of scope
- Drag-to-resize on the canvas (numeric inputs + presets cover it for MVP).
- Multi-line manual line breaks (auto wrap handles it).
- Changes to badge/certificate template upload storage.

## Acceptance
- Uploading a template shows a dashed **name box** (like the QR box) that can be moved/resized via inputs.
- Generating a badge/certificate with a long name (e.g. "YAFOR MINOUE PRINCESS ROSE LOVE") wraps the name onto multiple lines inside the box and no longer overflows the frame.
- Short names still render centered on one line as before.
- Existing saved templates keep working without re-configuration.
