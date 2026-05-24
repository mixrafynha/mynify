import type { ReactNode } from "react";

import {
  Anton,
  Bebas_Neue,
  Orbitron,
  Playfair_Display,
  Poppins,
  Cinzel,
  DM_Serif_Display,
  Space_Grotesk,
  Rubik_Mono_One,
} from "next/font/google";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const playfair =
  Playfair_Display({
    subsets: ["latin"],
    variable:
      "--font-playfair",
  });

const poppins = Poppins({
  subsets: ["latin"],
  weight: [
    "400",
    "600",
    "800",
    "900",
  ],
  variable:
    "--font-poppins",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable:
    "--font-cinzel",
});

const dmSerif =
  DM_Serif_Display({
    subsets: ["latin"],
    weight: "400",
    variable:
      "--font-dm-serif",
  });

const spaceGrotesk =
  Space_Grotesk({
    subsets: ["latin"],
    variable:
      "--font-space",
  });

const rubikMono =
  Rubik_Mono_One({
    subsets: ["latin"],
    weight: "400",
    variable:
      "--font-rubik-mono",
  });

export default function DesignLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section
      className={`
        ${anton.variable}
        ${bebas.variable}
        ${orbitron.variable}
        ${playfair.variable}
        ${poppins.variable}
        ${cinzel.variable}
        ${dmSerif.variable}
        ${spaceGrotesk.variable}
        ${rubikMono.variable}
      `}
    >
      {children}
    </section>
  );
}