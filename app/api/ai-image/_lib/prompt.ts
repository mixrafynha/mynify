export function buildQualityPrompt(userPrompt: string) {
  return `${userPrompt}

Create ONE premium apparel graphic only.

Professional luxury streetwear illustration.
Tattoo-quality artwork.
Extremely detailed.
Fill approximately 90% of the canvas.
Large central composition.
No empty transparent borders.
Leave only a tiny safety margin around the artwork.
Aggressive high-impact composition.
Rich textures.
Layered details.
Deep shadows.
Cinematic lighting.
Ultra sharp edges.
Bold clean outlines.
Crisp line art.
High contrast.
Vibrant colors.
Highly readable silhouette.
Vector-inspired professional illustration.
Premium commercial apparel artwork.
Professional DTG print.
Professional DTF print.
Screen-print friendly design.
Award-winning merch illustration.

If text or lettering is requested, make it clean, bold, readable, correctly spelled, and integrated into the artwork.

STRICT NEGATIVE RULES:
No t-shirt.
No hoodie.
No sweatshirt.
No clothing.
No product mockup.
No person.
No model.
No mannequin.
No hands.
No body.
No room.
No wall.
No table.
No hanger.
No frame.
No watermark.
No logo mockup.
No product photo.
No background scene.
No huge empty transparent border.

Generate only the isolated printable artwork, centered, fully visible, sharp, detailed, high contrast, vibrant, and print-ready.`;
}
