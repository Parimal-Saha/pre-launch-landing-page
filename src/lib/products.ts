/** The five upcoming products — copy mirrors the real packaging labels. */
export type Product = {
  id: string;
  name: string;
  type: string;
  blurb: string;
  tag: string;
  accent: "neon" | "sky" | "blaze" | "pink" | "sun";
  image: string;
  /** Transparent cutout for the hero lineup (alpha PNG) + its intrinsic size. */
  cutout: string;
  cutoutWidth: number;
  cutoutHeight: number;
  sticker: string;
  stickerAlt: string;
};

export const products: Product[] = [
  {
    id: "no-dirt-given",
    name: "No Dirt Given",
    type: "Gel Face Wash",
    blurb: "0.5% salicylic acid + 2% niacinamide + panthenol. Dirt doesn't stand a chance.",
    tag: "Cleanse",
    accent: "sky",
    image: "/assets/products/no-dirt-given.jpg",
    cutout: "/assets/products/no-dirt-given-cutout.png",
    cutoutWidth: 560,
    cutoutHeight: 932,
    sticker: "/assets/stickers/no-dirt-washed-off.png",
    stickerAlt: "No Dirt Given is getting washed off sticker",
  },
  {
    id: "drop-dead-gorgeous",
    name: "Drop Dead Gorgeous",
    type: "10% Azelaic Acid Serum",
    blurb: "10% azelaic acid. Tones down drama — redness, uneven texture, the lot.",
    tag: "Glow",
    accent: "pink",
    image: "/assets/products/drop-dead-gorgeous.jpg",
    cutout: "/assets/products/drop-dead-gorgeous-cutout.png",
    cutoutWidth: 560,
    cutoutHeight: 743,
    sticker: "/assets/stickers/ddg-character.png",
    stickerAlt: "Drop Dead Gorgeous purple character sticker",
  },
  {
    id: "dew-the-right-thing",
    name: "Dew The Right Thing",
    type: "Gel Moisturizer",
    blurb: "Triple hyaluronic acid + 2% niacinamide + ceramides. Moisture has entered the chat.",
    tag: "Hydrate",
    accent: "neon",
    image: "/assets/products/dew-the-right-thing.jpg",
    cutout: "/assets/products/dew-the-right-thing-cutout.png",
    cutoutWidth: 560,
    cutoutHeight: 991,
    sticker: "/assets/stickers/dtrt-text.png",
    stickerAlt: "Dew The Right Thing sticker lettering",
  },
  {
    id: "no-shade",
    name: "No Shade",
    type: "Under Arm Serum",
    blurb: "Niacinamide + licorice root. Underarms, upgraded.",
    tag: "Brighten",
    accent: "blaze",
    image: "/assets/products/no-shade.jpg",
    cutout: "/assets/products/no-shade-cutout.png",
    cutoutWidth: 560,
    cutoutHeight: 752,
    sticker: "/assets/stickers/no-shade-banner.png",
    stickerAlt: "No Shade underarm serum banner sticker",
  },
  {
    id: "mark-my-words",
    name: "Mark My Words",
    type: "Stretch Mark Serum",
    blurb: "A daily serum for marks and texture. Consistency is the whole point.",
    tag: "Treat",
    accent: "sun",
    image: "/assets/products/mark-my-words.jpg",
    cutout: "/assets/products/mark-my-words-cutout.png",
    cutoutWidth: 560,
    cutoutHeight: 770,
    sticker: "/assets/stickers/mmw-label.png",
    stickerAlt: "Mark My Words stretch marks serum label sticker",
  },
];
