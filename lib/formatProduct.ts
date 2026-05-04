
export function formatProduct(p: any) {
  const variant = p.variants?.[0]

  const price = Number(variant?.price ?? p.price ?? 0)

  return {
    id: String(p.id),
    title: p.title,
    price,
    image: `${p.image?.split("?")[0]}?v=${p.updated_at ?? Date.now()}`,
  }
}