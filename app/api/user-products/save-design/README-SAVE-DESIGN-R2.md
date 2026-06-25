# Save Design com Cloudflare R2 + cart existente

Esta versão não usa Supabase Storage e não toca na API admin.

## Fluxo

```txt
Editor
→ POST /api/user-products/save-design
→ upload R2
→ upsert user_products
→ insert cart_items
→ redirectTo: /cart
```

## Estrutura R2

```txt
users/{userId}/{designId}/print/front.png
users/{userId}/{designId}/print/back.png
users/{userId}/{designId}/mockups/front.webp
users/{userId}/{designId}/mockups/back.webp
users/{userId}/{designId}/editor/front.png
users/{userId}/{designId}/editor/back.png
```

## Env obrigatórias

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## Migração recomendada

Corre `CART_DESIGN_MIGRATION.sql`.

Sem ela, a API ainda adiciona o item ao cart usando o schema antigo, mas o cart não fica ligado ao `user_products.id`.

## Correções incluídas

- `design_data`, `design_front`, `design_back`, `print_files`, `mockups`, `print_box`, `safe_area` são enviados como objetos/arrays reais para JSONB.
- Base64 é removido de `design_data` antes de gravar.
- `image` usa a melhor imagem disponível: mockup, editor preview, print file ou imagem base.
- `ai_mockup_url` só recebe mockup real; não é preenchido com print file falso.
- `cart_items` recebe uma linha nova para o produto personalizado.
