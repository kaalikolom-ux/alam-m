import fs from "node:fs";
import path from "node:path";

const articleId = "a1b2c3d4-e5f6-4789-0123-abcdef012345";
const slug = "ami-meyer-baba-hote-perechhi";
const categoryId = "555b556e-d5be-46be-bd97-16aa41828db8"; // স্মৃতিকথা
const authorId = "6a308470-2d8d-4cd8-996b-a96de32efdc2";
const publishedAt = "2026-11-25T13:58:00.000Z";

const titleBn = "আমি মেয়ের বাবা হতে পেরেছি";
const titleEn = "I Became a Father to a Daughter";
const excerptBn = "কুমিল্লা রেল স্টেশনে ট্রেনের সেই ইঞ্জিনিয়ারিং, উত্তরায় খাবার পৌঁছানো এবং এক গভীর মমতার সূচনা—যেখানে একটি ফুটফুটে মেয়ে খুঁজে পেয়েছিল তার বাবাকে, আর আমি পেয়েছিলাম এক রাজকন্যাকে।";
const excerptEn = "A heartwarming memoir of how a journey to Comilla and a simple act of care blossomed into an unconditional bond—where a little girl found her father, and I found my daughter.";

const contentBn = `<ul class="my-4 space-y-2 list-disc pl-6 text-foreground/90">
  <li>হ্যালো</li>
  <li>আংকেল, আপনি আমাদের সাথে যাবেন না।</li>
  <li>কেনো মা?</li>
  <li>আমার ভালো লাগবে না, তাই।</li>
  <li>ও আচ্ছা। তবে কি মা, ট্রেন তো অনেক লম্বা। আমি পেছনের দিকে যে কোনো একটা বগিতে করে ঢাকায় ফিরে যাবো। তুমি বুঝতেই পারবে না। ঠিক আছে, মা?</li>
  <li>আচ্ছা।</li>
</ul>

<p>বেলা ১১টা। আমার বান্ধবী ফোন দিলো—</p>

<ul class="my-4 space-y-2 list-disc pl-6 text-foreground/90">
  <li>আমি কুমিল্লা যাচ্ছি মেয়েকে আনতে, তুমি যাবে আমার সাথে?</li>
</ul>

<p>আমি রাজি হয়ে গেলাম। অফিস ফাঁকি! সায়েদাবাদ থেকে কুমিল্লা পৌঁছতে পৌঁছতে বেলা প্রায় আড়াইটে বেজে গেলো। ও মেয়ের বাবার কাছ থেকে মেয়েকে আনতে চলে গেলো। আর আমি কুমিল্লা রেল স্টেশনে পায়চারি করে সময় পার করে চলেছি। ঢাকায় ফেরবার ট্রেন বিকেল পাঁচটায়।</p>

<p>ওরা মা-মেয়ে স্টেশনে এলো। দেখা হলো, মেয়েটার সাথে কথা হলো না শুধু মুচকি হাসি বিনিময় ছাড়া। ট্রেন এসে পড়লো। বেশ ভিড়। ঠেলাঠেলি করে উঠে কোনো রকমে সিট জোগাড় করলাম। মেয়েকে আমার সাথেই বসতে হলো। এবার জানালাটা খোলার পালা এলো। অ্যালুমিনিয়ামের শাটারটার লক নষ্ট, তাই একেবারে তুলে খোলা রাখা যাচ্ছে না। ম্যাচের কাঠি দিয়ে ইঞ্জিনিয়ারিং করলাম। জানালা খোলা রাখতে সফল হলাম। সক্ষম হলাম মেয়েটার কাছে কিঞ্চিৎ হিরো হবার। মেয়ের কাছে বাবা তো হিরোই।</p>

<p>ঢাকায় ফিরতে ফিরতে রাত প্রায় নয়টা বেজে গেলো। উত্তরায় ওদের বাসায় পৌঁছে দিয়ে আমি আমার বাসায় ফিরে এলাম।</p>

<p>কয়েকদিন পর বন্ধুটি আমায় ফোন দিয়ে বললো যে দুপুরে বাসায় খাবার নিয়ে যেতে পারবো কি-না। মেয়েটা বাসায় একা। বলে রাখি, বন্ধুটি আমার চাকরি করে।</p>

<p>আমি তন্দুর রুটি আর মুরগীর গ্রিল নিয়ে বাসায় গেলাম। মেয়েটি তার এই হিরোকে দেখে লজ্জায় পড়ে গেলো মনে হলো। ঐ যে ট্রেনে একসাথে আসতে বারণ করেছিলো কি-না?</p>

<p>আমি নিজ হাতেই ওকে খাইয়ে দেবার সিদ্ধান্ত নিলাম। ও বড় বড় চোখে ড্যাবড্যাব করে তাকিয়ে আছে, খেয়ে যাচ্ছে আপত্তি না করেই...</p>

<p>সেই শুরু।</p>

<p>একদিন সন্ধ্যায় আমি আর আমার মেয়ে বসুন্ধরা সিটিতে ঘুরতে আসি। ফুডকোর্টে বসে আমি মা&#x27;কে আর মা আমাকে খাইয়ে দিচ্ছি। আশেপাশে এতো এতো মানুষ। কী এসে যায়? মেয়ে তার বাবা খুঁজে পেয়েছে, আমি মেয়ের বাবা হতে পেরেছি...</p>

<p class="mt-8 font-semibold text-primary">©আলম</p>`;

