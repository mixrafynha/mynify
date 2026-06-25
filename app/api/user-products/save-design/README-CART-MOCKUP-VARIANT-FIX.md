# Save Design -> Cart fix

This version keeps the existing editor and cart route. It improves only the save/cart backend layer.

## What changed

- Saves real R2 URLs, not Base64.
- Keeps `users/{userId}/{designId}/print|editor|mockups/{side}.ext`.
- Adds the saved design to `cart_items`.
- Sends these cart fields when the columns exist:
  - `user_product_id`
  - `design_id`
  - `variant_id`
  - `selected_color`
  - `selected_variant`
  - `mockup_url`
  - `item_type = custom_design`
- Uses a visual fallback for the cart thumbnail:
  1. real mockup sent by frontend
  2. editor preview
  3. print file
  4. base product image

## Important

For a true product mockup thumbnail identical to the preview, the frontend must send the generated mockup image in one of these fields:

```ts
mockups: { front: dataUrl, back: dataUrl }
```

or:

```ts
previewImageFront
previewImageBack
```

If the frontend does not send a rendered mockup, the API uses the editor/print image as fallback.

Run `CART_DESIGN_MIGRATION.sql` once in Supabase.
