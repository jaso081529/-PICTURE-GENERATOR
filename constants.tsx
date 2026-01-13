
import { BrandId, BrandProfile, StickerStyle, StickerTemplate, StickerShape, AspectRatio } from './types';
import { Flame, ShoppingBag, Palette, Mic2, Star } from 'lucide-react';
import React from 'react';

export const BRANDS: BrandProfile[] = [
  {
    id: BrandId.RED_DEVILS,
    name: "Red Devils Division",
    description: "Fussball, Leidenschaft, Ultras, Aggressiv & Stolz.",
    colors: ['#EF4444', '#000000', '#FFFFFF'],
    keywords: [
      "Official 1. FC Kaiserslautern crest", 
      "Red round shield with white circle", 
      "Text '1. FCK' inside logo", 
      "Red Devil mascot face", 
      "Betzenberg Stadium aesthetics", 
      "Kaiserslautern Ultra visuals", 
      "Rot-Teufel aesthetics"
    ],
    icon: "Flame"
  },
  {
    id: BrandId.HOODPLAKA,
    name: "Hoodplaka67",
    description: "Der Shop. Streetwear, Urban, Beton & Style.",
    colors: ['#F59E0B', '#1F2937'],
    keywords: ["Hoodplaka67 official logo typography", "urban streetwear brand identity", "graffiti tag 67", "concrete grey and warning orange", "modern hypebeast fashion aesthetic", "sticker bombing culture"],
    icon: "ShoppingBag"
  },
  {
    id: BrandId.JJ674,
    name: "JJ674 (Künstler)",
    description: "Künstlerisch, Abstrakt, Einzigartig.",
    colors: ['#8B5CF6', '#EC4899'],
    keywords: ["JJ674 artist signature", "abstract expressionism style", "vibrant purple and pink splashes", "creative paint texture", "surreal artistic composition", "hand-drawn sketch elements"],
    icon: "Palette"
  },
  {
    id: BrandId.PALZFLOW,
    name: "PalzFlow",
    description: "Flow, Dynamik, Musik & Bewegung.",
    colors: ['#06B6D4', '#3B82F6'],
    keywords: ["PalzFlow official music logo", "dynamic sound waves visualization", "liquid blue aesthetic", "hip hop and rap culture visuals", "microphone and flow energy", "cool cyan tones"],
    icon: "Mic2"
  },
  {
    id: BrandId.CUSTOM,
    name: "Freestyle",
    description: "Kein Limit. Dein eigenes Ding.",
    colors: ['#ffffff', '#666666'],
    keywords: [],
    icon: "Star"
  }
];

export const PRINT_SIZES: { label: string; dim: string; ratio: AspectRatio; shapeId?: string; promptAdd?: string }[] = [
  { label: 'DIN A4', dim: '21,0 x 29,7 cm', ratio: '3:4', shapeId: 'square' },
  { label: 'DIN A5', dim: '14,8 x 21,0 cm', ratio: '3:4', shapeId: 'square' },
  { label: 'DIN A6', dim: '10,5 x 14,8 cm', ratio: '3:4', shapeId: 'square' },
  { label: 'DIN A7', dim: '7,4 x 10,5 cm', ratio: '3:4', shapeId: 'square' },
  { label: 'Ultra Wide', dim: '20,0 x 5,0 cm', ratio: '16:9', shapeId: 'square', promptAdd: 'wide rectangular format layout' },
  { label: 'Quadrat', dim: '9,5 x 9,5 cm', ratio: '1:1', shapeId: 'square' },
  { label: 'Kreis', dim: '⌀ 9,5 cm', ratio: '1:1', shapeId: 'circle' },
  { label: 'Rechteck', dim: '7,0 x 5,0 cm', ratio: '4:3', shapeId: 'square' },
];

export const SHAPES: StickerShape[] = [
  {
    id: 'contour',
    name: '✂️ Konturschnitt',
    promptInstruction: "Die-cut sticker shape following the exact contour of the subject, white border around the silhouette.",
    icon: '✂️'
  },
  {
    id: 'circle',
    name: '⚪ Kreis / Rund',
    promptInstruction: "Perfectly circular sticker shape, round badge format, content contained within a circle.",
    icon: '⚪'
  },
  {
    id: 'square',
    name: '⬜ Quadratisch',
    promptInstruction: "Square sticker shape with slightly rounded corners, filling the entire square canvas.",
    icon: '⬜'
  },
  {
    id: 'shield',
    name: '🛡️ Wappen',
    promptInstruction: "Heraldic shield shape sticker, classic football crest format, pointed bottom.",
    icon: '🛡️'
  },
  {
    id: 'hexagon',
    name: '⬡ Hexagon',
    promptInstruction: "Hexagonal sticker shape, honeycomb geometry, modern six-sided format.",
    icon: '⬡'
  },
  {
    id: 'stamp',
    name: '🎫 Briefmarke',
    promptInstruction: "Postage stamp shape with perforated edges, vintage stamp aesthetic.",
    icon: '🎫'
  }
];

