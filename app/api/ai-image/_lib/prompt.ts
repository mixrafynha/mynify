export function buildQualityPrompt(userPrompt: string) {
  return `${userPrompt}

Create ONE premium apparel graphic design only.

The artwork must look professionally designed for a real commercial streetwear brand.

PROFESSIONAL DESIGN QUALITY:
- Premium commercial apparel artwork
- Professional streetwear graphic design
- Strong visual identity
- Original and memorable composition
- Intentional visual hierarchy
- Sophisticated composition
- Highly readable silhouette
- Every element must have a clear purpose
- Detailed but controlled
- Authentic designer-made appearance
- Avoid generic AI-generated aesthetics

VISUAL QUALITY:
- Extremely detailed
- Refined professional illustration
- Natural and believable forms
- Authentic textures
- Realistic material detail when appropriate
- Natural lighting and shadows
- Strong depth without excessive 3D rendering
- Rich but believable colors
- Crisp edges
- High contrast
- Detailed focal point
- Subtle natural imperfections
- Avoid overly smooth or artificial surfaces

COMPOSITION:
- ONE cohesive central artwork
- Large dominant composition
- Fill approximately 85–90% of the canvas
- Minimal empty space
- Only a small intentional safety margin
- Strong silhouette
- Clear focal point
- Balanced composition
- Keep all important elements fully inside the canvas
- Do not crop the main subject
- Make the design readable at smaller print sizes

PRINT-READY DESIGN:
- Designed specifically as isolated printable artwork
- Suitable for DTG printing
- Suitable for DTF printing
- Suitable for screen printing
- Strong shapes and clear contrast
- Clean separation between major visual elements
- Avoid unnecessary micro-details that disappear when printed
- Preserve important details at smaller sizes
- No environmental scenery
- No product presentation

REALISM:
When realistic subjects are requested, use:
- Natural anatomy
- Realistic proportions
- Physically believable materials
- Authentic skin, fur, fabric, metal, or surface textures
- Natural light interaction
- Realistic shadows
- Subtle imperfections
- High-detail photographic or professional illustrative quality

Avoid plastic-looking surfaces, artificial smoothness, excessive CGI, exaggerated 3D rendering, fake reflections, excessive glow, and overly polished AI-generated textures.

TYPOGRAPHY:
If text or lettering is requested:
- Correct spelling is mandatory
- Clean and highly readable
- Bold professional typography
- Proper letter spacing
- Strong visual hierarchy
- Naturally integrated into the artwork
- Never generate random or meaningless text

STRICT NEGATIVE RULES:

No t-shirt.
No hoodie.
No sweatshirt.
No clothing mockup.
No apparel mockup.
No product mockup.
No model wearing clothing.
No mannequin.
No product photography.
No room.
No wall.
No table.
No hanger.
No frame.
No studio scene.
No environmental background.
No watermark.
No fake brand.
No random logo.
No unnecessary objects.
No floating elements.
No bubbles.
No excessive particles.
No excessive glow.
No excessive lens flare.
No plastic 3D appearance.
No generic stock-art appearance.
No cartoonish AI appearance.
No overly smooth surfaces.
No huge empty transparent border.
No cropped main subject.
No duplicated objects.
No distorted anatomy.
No malformed details.

OUTPUT:
Generate ONLY the isolated printable artwork.

Centered composition.
Fully visible artwork.
Sharp and highly detailed.
Professional commercial quality.
Strong silhouette.
High contrast.
Rich but believable colors.
Premium finish.
Ready for apparel production.`;
}