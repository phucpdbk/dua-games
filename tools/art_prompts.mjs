// Mô tả từng hình cần tạo. refs: id các ảnh gốc (tools/raw) dùng làm mẫu phong cách.
const SPRITE = "Bright, cheerful 2D cartoon game art for a young children's side-scrolling adventure game, " +
  "thick clean dark-brown outlines, soft cel shading, rounded friendly shapes, vivid saturated colours. " +
  "Isolated on a perfectly flat pure white background that fills the whole image, no ground, no shadow, " +
  "no text, nothing cut off, generous margin around the subject.";
const SCENE = "Bright, cheerful 2D cartoon game art for a young children's side-scrolling adventure game, " +
  "soft painted look, clean shapes, vivid saturated colours, no characters, no text, no UI.";

const KJ = "games/key-jump/img";
const sprite = (prompt, extra = {}) => ({ prompt, style: SPRITE, ratio: "1:1", out: KJ, maxSize: 384, refs: ["hero"], ...extra });

const MONSTER = "A cute, funny (NOT scary) little monster for kids, full body, side view facing LEFT, standing on its feet, " +
  "big expressive eyes, mischievous grin. ";

export const PROMPTS = {
  hero: sprite("A cheerful little boy adventurer about 6 years old, full body, side view facing RIGHT, mid running pose " +
    "with one leg forward, wearing a bright orange cap, green t-shirt with a yellow star, blue shorts, red sneakers, " +
    "a small brown backpack, big happy smile, rosy cheeks.", { refs: [] }),
  hero_jump: sprite("The SAME boy as in the reference image (same face, orange cap, green star t-shirt, blue shorts, " +
    "red sneakers, backpack), full body, side view facing RIGHT, jumping high in the air, both arms raised up joyfully, " +
    "knees tucked, excited open-mouth smile."),
  hero_idle: sprite("The SAME boy as in the reference image (same face, orange cap, green star t-shirt, blue shorts, " +
    "red sneakers, backpack), full body, side view facing RIGHT, standing still on both feet, ready and curious, " +
    "one hand waving, friendly smile."),
  dua: sprite("A super cute cartoon pineapple mascot character with a happy smiling face, big sparkly eyes, rosy cheeks, " +
    "tiny arms waving hello and tiny feet, golden-yellow diamond-pattern body and a bright green leafy crown, " +
    "full body, front view.", { out: "assets", maxSize: 384 }),
  monster_slime: sprite(MONSTER + "A round wobbly purple slime blob with two tiny stubby feet and a little drip on its head."),
  monster_spiky: sprite(MONSTER + "A chubby red round hedgehog-like creature with soft orange spikes on its back and tiny paws."),
  monster_dino: sprite(MONSTER + "A small chubby green baby dinosaur with little horns, a round belly and short arms."),
  monster_fluff: sprite(MONSTER + "A fluffy round blue furball with two small horns, tiny feet and a big toothy grin."),
  monster_octo: sprite(MONSTER + "A pink jelly octopus standing on its curly tentacles, with a tiny crown of bubbles."),
  monster_rock: sprite(MONSTER + "A small round grey-brown rock golem with moss on its head and stubby legs."),
  coin: sprite("A shiny round gold coin with an embossed star in the middle, front view, glossy highlight.", { maxSize: 128 }),
  goal: sprite("A cute small cottage with a red roof, round window and wooden door, next to a tall flagpole with a " +
    "waving bright green flag with a yellow star, a few flowers at the base, front-side view.", { maxSize: 512 }),
  bg: {
    prompt: "Wide landscape background: bright blue sky with big fluffy white clouds, rolling green hills in the distance, " +
      "a few round cartoon trees and small bushes, gentle colours fading lighter toward the horizon. The bottom fifth is " +
      "an even, flat green meadow edge so ground can be placed over it. The left and right edges should look similar.",
    style: SCENE, ratio: "21:9", out: KJ, maxSize: 1920, cut: false, refs: ["hero"],
  },
  ground: {
    prompt: "Side-view cross-section strip of ground for a platform game, filling the ENTIRE image edge to edge: a lush " +
      "bright green grass layer along the very top edge with small blades and tiny flowers, then rich warm brown soil with " +
      "rounded pebbles and stones down to the bottom. Horizontally uniform so it can repeat.",
    style: SCENE, ratio: "21:9", out: KJ, maxSize: 1024, cut: "top", refs: ["hero"],
  },
};