export const STYLES: StickerStyle[] = [
  // --- KLASSIKER ---
  {
    id: 'vector',
    name: 'Vektor Clean',
    promptModifier: "clean vector art, thick white border, flat colors, minimalist vector graphics, professional adobe illustrator style"
  },
  {
    id: 'badge',
    name: 'Wappen / Badge',
    promptModifier: "circular badge logo, embroidery patch style, tactical emblem, shield shape, high detail, official team crest aesthetic"
  },
  {
    id: 'graffiti',
    name: 'Street Graffiti',
    promptModifier: "urban graffiti style, spray paint texture, wildstyle lettering, street art sticker, vibrant colors, with drip effects"
  },
  
  // --- 3D & MODERN ---
  {
    id: '3d-render',
    name: '3D Glossy',
    promptModifier: "3d blender render, glossy plastic material, cute toy aesthetic, isometric view, soft studio lighting, c4d style"
  },
  {
    id: 'holographic',
    name: 'Holografisch',
    promptModifier: "holographic sticker effect, iridescent colors, shiny metallic finish, prism texture, vaporwave aesthetic"
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    promptModifier: "cyberpunk aesthetic, glowing neon lines, dark futuristic background, glitch effect, high tech ui elements"
  },
  {
    id: 'y2k',
    name: 'Y2K Ästhetik',
    promptModifier: "Y2K aesthetic, year 2000 style, chrome liquid shapes, tribal tattoos, futuristic blobs, metallic silver and acid green"
  },

  // --- KÜNSTLERISCH ---
  {
    id: 'sketch',
    name: 'Bleistift Skizze',
    promptModifier: "hand-drawn pencil sketch, rough graphite lines, artistic shading, sketchbook style, white border"
  },
  {
    id: 'watercolor',
    name: 'Aquarell',
    promptModifier: "watercolor painting style, soft paint splashes, artistic dripping, pastel colors on white paper texture"
  },
  {
    id: 'oil-painting',
    name: 'Ölgemälde',
    promptModifier: "impasto oil painting style, thick visible brushstrokes, rich textures, classical art vibe"
  },
  {
    id: 'pop-art',
    name: 'Pop Art Comic',
    promptModifier: "pop art comic style, roy lichtenstein aesthetics, halftone dots, bold black outlines, vibrant primary colors, pow bang boom style"
  },
  {
    id: 'pixel',
    name: 'Pixel Art',
    promptModifier: "8-bit pixel art, retro video game sprite, limited color palette, blocky design, arcade aesthetic"
  },

  // --- ULTRAS & STREET ---
  {
    id: 'tattoo-trad',
    name: 'Tattoo Old School',
    promptModifier: "american traditional tattoo flash, bold black outlines, limited color palette (red, yellow, green, black), vintage sailor jerry style"
  },
  {
    id: 'stencil',
    name: 'Banksy Stencil',
    promptModifier: "stencil art style, banksy aesthetic, black spray paint on white, high contrast, political street art vibe"
  },
  {
    id: 'grunge',
    name: 'Dark Grunge',
    promptModifier: "dark grunge aesthetic, distressed textures, scratched metal, horror punk vibe, gloomy atmosphere"
  },
  {
    id: 'horror',
    name: 'Horror / Zombie',
    promptModifier: "horror style, zombie aesthetic, dripping slime, scary details, undead monster, spooky halloween vibe"
  },
  
  // --- MATERIAL & TEXTUR ---
  {
    id: 'embroidery',
    name: 'Gestickt / Patch',
    promptModifier: "embroidered patch texture, visible thread stitches, fabric texture, tactical velcro patch look"
  },
  {
    id: 'gold-foil',
    name: 'Goldfolie Luxus',
    promptModifier: "gold foil sticker, shiny metallic gold texture, luxury branding, premium black and gold contrast, elegant serif fonts"
  },
  {
    id: 'vintage-worn',
    name: 'Retro Abgenutzt',
    promptModifier: "vintage retro sticker, distressed texture, worn out look, faded colors, 70s advertising style, grunge edges"
  },
  {
    id: 'neon-sign',
    name: 'Leuchtreklame',
    promptModifier: "neon sign aesthetic, glowing glass tubes, night club vibe, brick wall background (isolated), electric colors"
  },

  // --- ABSTRAKT & SPECIAL ---
  {
    id: 'low-poly',
    name: 'Low Poly',
    promptModifier: "low poly art, geometric shapes, angular polygons, minimalist 3d style, crystalline structure"
  },
  {
    id: 'psychedelic',
    name: 'Psychedelisch',
    promptModifier: "psychedelic art, trippy swirling colors, optical illusions, 60s hippie poster style, vibrant acid colors"
  },
  {
    id: 'paper-cut',
    name: 'Papierkunst',
    promptModifier: "layered paper cutout art, paper craft style, subtle shadows between layers, craft aesthetic"
  },
  {
    id: 'blueprint',
    name: 'Blaupause',
    promptModifier: "technical blueprint style, white lines on blue background, architectural drawing, schematic details"
  },
  {
    id: 'kawaii',
    name: 'Kawaii Cute',
    promptModifier: "kawaii aesthetic, japanese cute mascot style, big eyes, pastel colors, bubbly round shapes, adorable die-cut sticker"
  },
  {
    id: 'black-metal',
    name: 'Black Metal',
    promptModifier: "black metal logo style, illegible spiky typography, roots and branches texture, dark satanic aesthetic, monochromatic black and white"
  },
  {
    id: 'synthwave',
    name: 'Synthwave 80s',
    promptModifier: "synthwave 80s aesthetic, retro sunset, grid landscape, chrome typography, purple and teal colors, outrun style"
  },
  {
    id: 'collage',
    name: 'Collage Mix',
    promptModifier: "mixed media collage, ransom note letters, ripped paper textures, chaotic composition, punk rock fanzine style"
  },
  {
    id: 'woodblock',
    name: 'Holzschnitt',
    promptModifier: "woodblock print style, linocut, rough carving textures, bold black ink, folk art aesthetic"
  },
  {
    id: 'clay',
    name: 'Knete / Clay',
    promptModifier: "plasticine claymation style, wallace and gromit aesthetic, fingerprint textures, stop motion look, soft lighting"
  }
];