const contentEn = `<ul class="my-4 space-y-2 list-disc pl-6 text-foreground/90">
  <li>Hello</li>
  <li>Uncle, please don't come with us.</li>
  <li>Why, little mom?</li>
  <li>I won't feel good, that's why.</li>
  <li>Oh, I see. But you know, dear, the train is very long. I will sit in one of the rear carriages and head back to Dhaka. You won't even notice me. Alright, dear?</li>
  <li>Okay.</li>
</ul>

<p>It was 11 in the morning. My close friend called me—</p>

<ul class="my-4 space-y-2 list-disc pl-6 text-foreground/90">
  <li>I'm going to Comilla to bring my daughter back, will you come with me?</li>
</ul>

<p>I readily agreed. Skipping office! By the time we reached Comilla from Sayedabad, it was around half-past two. She went off to pick up her daughter from the girl's father. And I spent the time pacing up and down Comilla railway station. The return train to Dhaka was scheduled for 5:00 PM.</p>

<p>Eventually, the mother and daughter arrived at the station. We met, though nothing passed between the little girl and me other than a quiet, bashful exchange of smiles. The train arrived. It was quite crowded. Jostling through the rush, I somehow managed to secure seats. The little girl had to sit right next to me. Then came the challenge of opening the window. The lock on the aluminium shutter was broken, refusing to stay propped open. I did a bit of quick engineering with a matchstick and successfully kept the window open. And in doing so, I managed to become a bit of a hero in her eyes. To a daughter, isn't a father always a hero?</p>

<p>By the time we got back to Dhaka, it was nearly nine at night. After dropping them safely at their Uttara residence, I headed back home.</p>

<p>A few days later, my friend called to ask if I could drop off some lunch at her place. The little girl was home alone, as my friend works during the day.</p>

<p>I bought tandoori rotis and grilled chicken and went over. Seeing her "hero" arrive, the little girl seemed a bit shy and embarrassed. Perhaps she remembered telling me not to travel with them on the train!</p>

<p>I decided to feed her with my own hands. She looked at me with wide, innocent eyes, eating quietly without the slightest protest...</p>

<p>That was how it began.</p>

<p>One evening, my daughter and I went hanging out at Bashundhara City. Sitting at the food court, I was feeding my little mom, and she was feeding me in return. All around us, so many people buzzed by. But what did that matter? A daughter had found her father, and I had become a father to a daughter...</p>

<p class="mt-8 font-semibold text-primary">©Alam</p>`;

// 1. Generate SQL migration file
const escapeSql = (str) => (str ? str.replace(/'/g, "''") : "");

const sqlContent = `INSERT OR REPLACE INTO articles (
  id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, author_id, created_at, updated_at
) VALUES (
  '${articleId}',
  '${escapeSql(slug)}',
  '${escapeSql(titleBn)}',
  '${escapeSql(titleEn)}',
  '${escapeSql(excerptBn)}',
  '${escapeSql(excerptEn)}',
  '${escapeSql(contentBn)}',
  '${escapeSql(contentEn)}',
  NULL,
  1,
  '${publishedAt}',
  '${authorId}',
  datetime('now'),
  datetime('now')
);

INSERT OR REPLACE INTO article_categories (article_id, category_id)
VALUES ('${articleId}', '${categoryId}');
`;

fs.writeFileSync("scripts/insert-memoir.sql", sqlContent, { encoding: "utf8" });
console.log("Wrote scripts/insert-memoir.sql successfully");

// 2. Update seed-data.ts
const seedDataPath = path.resolve("src/integrations/d1/seed-data.ts");
let seedData = fs.readFileSync(seedDataPath, "utf8");

const newArticleObj = {
  id: articleId,
  slug,
  title_bn: titleBn,
  title_en: titleEn,
  excerpt_bn: excerptBn,
  excerpt_en: excerptEn,
  content_bn: contentBn,
  content_en: contentEn,
  cover_image_url: null,
  published: 1,
  published_at: publishedAt,
  author_id: authorId,
};

// Check if article already in seedData
if (!seedData.includes(`"slug": "${slug}"`)) {
  const articlesMarker = '"articles": [';
  const newArticleJson = "\n    " + JSON.stringify(newArticleObj, null, 6).slice(0, -1) + "    },";
  seedData = seedData.replace(articlesMarker, articlesMarker + newArticleJson);

  const categoriesMarker = '"article_categories": [';
  const newCatRel = `\n    {\n      "article_id": "${articleId}",\n      "category_id": "${categoryId}"\n    },`;
  seedData = seedData.replace(categoriesMarker, categoriesMarker + newCatRel);

  fs.writeFileSync(seedDataPath, seedData, { encoding: "utf8" });
  console.log("Updated src/integrations/d1/seed-data.ts");
} else {
  console.log("seed-data.ts already contains article");
}

// 3. Update staticArticlesMeta.ts
const metaPath = path.resolve("src/lib/staticArticlesMeta.ts");
let metaData = fs.readFileSync(metaPath, "utf8");

const newMetaObj = {
  id: articleId,
  slug,
  title_bn: titleBn,
  title_en: titleEn,
  excerpt_bn: excerptBn,
  excerpt_en: excerptEn,
  cover_image_url: null,
  published: 1,
  published_at: publishedAt,
  created_at: publishedAt,
  author_name_bn: "আলম",
  author_name_en: "Alam",
  category_name_bn: "স্মৃতিকথা",
  category_name_en: "Memoir",
  category_slug: "smritikotha",
};

if (!metaData.includes(`"slug": "${slug}"`)) {
  const metaMarker = "export const STATIC_ARTICLES_META = [";
  const newMetaJson = "\n  " + JSON.stringify(newMetaObj, null, 4).slice(0, -1) + "  },";
  metaData = metaData.replace(metaMarker, metaMarker + newMetaJson);

  fs.writeFileSync(metaPath, metaData, { encoding: "utf8" });
  console.log("Updated src/lib/staticArticlesMeta.ts");
} else {
  console.log("staticArticlesMeta.ts already contains article");
}
