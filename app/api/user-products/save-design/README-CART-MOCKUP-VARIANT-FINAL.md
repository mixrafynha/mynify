# Save Design -> Cart: variant + color + real mockup

Esta versão corrige a causa da miniatura escura no cart.

## Regra importante

`print_files` é o PNG transparente de produção. Ele NÃO deve ser usado como thumbnail do cart.

O cart usa esta ordem:

1. `mockups.front` / `mockups.back` se o frontend enviar mockup renderizado
2. imagem base do produto
3. editor preview
4. print file só como último fallback

## Para aparecer igual ao preview

O frontend que chama `/api/products/generate-own-mockup` tem de mandar essa imagem no save:

```ts
await fetch('/api/user-products/save-design', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    baseProductId,
    variantId,
    selectedVariant,
    selectedColor,
    mockupColor,
    designFront,
    designBack,
    design_data,
    printFiles: {
      front: transparentPrintFrontDataUrl,
      back: transparentPrintBackDataUrl,
    },
    mockups: {
      front: generatedMockupFrontDataUrl,
      back: generatedMockupBackDataUrl,
    },
  }),
});
```

Campos de mockup também aceites:

- `mockupFront`
- `mockupImageFront`
- `previewImageFront`
- `previewMockupFront`
- `generatedMockupFront`
- `previewData.front.mockup`
- `previewData.front.image`

## Migração

Corre `CART_DESIGN_MIGRATION.sql` para o cart guardar:

- `user_product_id`
- `design_id`
- `variant_id`
- `selected_color`
- `selected_variant`
- `mockup_url`
- `item_type`
