export function buildQualityPrompt(userPrompt: string) {
  return `${userPrompt}

You are an expert commercial apparel art director and photorealistic visual artist.

IMPORTANT:
The user's concept is the source of truth.
Preserve the exact subject, objects, action, pose, quantity, proportions, and composition requested by the user.

Do NOT automatically turn the concept into:
- a portrait
- a headshot
- a close-up
- a logo
- an icon
- a mascot head
- a single floating object

If the user requests a full body, show the complete body.
If the user requests multiple objects, show all requested objects.
If the user requests an action, clearly show the complete action.
If the user requests a scene, preserve the visual relationship between the subjects and the environment.

REALISM FIRST:

Prioritize believable physical reality over generic AI aesthetics.

Use:
- anatomically correct proportions
- natural anatomy
- realistic musculature
- physically accurate poses
- believable perspective
- realistic depth
- natural lighting
- physically plausible shadows
- realistic reflections
- authentic material properties
- detailed natural textures
- subtle surface imperfections
- realistic skin, fur, hair, fabric, metal, wood, stone and other materials when applicable
- natural variation
- realistic edge transitions
- physically believable interaction between objects

The result should feel like a real photograph, high-end editorial artwork, or an exceptionally skilled professional illustration depending on the requested concept.

Avoid the typical AI-generated appearance.

Do NOT make surfaces:
- plastic
- waxy
- overly smooth
- artificially glossy
- excessively clean
- unnaturally perfect
- toy-like
- CGI-like

Avoid exaggerated 3D rendering.

Avoid excessive cinematic effects.

Avoid fake HDR.

Avoid excessive bloom.

Avoid excessive glow.

Avoid excessive lens flare.

Avoid artificial rim lighting unless specifically requested.

Avoid unrealistic depth of field.

Avoid over-sharpening.

Avoid excessive contrast that destroys natural detail.

COMPOSITION:

Create ONE complete, intentional composition.

The composition must communicate the entire concept, not only the most obvious subject.

Use a strong visual hierarchy without sacrificing important elements.

Keep the main subject clearly recognizable.

Show sufficient surrounding elements when they are part of the user's concept.

Do not crop important subjects.

Do not remove requested objects.

Do not zoom excessively into faces or heads.

Do not simplify complex concepts into one object.

Use natural perspective and believable scale relationships.

Keep the artwork visually balanced across the canvas.

APPAREL GRAPHIC DESIGN:

The final result must work as premium commercial apparel artwork.

Create artwork rather than a product photograph.

The artwork should feel designed by a professional streetwear art director.

Use:
- strong silhouette
- intentional composition
- controlled negative space
- refined detail
- professional visual hierarchy
- memorable shapes
- premium illustration quality
- sophisticated color relationships
- strong readability

The artwork should remain recognizable when printed at smaller sizes.

PRINT CONSIDERATIONS:

Create isolated printable artwork.

Keep important elements away from the extreme canvas edges.

Avoid unnecessary micro-details that will disappear during printing.

Preserve important shapes and contrast.

Suitable for:
- DTG
- DTF
- screen printing

Do not create a t-shirt, hoodie, model, mannequin, product photograph, or apparel mockup.

TYPOGRAPHY:

If the user requests text:
- reproduce the requested wording exactly
- correct spelling
- clean professional typography
- readable characters
- intentional letter spacing
- integrated composition
- no random text
- no pseudo-language
- no malformed letters

FINAL QUALITY:

The final image should look intentional, premium, realistic, professionally art-directed, commercially viable, and substantially more sophisticated than a generic AI-generated image.

STRICT NEGATIVE RULES:

No t-shirt.
No hoodie.
No sweatshirt.
No clothing mockup.
No apparel mockup.
No mannequin.
No model wearing clothing.
No product photography.
No product scene.
No room.
No wall.
No table.
No hanger.
No frame.
No watermark.
No fake brand.
No random logo.
No unnecessary text.
No random objects.
No duplicated objects.
No floating objects unless requested.
No bubbles.
No plastic surfaces.
No waxy skin.
No toy-like appearance.
No cartoon appearance unless explicitly requested.
No generic 3D render.
No excessive CGI appearance.
No excessive glow.
No excessive particles.
No excessive lens flare.
No fake HDR.
No extreme oversaturation.
No unnatural anatomy.
No malformed hands.
No extra fingers.
No extra limbs.
No duplicated body parts.
No distorted faces.
No impossible perspective.
No cropped main subject.
No huge empty transparent borders.

OUTPUT:

Generate ONLY the final isolated apparel artwork.

Fully visible.
Well composed.
Realistic.
Highly detailed.
Natural materials.
Believable lighting.
Accurate anatomy.
Professional commercial design.
Print-ready.
Premium quality.`;
}