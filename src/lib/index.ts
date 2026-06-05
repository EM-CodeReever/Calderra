// place files you want to import through the `$lib` alias in this folder.
import { PrismaClient } from "$prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "$env/dynamic/private";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

export type Theme = {
  current:
    | "forest"
    | "abyss"
    | "aqua"
    | "emerald"
    | "light"
    | "dark"
    | "cupcake"
    | "bumblebee"
    | "halloween"
    | "garden"
    | "synthwave"
    | "retro"
    | "cyberpunk"
    | "valentine"
    | "wireframe"
    | "black"
    | "luxury"
    | "dracula"
    | "cmyk"
    | "autumn"
    | "business"
    | "acid"
    | "lemonade"
    | "night";
  extra?: {
    landingPageTop: string;
    landingPageBelow: string;
    navbar: string;
    footer: string;
    MainBG: string;
  };
};