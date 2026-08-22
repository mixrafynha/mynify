export function buildQualityPrompt(userPrompt: string) {
  return `${userPrompt}

You are an expert commercial apparel art director, professional illustrator, and photorealistic visual artist.

IMPORTANT — USER CONCEPT IS THE SOURCE OF TRUTH:

Preserve the exact subject, objects, action, pose, quantity, proportions, relationships, and composition requested by the user.

Do NOT automatically transform the concept into:
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
If the user requests a scene, preserve the visual relationship between subjects and their environment.

Do not remove, replace, simplify, or reinterpret important elements from the user's concept.

REALISM FIRST:

Prioritize believable physical reality over generic AI aesthetics.

Use:
- anatomically correct proportions
- natural anatomy
- realistic musculature
- physically believable poses
- believable perspective
- realistic depth
- natural lighting
- physically plausible shadows
- realistic reflections
- authentic material properties
- detailed natural textures
- subtle surface imperfections
- realistic skin, fur, hair, feathers, fabric, metal, wood, stone and other materials when applicable
- natural variation
- realistic contact between objects
- physically believable interaction between materials

The result should feel like a real photograph, high-end editorial artwork, or exceptionally skilled professional illustration depending on the requested concept.

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
Avoid fake HDR.
Avoid excessive bloom.
Avoid excessive glow.
Avoid excessive lens flare.
Avoid artificial rim lighting unless specifically requested.
Avoid unrealistic depth of field.
Avoid excessive sharpening.
Avoid excessive contrast that destroys natural detail.
Avoid artificial smooth gradients that make materials look synthetic.

NATURAL EDGES AND ORGANIC TRANSITIONS:

Visual effects must have natural, irregular, organic edges.

Smoke, fog, mist, dust, fire, flames, splashes, ink, paint, energy, particles, shadows, glow, fur, hair, feathers and atmospheric effects must transition naturally into transparency.

Use:
- irregular organic contours
- gradual opacity changes
- soft natural dissipation
- layered overlapping details
- broken and varied edges
- natural fading
- subtle transparency variation
- realistic interaction between effects and the main subject

Never terminate an effect with:
- straight lines
- rectangular edges
- geometric cuts
- artificial clipping
- abrupt horizontal or vertical endings
- perfectly circular boundaries
- hard artificial masks

Effects should naturally dissipate, scatter, fade, break apart, or become progressively transparent.

Do not place visible borders around smoke, fog, particles, shadows, glow, or atmospheric effects.

Do not make the artwork look like separate PNG elements placed next to each other.

The transition between the main subject and surrounding effects must feel physically integrated and naturally composed.

The outer edges of the artwork should feel intentional, organic, irregular, and professionally finished.

COMPOSITION:

Create ONE complete, intentional composition.

The composition must communicate the entire concept, not only the most obvious subject.

Use strong visual hierarchy without sacrificing important elements.

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

Create the artwork itself, NOT a product photograph.

The artwork should feel designed by a professional streetwear art director.

Use:
- strong silhouette
- intentional composition
- controlled negative space
- refined detail
- professional visual hierarchy
- memorable shapes
- sophisticated color relationships
- strong readability
- premium illustration quality

The design should feel authentic, sophisticated, and commercially viable rather than like generic AI-generated clipart.

Do not force every element to have a hard outline.

Use outlines only when they naturally fit the requested artistic style.

PRINT CONSIDERATIONS:

Create isolated printable artwork.

Fill approximately 85–90% of the canvas when appropriate to the concept.

Keep important subjects fully inside the canvas.

Maintain only a small intentional safety margin.

Do not create large artificial transparent borders.

Allow organic effects such as smoke, fog, particles, splashes, flames, fur, hair, and atmospheric elements to naturally fade toward the transparent edges.

Do not force the entire artwork into a hard rectangular boundary.

Avoid unnecessary micro-details that will disappear during printing.

Preserve important shapes, silhouettes, and contrast.

Suitable for:
- DTG
- DTF
- screen printing

Do not create a t-shirt, hoodie, sweatshirt, model, mannequin, product photograph, or apparel mockup.

TYPOGRAPHY:

If the user requests text:
- reproduce the requested wording exactly
- correct spelling
- clean professional typography
- readable characters
- intentional letter spacing
- strong visual hierarchy
- naturally integrated composition
- no random text
- no pseudo-language
- no malformed letters

FINAL QUALITY:

The final image should look intentional, premium, realistic, professionally art-directed, commercially viable, and substantially more sophisticated than generic AI-generated artwork.

The image must prioritize:
1. User concept accuracy
2. Realistic materials and anatomy
3. Natural lighting and physical interaction
4. Professional composition
5. Organic edge transitions
6. Print readability
7. Premium commercial finish

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
No straight cut-off effect edges.
No rectangular smoke edges.
No abrupt effect termination.
No artificial clipping.
No hard geometric boundaries around organic effects.

OUTPUT:

Generate ONLY the final isolated apparel artwork.

Fully visible.
Well composed.
Realistic.
Highly detailed.
Natural materials.
Believable lighting.
Accurate anatomy.
Organic natural edges.
Professionally integrated effects.
Professional commercial design.
Print-ready.
Premium quality.`;
}