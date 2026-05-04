export type ProductAPI = {
  id: string | number
  title: string
  price?: number
  image?: string
  updated_at?: string
  variants?: {
    price?: number
  }[]
}