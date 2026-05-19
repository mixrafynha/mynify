import {
  Coffee,
  Grid2X2,
  ImageIcon,
  Mars,
  Shirt,
  Venus,
} from "lucide-react";

export const CATEGORIES = [
  {
    name: "All",
    value: "all",
    icon: Grid2X2,
  },
  {
    name: "Hoodies",
    value: "hoodie",
    icon: Shirt,
  },
  {
    name: "T-Shirts",
    value: "tshirt",
    icon: Shirt,
  },
  {
    name: "Caps",
    value: "caps",
    icon: Shirt,
  },
  {
    name: "Mugs",
    value: "mug",
    icon: Coffee,
  },
  {
    name: "Posters",
    value: "poster",
    icon: ImageIcon,
  },
] as const;

export const AUDIENCES = [
  {
    name: "All",
    value: "all",
    label: "All",
    icon: Grid2X2,
  },
  {
    name: "Woman",
    value: "woman",
    label: "Woman",
    icon: Venus,
  },
  {
    name: "Man",
    value: "man",
    label: "Man",
    icon: Mars,
  },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]["name"];
export type AudienceName = (typeof AUDIENCES)[number]["name"];