export const TEMPLATES: StickerTemplate[] = [
  // ULTRAS / RED DEVILS
  {
    id: 'pyro',
    label: 'Pyro Fackel',
    category: 'Ultras',
    promptAddition: "holding a burning red bengal flare, thick red smoke billowing, aggressive atmosphere",
    icon: '🔥'
  },
  {
    id: 'megaphone',
    label: 'Megaphon',
    category: 'Ultras',
    promptAddition: "holding a megaphone, shouting ultras leader, dynamic pose",
    icon: '📢'
  },
  {
    id: 'drum',
    label: 'Trommel',
    category: 'Ultras',
    promptAddition: "beating a large stadium drum, ultras curve atmosphere",
    icon: '🥁'
  },
  {
    id: 'balaclava',
    label: 'Sturmhaube',
    category: 'Ultras',
    promptAddition: "wearing a tactical balaclava mask, anonymous aggressive look, street hooligan vibe",
    icon: '🥷'
  },
  {
    id: 'banner',
    label: 'Zaunfahne',
    category: 'Ultras',
    promptAddition: "large ultras banner hanging on fence, old german typography",
    icon: '🚩'
  },
  
  // STREET / HOODPLAKA
  {
    id: 'spraycan',
    label: 'Spraydose',
    category: 'Street',
    promptAddition: "holding a spray paint can, dripping paint nozzle, graffiti artist vibe",
    icon: '🥫'
  },
  {
    id: 'concrete',
    label: 'Beton Wand',
    category: 'Street',
    promptAddition: "cracked concrete wall background, urban decay texture, street corner",
    icon: '🧱'
  },
  {
    id: 'sneaker',
    label: 'Air Max',
    category: 'Street',
    promptAddition: "detailed fresh sneakers, nike air max style, streetwear fashion focus",
    icon: '👟'
  },
  {
    id: 'boombox',
    label: 'Ghettoblaster',
    category: 'Street',
    promptAddition: "retro 90s boombox ghettoblaster on shoulder, hip hop culture vibe",
    icon: '📻'
  },

  // ART & BASIC
  {
    id: 'skull',
    label: 'Totenkopf',
    category: 'Basic',
    promptAddition: "stylized skull emblem, ominous dark aesthetic",
    icon: '💀'
  },
  {
    id: 'laurel',
    label: 'Lorbeerkranz',
    category: 'Basic',
    promptAddition: "surrounded by a golden laurel wreath, victory emblem style",
    icon: '🌿'
  },
  {
    id: 'shield',
    label: 'Wappenschild',
    category: 'Basic',
    promptAddition: "classic heraldic shield shape background, medieval crest style",
    icon: '🛡️'
  },
  {
    id: 'wings',
    label: 'Engelsflügel',
    category: 'Art',
    promptAddition: "large spread angel wings in background, ethereal holy aura",
    icon: '🪽'
  },
  {
    id: 'drips',
    label: 'Paint Drips',
    category: 'Art',
    promptAddition: "heavy dripping paint effects, liquid slime texture melting down",
    icon: '💧'
  },
  {
    id: 'lightning',
    label: 'Blitze',
    category: 'Art',
    promptAddition: "electric lightning bolts surrounding the subject, high energy power",
    icon: '⚡'
  }
];
