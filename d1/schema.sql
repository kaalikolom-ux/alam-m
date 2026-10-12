-- Cloudflare D1 (SQLite) Schema & Seed Data for Alam M (alam-m)
-- Database ID: addf217c-a0a6-4ffe-83b9-3d945a1091cb

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name_bn TEXT NOT NULL,
  name_en TEXT,
  image_url TEXT,
  bio_bn TEXT,
  bio_en TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_bn TEXT NOT NULL,
  name_en TEXT,
  description_bn TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_bn TEXT NOT NULL,
  title_en TEXT,
  excerpt_bn TEXT,
  excerpt_en TEXT,
  content_bn TEXT,
  content_en TEXT,
  cover_image_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_by TEXT,
  author_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS article_categories (
  article_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_bn TEXT NOT NULL,
  title_en TEXT,
  content_bn TEXT,
  content_en TEXT,
  cover_image_url TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  label_bn TEXT NOT NULL,
  label_en TEXT,
  url TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'header',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  footer_about_bn TEXT,
  footer_about_en TEXT,
  footer_copyright_bn TEXT,
  footer_copyright_en TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'article',
  surah INTEGER,
  ayah INTEGER,
  article_id TEXT,
  label TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verse_translations (
  id TEXT PRIMARY KEY,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (surah, ayah, lang)
);

-- Seed Data
INSERT OR IGNORE INTO authors (id, name_bn, name_en, image_url, bio_bn, bio_en, created_at, updated_at) VALUES ('6a308470-2d8d-4cd8-996b-a96de32efdc2', 'আলম এম.', 'Alam M', 'https://res.cloudinary.com/avz813un/image/upload/v1786324388/me.jpg', 'আমি আলম | শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি জীবনের ভাবনা।', 'I''m Alam | Words are my canvas, stories my colors; painting life’s thoughts through the art of writing.', '2026-08-12T03:29:45.888542+00:00', '2026-08-12T03:29:45.888542+00:00');
INSERT OR IGNORE INTO categories (id, slug, name_bn, name_en, description_bn, created_at, updated_at) VALUES ('0b772921-f656-483b-9f0d-664ebabede53', 'golpo', 'গল্প', 'Stories', NULL, '2026-08-11T20:13:52.373907+00:00', '2026-08-11T20:13:52.373907+00:00');
INSERT OR IGNORE INTO categories (id, slug, name_bn, name_en, description_bn, created_at, updated_at) VALUES ('fa17b7b2-a53b-4d67-b2bb-3828971b72ba', 'kobita', 'কবিতা', 'Poetry', NULL, '2026-08-11T20:13:52.373907+00:00', '2026-08-11T20:13:52.373907+00:00');
INSERT OR IGNORE INTO categories (id, slug, name_bn, name_en, description_bn, created_at, updated_at) VALUES ('813fce33-61d3-4279-9b16-67388071e994', 'provondho', 'প্রবন্ধ', 'Essays', NULL, '2026-08-11T20:13:52.373907+00:00', '2026-08-11T20:13:52.373907+00:00');
INSERT OR IGNORE INTO categories (id, slug, name_bn, name_en, description_bn, created_at, updated_at) VALUES ('b88b59ae-da8d-4036-9465-19db028f1f9d', 'dharabahik', 'ধারাবাহিক', NULL, NULL, '2026-08-12T03:40:37.656235+00:00', '2026-08-12T03:40:37.656235+00:00');
INSERT OR IGNORE INTO categories (id, slug, name_bn, name_en, description_bn, created_at, updated_at) VALUES ('555b556e-d5be-46be-bd97-16aa41828db8', 'smritikotha', 'স্মৃতিকথা', NULL, NULL, '2026-08-12T03:41:05.987907+00:00', '2026-08-12T03:41:05.987907+00:00');
INSERT OR IGNORE INTO articles (id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, created_by, author_id, created_at, updated_at) VALUES ('e494d481-876f-4e23-8ce7-608cc055857b', 'osomapto-kobitar-chorone', 'অসমাপ্ত কবিতার চরনে', NULL, NULL, NULL, 'হারানোটা সুনিশ্চিত হবার পরই যেন
পাবার আকুতি জাগে মনে -
শেষ দরজাটা বন্ধ হতেই
মনে পড়ে যায়
ভিতরে ফেলে আসা সব কালোর আলো।

তখন হাত বাড়াই,
যখন ধরার মতো আর কিছুই থাকে না!
কেন বুক ভরে ওঠে ডাকের শব্দে? যখন
শোনার মতো কেউ থাকে না?

স্মৃতিগুলো ধাওয়া করে -
নিঃশব্দ পায়ে, তবু প্রবল শব্দে!
রাতের অন্ধকারে এসে বসে থাকে -
চোখের পাতার ভাঁজে ভাঁজে 

সময়কে কেন একটু পেছনে ফেরানো যায় না -
একটুখানি, শুধু কয়েকটা দিন?
যেখানে তুমি ছিলে, আর আমি ছিলাম।

নিয়ম:
পাওয়ার সময় আমরা অন্ধ থাকি,
আর হারানোর পরই
স্মৃতিগুলো সব স্পষ্ট হয়ে আঙিনা বাড়ায় 
মন মানে না,
বারবার ফিরে যেতে চায়
সেই এক বিন্দুতে -
যেখানে ভুলটা হয়েছিল নীরবে।

কিন্তু সময়…
সে তো কারো জন্য থামে না,
শুধু ফেলে যায় পানের খিলের পিক,
খুনসুটি
আর কিছু অনন্ত, অসমাপ্ত আকুতি
বুনতে থাকে -
অসমাপ্ত কবিতার চরনে

©আলম - ১৭ এপ্রিল ২০২৬ইং, সকাল ৮টা ১১মি.', NULL, NULL, 1, '2026-08-12T03:33:40.012+00:00', NULL, '6a308470-2d8d-4cd8-996b-a96de32efdc2', '2026-08-12T03:33:44.4251+00:00', '2026-08-19T14:23:11.189955+00:00');
INSERT OR IGNORE INTO articles (id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, created_by, author_id, created_at, updated_at) VALUES ('cd4c4604-800b-4d6c-b153-7d1d6eb31186', 'kobita-jokhon-klanto-hoye-dekhe', 'কবিতা যখন ক্লান্ত হয়ে দেখে', NULL, NULL, NULL, '<div class="xdj266r x14z9mp xat24cr x1lziwak x1vvkbs x126k92a" style="white-space: pre-wrap; margin-inline: 0px; overflow-wrap: break-word; font-family: &quot;Segoe UI Historic&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif; color: rgb(8, 8, 9); background-color: rgb(255, 255, 255);"><div dir="auto" style="font-family: inherit;">কবিতা যখন ক্লান্ত হয়ে দেখে</div><div dir="auto" style="font-family: inherit;">কলমের কালি শুকিয়ে যায়,</div><div dir="auto" style="font-family: inherit;">শব্দেরা একে একে গুটিয়ে বসে থাকে</div><div dir="auto" style="font-family: inherit;">পাতার কোণে,</div><div dir="auto" style="font-family: inherit;">তখনই নায়িকা আসে-</div><div dir="auto" style="font-family: inherit;">হাতের মুঠোয় ধরা নরম এক ফুলসহ</div><div dir="auto" style="font-family: inherit;">রোদ্দুরের হলুদ পোশাকে!</div></div><div class="x14z9mp xat24cr x1lziwak x1vvkbs xtlvy1s x126k92a" style="white-space: pre-wrap; margin-inline: 0px; overflow-wrap: break-word; margin-top: 0.5em; font-family: &quot;Segoe UI Historic&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif; color: rgb(8, 8, 9); background-color: rgb(255, 255, 255);"><div dir="auto" style="font-family: inherit;">সে হেসে বলে,</div><div dir="auto" style="font-family: inherit;">"কোনো ছুটি মঞ্জুর হবে না,</div><div dir="auto" style="font-family: inherit;">তুমি লিখবে-</div><div dir="auto" style="font-family: inherit;">কারণ আমার হাসি,</div><div dir="auto" style="font-family: inherit;">আমার গল্প,</div><div dir="auto" style="font-family: inherit;">আমার এই উজ্জ্বল পাপড়ি</div><div dir="auto" style="font-family: inherit;">তোমার কবিতায়ই বাঁচবে।"</div></div><div class="x14z9mp xat24cr x1lziwak x1vvkbs xtlvy1s x126k92a" style="white-space: pre-wrap; margin-inline: 0px; overflow-wrap: break-word; margin-top: 0.5em; font-family: &quot;Segoe UI Historic&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif; color: rgb(8, 8, 9); background-color: rgb(255, 255, 255);"><div dir="auto" style="font-family: inherit;">তার চোখে থাকে সকালবেলার আকাশ,</div><div dir="auto" style="font-family: inherit;">তার কণ্ঠে থাকে বাতাসের মৃদু সুর,</div><div dir="auto" style="font-family: inherit;">আর আমি বুঝি-</div><div dir="auto" style="font-family: inherit;">কবিতা তো ক্লান্ত হয় না,</div><div dir="auto" style="font-family: inherit;">শুধু কখনো কখনো</div><div dir="auto" style="font-family: inherit;">নতুন রঙের অপেক্ষায় থাকে।</div></div><div class="x14z9mp xat24cr x1lziwak x1vvkbs xtlvy1s x126k92a" style="white-space: pre-wrap; margin-inline: 0px; overflow-wrap: break-word; margin-top: 0.5em; font-family: &quot;Segoe UI Historic&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif; color: rgb(8, 8, 9); background-color: rgb(255, 255, 255);"><div dir="auto" style="font-family: inherit;">আজ এই হলুদ ফুলের মতো</div><div dir="auto" style="font-family: inherit;">সে আমায় রঙ দিল, ঘ্রাণ দিল,</div><div dir="auto" style="font-family: inherit;">আর আমি কলম তুলেই লিখতে শুরু করলাম-</div><div dir="auto" style="font-family: inherit;">তার নাম, তার ছায়া,</div><div dir="auto" style="font-family: inherit;">তার হাতের মুঠোয় ধরা এই অনন্ত বসন্তের কথা।</div></div><div class="x14z9mp xat24cr x1lziwak x1vvkbs xtlvy1s x126k92a" style="white-space: pre-wrap; margin-inline: 0px; overflow-wrap: break-word; margin-top: 0.5em; font-family: &quot;Segoe UI Historic&quot;, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif; color: rgb(8, 8, 9); background-color: rgb(255, 255, 255);"><div dir="auto" style="font-family: inherit;">© আলম - ১৫ আগষ্ট ২৯২৫ইং, রাত ১১টা</div><div dir="auto" style="font-family: inherit;">স্থান: ছেলের শশুর বাড়ি, কুলিয়ার চর, কিশোরগঞ্জ।</div></div>', NULL, NULL, 1, '2026-08-19T17:27:48.087+00:00', '3442b3b8-a20b-4c4a-9978-1e4815381806', '6a308470-2d8d-4cd8-996b-a96de32efdc2', '2026-08-19T17:27:52.670816+00:00', '2026-08-19T17:27:52.670816+00:00');
INSERT OR IGNORE INTO articles (id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, created_by, author_id, created_at, updated_at) VALUES ('442b340f-45e8-4cd6-81c3-69a838c28cc2', 'odressho-tthikana', 'অদৃশ্য ঠিকানা', NULL, NULL, NULL, 'তোমাকে হারানোর গল্পটা বহু পুরোনো,
কিন্তু হারিয়ে যাওয়া মানেই
মুছে যাওয়া নয়—
সেটা আমি এতদিনে শিখেছি।

দিন বদলেছে,
ঋতুরা কতবার এসে ফিরে গেছে,
জানালার পাশে দাঁড়ানো বিকেলগুলোও
অন্য রঙে রঙিন হয়েছে,
তবু কোনো এক নির্জন মুহূর্তে
তোমার ছায়া এসে বসে
আমার ভাবনার পাশে।

আমি তোমাকে ডাকি না,
তোমার জন্য অপেক্ষার প্রদীপও জ্বালি না,
তবু হঠাৎ কোনো গান,
কোনো গন্ধ,
কিংবা অকারণ বিষণ্ণ এক সন্ধ্যা
তোমার নাম না বলেও
তোমার কাছেই পৌঁছে দেয় আমাকে।

আমাদের মাঝখানে এখন
অনেক না-বলা বছর,
অনেক দূরত্ব,
অনেক নীরবতা জমে আছে।
তবু মনের গভীরে
একটি দরজা আজও খোলা,
যেখানে সময়ের প্রবেশাধিকার নেই।

সেখানে তুমি আছো—
পুরোনো কোনো সম্পর্ক হয়ে নয়,
বরং এমন এক অনুভূতি হয়ে,
যার কোনো সংজ্ঞা নেই,
কোনো দাবি নেই,
শুধু আছে এক অদ্ভুত উপস্থিতি।

হয়তো এটাই ভালোবাসার শেষ রূপ,
যেখানে কাছে পাওয়ার আকাঙ্ক্ষা থাকে না,
কিন্তু ভুলে যাওয়ার ক্ষমতাও জন্মায় না।

© আলম - ১৯ জুন ২০২৬ইং শুক্রবার, ১২টা ৩৬ মিনিট।', NULL, NULL, 1, '2026-08-29T02:26:25.685+00:00', '3442b3b8-a20b-4c4a-9978-1e4815381806', '6a308470-2d8d-4cd8-996b-a96de32efdc2', '2026-08-20T04:35:59.51271+00:00', '2026-08-29T02:26:26.266537+00:00');
INSERT OR IGNORE INTO articles (id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, created_by, author_id, created_at, updated_at) VALUES ('163c5463-71a3-4ca7-a07f-7d364c3c9dce', 'option-ami-noi', 'অপশন নই আমি', NULL, NULL, NULL, '<div>যখন কেউ তোমায়</div><div>শুধু একটি অপশন ভেবে রাখে,</div><div>উত্তরটা খুব সহজ-</div><div>চলে যাও।</div><div><br></div><div>ভিক্ষা কোরো না,</div><div>পেছনে ছুটো না,</div><div>যে চোখ তোমার মূল্য দেখেনি,</div><div>তার সামনে নিজের আলো প্রমাণ করতে যেও না।</div><div><br></div><div>মানুষের আচরণ</div><div>তুমি বদলাতে পারবে না;</div><div>কিন্তু নিজের পথ বেছে নেওয়ার অধিকার</div><div>সবসময় তোমারই।</div><div><br></div><div>মাথা উঁচু করে,</div><div>নিঃশব্দ মর্যাদায়</div><div>যখন তুমি ফিরে দাঁড়াও,</div><div>তখনই পৃথিবী শেখে-</div><div>কীভাবে তোমার সঙ্গে আচরণ করতে হয়।</div><div><br></div><div>যখন কোনো ব্যাখ্যা না দিয়েই</div><div>তুমি বিদায় বলো,</div><div>তখনই প্রকাশ পায়-</div><div>তুমি নিজের মূল্য জানো।</div><div><br></div><div>যখন নিজের শক্তিকে</div><div>কারও দয়ার কাছে সমর্পণ করো না,</div><div>সেই শক্তিই</div><div>তোমাকে নিয়ে যায় আরও সুন্দর ঠিকানায়,</div><div>আরও নির্মল মানুষের কাছে,</div><div>আরও উজ্জ্বল আগামীতে।</div><div><br></div><div>তাই যারা তোমায়</div><div>শুধু একটি বিকল্প ভেবে রাখে,</div><div>তাদের পেছনে</div><div>তোমার সময়, শক্তি, হৃদয় নষ্ট কোরো না।</div><div><br></div><div>তুমি কোনো ব্যাকআপ পরিকল্পনা নও,</div><div>তুমি কোনো দ্বিতীয় পছন্দ নও।</div><div><br></div><div>তুমি সেই মানুষ,</div><div>যাকে সম্পূর্ণভাবে বেছে নেওয়া উচিত,</div><div>নিঃস্বার্থভাবে ভালোবাসা উচিত,</div><div>এবং সর্বদা সম্মান করা উচিত।</div><div><br></div><div>তাই চলে যাও-</div><div>শক্তি সঙ্গে নিয়ে,</div><div>শান্তি সঙ্গে নিয়ে,</div><div>আর সবচেয়ে বড় কথা,</div><div>নিজের কাছেই ফিরে যাও।</div><div><br></div><div>NB: একটি ইংরেজি short video অবলম্বনে লেখা। ভিডিওটি কমেন্টে দেয়া হলো।</div>', NULL, NULL, 1, '2026-08-19T22:15:49.528+00:00', '3442b3b8-a20b-4c4a-9978-1e4815381806', NULL, '2026-08-19T22:15:50.491725+00:00', '2026-08-19T22:15:50.491725+00:00');
INSERT OR IGNORE INTO articles (id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, created_by, author_id, created_at, updated_at) VALUES ('240ca110-56e6-4cb2-8483-b5cba79d6def', 'be-careful', 'ডুব সাঁতার', 'Be Careful', NULL, NULL, '<div class="x14z9mp xat24cr x1lziwak x1vvkbs xtlvy1s x126k92a" data-original-attrs="{&quot;style&quot;:&quot;&quot;}" style="background-color: white; margin-inline: 0px; margin-top: 0.5em; overflow-wrap: break-word;"><div data-original-attrs="{&quot;style&quot;:&quot;&quot;}" dir="auto" style=""><font color="#080809" face="Segoe UI Historic, Segoe UI, Helvetica, Arial, sans-serif"><span style="white-space-collapse: preserve;">রাত তখন সাড়ে এগারোটা। ল্যাপটপ বন্ধ করে আরিয়ান ফোন হাতে নিয়ে ফেসবুকে ঢুকলো। ইনবক্সে নতুন নোটিফিকেশন। অচেনা নাম—নায়লা।

প্রথম মেসেজটা পড়েই বুকটা ধড়াস করে উঠলো—

"চলেন দেখা করি, চা খাই। প্রেম হলে হলো, না হলে নাই।"

আরিয়ান হেসে ফেললো। মেয়েটা অচেনা হলেও মেসেজে দারুণ সাহস।

সে জবাব দিলো—

"এত রাতে? একটু চটজলদি হয়ে গেলো না?"

নায়লা তৎক্ষণাৎ লিখলো—

"হুট করেই তো মজাটা বেশি হয়।"

এরপর শুরু হলো ছোট ছোট কথোপকথন। রাত গড়িয়ে গেলেও নায়লার বার্তা আসতেই থাকলো।

কখনো সে মজার ছলে লিখছে—

"ঘুমাচ্ছেন না কেন এখনো? কি করছেন এত রাত জেগে?"

কখনো হালকা ইমোজি যোগ করছে—উইঙ্ক, হার্ট, হাসি।

ধীরে ধীরে ইনবক্স থেকে গল্প গড়াল ভিডিও কলে। প্রথম কলেই নায়লা আধো অন্ধকার ঘরে, ঢিলে নাইটি পরে হাজির। আরিয়ানের দৃষ্টি আটকে গেলো নাইটির ফাঁক গলে যেখানে বুকের ভাঁজ ঝলকাচ্ছিল।

নায়লা চুল খোলা রেখে হাসি মেখে বললো—

"দেখছো তো? এত রাতে জেগে থাকার পুরস্কার।"

প্রথম কলেই রোমান্টিক ইঙ্গিত, একটু দুষ্টুমি খুনসুটি। আরিয়ানের মনে হল সে যেন স্বপ্নে ঢুকে পড়েছে। কলের শেষে নায়লা ক্যামেরার দিকে হালকা ঝুঁকে ফ্লাইং কিস ছুঁড়ে দিলো। বুকের ভাঁজে আগুন!

এভাবেই দিন কেটে যেতে লাগলো। কখনো লাজুক ইশারা, কখনো মিষ্টি অভিমান—কিন্তু প্রতিটি রাতে যেন আবেশে ডুবে থাকতো দুজন। আরিয়ানের কাছে রাত মানেই এখন নায়লা।

কয়েক সপ্তাহ এমন চলার পর এক রাতে নায়লা ফিসফিস করে বললো—

"জানো, আমার হাসবেন্ড অফিসের ট্যুরে দেশের বাইরে যাচ্ছে। পুরো এক সপ্তাহ আমি একা।"

আরিয়ান চমকে উঠলো—

"তুমি… বিবাহিতা?"

নায়লা মৃদু হেসে বললো—

"এখন জেনে কি লাভ? এতদিন জানোনি তো কোনো অসুবিধা হয়নি। তুমি শুধু ভাবো আমি তোমার।"

এরপর নায়লা মোহাবিষ্ট কণ্ঠে বললো—

"ভিডিও কলে তো সবই দেখেছো। এবার ছুঁয়ে দেখবে, আদর করবে। আমি তোমার জন্য লাল সেট রেখেছি। তুমি খুলে খুলে আমায় আবিষ্কার করবে। তবে মনে রেখো, আমি কামড়াবো, তুমি পারবে না। তুমি শুধু আদরে ভরিয়ে দেবে। পারবে তো?"

আরিয়ান মাথা নাড়লো। সন্দেহ বা ভয়কে দূরে ঠেলে দিয়ে তার চোখে ভাসলো কেবল এক প্রলোভনের পৃথিবী।

অবশেষে দিন এল। সকালে কলিং বেল। কাজের বুয়া এসেছে। নায়লা সোজা বলে দিলো—

"আজকে কাজ করতে হবেনা। আমি নিজেই করবো।"

দিনের পর দিন চললো তাদের ডুব সাঁতার—রোমান্টিকতা আর নেশার মিশ্রণে। ভিডিও কলে একে অপরকে ছুঁয়ে দেখা, রঙিন কথা, হাসি-ঠাট্টা। বিকেলে আরিয়ান কল দিলে নায়লা তাকে আরও উস্কে দিতো।

একদিন সন্ধ্যায় নায়লা হঠাৎ আরিয়ানের মেসেঞ্জারে একটা ভিডিও ক্লিপ পাঠালো। সেখানে দেখা গেল তাদের আগের রাতের অন্তরঙ্গ মুহূর্ত।

আরিয়ান এক মুহূর্তের জন্যও খেয়াল করলো না, এতটা ব্যক্তিগত ভিডিও আসলো কীভাবে। তার মাথা তখন শুধু একটাই—আবার ডুব দিতে হবে। রাতে সে ছুটলো নায়লার বাসায়।

এভাবেই কয়েকদিন ধরে চললো। আরিয়ান বুঝতেই পারলো না—সবকিছুই গোপন ক্যামেরায় রেকর্ড হচ্ছে।

এক সপ্তাহ পর নায়লা জানালো—

"আমার হাসবেন্ড ফিরে এসেছে।"

এরপর আর আগের মতো ঘন ঘন ভিডিও কল নয়। মাঝে মাঝে মাত্র এক মিনিটের জন্য নায়লা অনলাইনে এসে ফ্লাইং কিস ছুঁড়ে দিতো, তারপর মিলিয়ে যেতো।

কিন্তু ততদিনে আরিয়ান আসক্ত। সে ডুব সাঁতার ছাড়া থাকতে পারে না। নায়লা তখন নতুন প্রস্তাব দিলো—

"তুমি একটা ৫-স্টার হোটেলে রুম বুক করো। আমি সকালে চলে আসবো। সারাদিন একসাথে থাকবো। তুমি তোমার মতো মজা করবে।"

আরিয়ান দুই দিন পর রুম বুক করলো। মেসেজে লিখলো—

"হোটেল ইন্টারকন্টিনেন্টাল, রুম ৩০৩।"

সকালবেলা দরজায় নক হলো। দরজা খুলতেই আরিয়ান স্তম্ভিত। নায়লা এসেছে, তবে সঙ্গে আরেকজন পুরুষ।

আরিয়ানের চোখ কপালে উঠে গেলো।

"এটা কি হচ্ছে?"

নায়লা ঠান্ডা হাসি দিয়ে একটা পেনড্রাইভ এগিয়ে দিলো।

"ল্যাপটপে চালাও।"

কাঁপতে থাকা হাতে আরিয়ান ভিডিও চালালো। পর্দায় ভেসে উঠলো তার আর নায়লার গোপন মুহূর্তগুলো—প্রতি সেকেন্ড ক্যামেরাবন্দী।

রুমের নিস্তব্ধতায় আরিয়ানের বুক ধড়ফড় করতে লাগলো। কিছুক্ষণ পর নিজেই চুপচাপ বললো—

"কত টাকা চাও?"

নায়লা ঠোঁট বাঁকিয়ে হেসে বললো—

"টাকা নয়। যখন ডাকবো, কলে আসবে। মজা নেবে, আর সোনার ডিম পাড়বে। আমাদের খেলা এখনো শেষ হয়নি।"

আরিয়ান চুপচাপ বসে রইলো। চোখের সামনে হঠাৎ ভেসে উঠলো সেই প্রথম মেসেজ—

"চলেন দেখা করি, চা খাই। প্রেম হলে হলো, না হলে নাই।"

তখনই সে বুঝলো—প্রেম ছিল না কোথাও, সবকিছুই ছিল নিখুঁতভাবে সাজানো এক ফাঁদ। রোমান্সের আবরণে আসক্তি, আসক্তির আড়ালে ব্ল্যাকমেইল। নায়লার প্রতিটি হাসি, প্রতিটি ইঙ্গিত ছিল পরিকল্পনার অংশ। আরিয়ানের কাছে রাতগুলো স্বপ্নের মতো মনে হলেও সেগুলোই হয়ে উঠলো দুঃস্বপ্ন।

ফ্লাইং কিসের মোহ, নাইটির ঝলক আর ডুব সাঁতারের নেশা—সব মিলিয়ে এক ভয়ংকর পরিণতির দিকে ঠেলে দিলো তাকে।

শেষ পর্যন্ত প্রেম নয়, প্রলোভনই জয়ী হলো আর আরিয়ান রয়ে গেলো অন্ধকার ব্ল্যাকমেইলের বন্দি।

©আলম - ৩০ সেপ্টেম্বর ২০২৫ইং, রাত ১২টা।</span></font></div></div>', '<div>It was half past eleven at night.</div><div><br></div><div>Ariyan closed his laptop. Picked up his phone. Opened Facebook.</div><div><br></div><div>And there it was—a message from a name he''d never seen before. Nayla.</div><div><br></div><div>He clicked it. Read the first line. And his heart just… stopped.</div><div><br></div><div>"Let''s meet up. Grab some tea. If it happens, it happens. If not, no big deal."</div><div><br></div><div>He laughed. A stranger. But bold. Really bold.</div><div><br></div><div>So he typed back—</div><div><br></div><div>"At this hour? Isn''t that a little sudden?"</div><div><br></div><div>Her reply came in seconds—</div><div><br></div><div>"That''s the whole point. Spontaneity."</div><div><br></div><div>And just like that, the night came alive.</div><div><br></div><div>Text after text. Wink after wink. Heart after heart. She knew exactly what to say, exactly when to say it.</div><div><br></div><div>Soon, messages weren''t enough. They moved to video calls.</div><div><br></div><div>The first time he saw her—dim room, loose nightie, hair falling over her shoulders—he forgot how to breathe.</div><div><br></div><div>She smiled. Slow. Dangerous.</div><div><br></div><div>"See?" she said. "This is what happens when you stay up."</div><div><br></div><div>And then—a flying kiss. Straight through the screen. And something inside Ariyan… caught fire.</div><div><br></div><div>Days turned into weeks. Every night was hers. Sometimes shy, sometimes playful, always addictive. For Ariyan, night stopped meaning sleep. It meant Nayla.</div><div><br></div><div>Then one night, she whispered something that should''ve been a warning—</div><div><br></div><div>"My husband''s going abroad. Whole week. I''ll be all alone."</div><div><br></div><div>He froze.</div><div><br></div><div>"You''re… married?"</div><div><br></div><div>She just smiled.</div><div><br></div><div>"Does it matter now? You didn''t ask before. Just think of me as yours."</div><div><br></div><div>And then her voice dropped. Low. Smooth. Lethal.</div><div><br></div><div>"You''ve seen everything on screen. Now it''s time to feel. I''ve got a red set waiting. You''ll unwrap me. Discover me. But I''ll bite—and you won''t last. You''ll just hold me, drown me in love. Can you do that?"</div><div><br></div><div>Ariyan nodded. Didn''t think twice. Didn''t want to.</div><div><br></div><div>Temptation had already won.</div><div><br></div><div>The day came. Morning. Doorbell. The maid.</div><div><br></div><div>Nayla waved her off—</div><div><br></div><div>"Not today. I''ll handle it."</div><div><br></div><div>And so it went. Day after day. Calls. Laughter. Heat. Every afternoon, he''d call—and she''d turn the temperature up.</div><div><br></div><div>Then one evening, she sent him a video.</div><div><br></div><div>A clip from their night before. Intimate. Private. Recorded.</div><div><br></div><div>And Ariyan? He didn''t even pause to ask how. His mind was already gone. All he wanted was more. That night, he ran to her place.</div><div><br></div><div>He never noticed the cameras. Never saw the trap closing in.</div><div><br></div><div>A week later, she said—</div><div><br></div><div>"My husband''s back."</div><div><br></div><div>The calls stopped. She''d pop online for a minute, blow a kiss, and vanish.</div><div><br></div><div>But Ariyan was already hooked. He couldn''t go back. Couldn''t stop.</div><div><br></div><div>That''s when she made her move.</div><div><br></div><div>"Book a five-star hotel. I''ll come in the morning. We''ll have all day. Your way. Your fun."</div><div><br></div><div>Two days later, he booked it. Texted her the details.</div><div><br></div><div>"Intercontinental. Room 303."</div><div><br></div><div>Morning. Knock on the door.</div><div><br></div><div>He opened it—and his world cracked.</div><div><br></div><div>Nayla was there. But so was someone else. A man. Standing right behind her.</div><div><br></div><div>Ariyan''s voice broke—</div><div><br></div><div>"What… what is this?"</div><div><br></div><div>Nayla smiled. Cold. Flat. And handed him a pendrive.</div><div><br></div><div>"Plug it in."</div><div><br></div><div>His hands were shaking. He played the video.</div><div><br></div><div>And there it was. Every moment. Every touch. Every secret. Captured. Clean. Clear.</div><div><br></div><div>Silence.</div><div><br></div><div>His heart pounded so loud he could hear it in his ears.</div><div><br></div><div>Finally, he whispered—</div><div><br></div><div>"How much?"</div><div><br></div><div>Nayla tilted her head. Smirked.</div><div><br></div><div>"Not money. When I call, you answer. You play along. You keep laying golden eggs. This game… isn''t over."</div><div><br></div><div>And Ariyan just sat there.</div><div><br></div><div>Empty.</div><div><br></div><div>Then, out of nowhere, her first message echoed in his head—</div><div><br></div><div>"Let''s meet up. Grab some tea. If it happens, it happens. If not, no big deal."</div><div><br></div><div>And that''s when it hit him.</div><div><br></div><div>There was never any love.</div><div><br></div><div>It was a trap. Perfectly planned. Romance was just the mask. Addiction was the leash. And blackmail… blackmail was the punchline.</div><div><br></div><div>Every smile. Every tease. Every flying kiss. All of it—part of the script.</div><div><br></div><div>The nights he thought were dreams? They were his nightmare in disguise.</div><div><br></div><div>The flying kisses, the glow of her nightie, the rush of falling deeper—it all led him to one place. A dead end.</div><div><br></div><div>In the end, love didn''t win.</div><div><br></div><div>Temptation did.</div><div><br></div><div>And Ariyan? He stayed behind—trapped in the dark, locked inside a blackmailer''s game.</div><div><br></div><div>(Voiceover ends)</div><div><br></div><div>©Alam – 30 September 2025, 12 AM.</div>', NULL, 1, '2026-08-20T04:32:56.37+00:00', '3442b3b8-a20b-4c4a-9978-1e4815381806', '6a308470-2d8d-4cd8-996b-a96de32efdc2', '2026-08-20T04:24:49.080119+00:00', '2026-08-20T04:33:02.149027+00:00');
INSERT OR IGNORE INTO article_categories (article_id, category_id, created_at) VALUES ('e494d481-876f-4e23-8ce7-608cc055857b', 'fa17b7b2-a53b-4d67-b2bb-3828971b72ba', '2026-08-12T03:33:45.054236+00:00');
INSERT OR IGNORE INTO article_categories (article_id, category_id, created_at) VALUES ('cd4c4604-800b-4d6c-b153-7d1d6eb31186', 'fa17b7b2-a53b-4d67-b2bb-3828971b72ba', '2026-08-19T17:27:53.193243+00:00');
INSERT OR IGNORE INTO article_categories (article_id, category_id, created_at) VALUES ('163c5463-71a3-4ca7-a07f-7d364c3c9dce', 'fa17b7b2-a53b-4d67-b2bb-3828971b72ba', '2026-08-19T22:15:51.502188+00:00');
INSERT OR IGNORE INTO article_categories (article_id, category_id, created_at) VALUES ('240ca110-56e6-4cb2-8483-b5cba79d6def', '0b772921-f656-483b-9f0d-664ebabede53', '2026-08-20T04:33:02.562623+00:00');
INSERT OR IGNORE INTO article_categories (article_id, category_id, created_at) VALUES ('442b340f-45e8-4cd6-81c3-69a838c28cc2', 'fa17b7b2-a53b-4d67-b2bb-3828971b72ba', '2026-08-29T02:26:27.049338+00:00');
INSERT OR IGNORE INTO pages (id, slug, title_bn, title_en, content_bn, content_en, cover_image_url, published, created_by, created_at, updated_at) VALUES ('7027ae50-b93b-49b8-ba5d-4f4863858747', 'story', 'গল্প', 'Story', NULL, NULL, NULL, 1, '3442b3b8-a20b-4c4a-9978-1e4815381806', '2026-08-19T14:58:26.616755+00:00', '2026-08-19T14:58:26.616755+00:00');
INSERT OR IGNORE INTO pages (id, slug, title_bn, title_en, content_bn, content_en, cover_image_url, published, created_by, created_at, updated_at) VALUES ('cc05b19a-8009-4409-b95d-e879cf705451', 'about', 'আমার পাতা', 'About Me', 'আমি আলম। শব্দের ভাঁজে ভাঁজে লুকিয়ে থাকা গল্পগুলোর সন্ধানী। সকালের প্রথম আলোয় যখন কাগজ ছোঁয় জানালার গ্রিল ধরে, তখন আমার কলম জেগে ওঠে। এই কলম আর আমি- আমরা দুই বন্ধু, যারা প্রতিদিন নতুন কোনও অজানা ঠিকানায় পৌঁছে দিতে চাই কিছু কথা।

আমি বিশ্বাস করি, প্রতিটি মুহূর্তের গভীরে একটা করে কবিতা লুকিয়ে থাকে। রাস্তার ধারে চায়ের দোকানের ফুটন্ত পানির বুদবুদে, বিকেলবেলায় বাড়ি ফেরা কোনো পাখির ডানার ছোঁয়ায়, কিংবা পুরোনো ডায়েরির পাতায় মিলিয়ে যাওয়া কোনো হাতের লেখায়- সবখানেই আছে একেকটি গল্প। আমি শুধু সেগুলোকে খুঁজে নিই, তুলে আনি আলোয়। শব্দ আমার মাধ্যম, আর আবেগ আমার পথচলা।

শব্দেরও প্রাণ আছে। তুমি যদি ঠিকমতো ডাক দিতে শেখো, তারা নিজেরাই গল্প বলতে আসবে। এখন বুঝি- প্রতিটি লেখাই যেন এক অজানা আত্মার সঙ্গে কথোপকথন। আমি লিখি একা বসে, কিন্তু লেখা শেষে মনে হয়, পুরো বিশ্বটা জুড়ে বসে আছে আমার পাশে।

আমি যখন লিখি, সময় থমকে দাঁড়ায়। ঘড়ির কাঁটা চলে, কিন্তু আমি থাকি অন্যখানে- সেই জায়গায় যেখানে স্মৃতি আর কল্পনার সীমানা মিলিয়ে যায়। সেখান থেকে ফিরে আসি কিছু অক্ষরের ঝুলি নিয়ে, কিছু অনুভূতির বস্তা বেঁধে। সেগুলো হয়তো কারও কাজে লাগে, কারও না। কিন্তু লেখাটা শেষ করার পর আমার নিজের একটা অংশ চিরকাল বেঁচে থাকে সেই পাতায়।

যারা পড়ে, তারা আমার অজান্তেই আমার সঙ্গী হয়ে যায়। তাঁদের চোখের তারায় আমি দেখি আমার লেখার প্রতিফলন। সেটাই আমার পাওয়া। সেটাই আমার প্রাপ্তি।

এই পৃষ্ঠাটা আমার ডায়েরির প্রথম পাতা। বাকিটা লেখা হবে একদিন, এক শব্দে, এক গল্পে। যদি তুমি পড়তে পড়তে থেমে যাও কোথাও, যদি কোনো বাক্য তোমার ভেতরে দাগ কাটে- তাহলে জেনে রাখবে, আমার লেখা সফল। কারণ শব্দ তখনই সত্যিকারের হয়, যখন তা কারও না কারও মন স্পর্শ করে।

আমি আলম। শব্দের লেখক। গল্পের পথিক।

তোমার সময় দিয়ে আমার পাতাকে সমৃদ্ধ করার জন্য ধন্যবাদ। চলো, একসঙ্গে কিছু গল্প বুনি।', 'I''m Alam. A seeker of stories hidden in the folds of words. When the first light of morning touches the paper through the window grilles, my pen wakes up. This pen and I- we''re two friends, trying to deliver something new to some unknown address every single day.

I believe there''s a poem tucked deep inside every moment. In the bubbles of boiling water at that roadside tea stall, in the brush of a bird''s wing as it flies home in the afternoon, or in some fading handwriting on the pages of an old diary- everywhere, there''s a story waiting. I just go find them, bring them out into the light. Words are my medium; emotions are my path.

Words have a life of their own. If you learn to call them right, they''ll come and tell you stories themselves. I understand that now- every piece of writing feels like a conversation with an unknown soul. I sit alone and write, but when I''m done, it feels like the whole world is sitting right there beside me.

When I write, time just stops. The clock keeps ticking, but I''m somewhere else- that place where memory and imagination blur into each other. I come back with a bag full of letters, a bundle of feelings tied up tight. Maybe they''ll mean something to someone, maybe not. But once a piece is finished, a part of me lives on forever in those pages.

The people who read- they become my companions without even knowing it. I see my writing reflected in their eyes. That''s what I''ve found. That''s what I''ve received.

This page is the first page of my diary. The rest will be written one day, one word at a time, one story at a time. If you stop somewhere while reading, if any sentence leaves a mark inside you- then know that my writing has done its job. Because words only become real when they touch someone''s heart.

I''m Alam. A writer of words. A wanderer of stories.

Thank you for taking the time to fill my page with meaning. Let''s weave a few stories together.', 'https://res.cloudinary.com/coindyna/image/upload/v1787201736/alam.webp', 1, '3442b3b8-a20b-4c4a-9978-1e4815381806', '2026-08-11T20:13:52.373907+00:00', '2026-08-20T04:56:29.06898+00:00');
INSERT OR IGNORE INTO pages (id, slug, title_bn, title_en, content_bn, content_en, cover_image_url, published, created_by, created_at, updated_at) VALUES ('7cd2f0f5-f181-4d39-be6f-a419337a8798', 'contact', 'যোগাযোগ', 'Contact', 'যেকোনো প্রশ্ন, মতামত বা কাজের প্রস্তাবের জন্য নিচের ফর্মটি পূরণ করুন। আমি যত দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করব।', 'Fill in the form below and I will get back to you as soon as possible.', 'https://res.cloudinary.com/coindyna/image/upload/v1787202000/envelop.webp', 1, '3442b3b8-a20b-4c4a-9978-1e4815381806', '2026-08-11T20:13:52.373907+00:00', '2026-08-20T05:00:58.074993+00:00');
INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES ('4e4971e7-9903-490a-a70c-2ead4e38052f', 'হোম', 'Home', '/', 'header', 1, 1, '2026-08-11T20:13:52.373907+00:00', '2026-08-11T20:13:52.373907+00:00');
INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES ('138f620d-a3b4-425c-a734-4a3a23ab2fd2', 'আমার পাতা', 'About Me', '/about', 'header', 3, 1, '2026-08-11T20:13:52.373907+00:00', '2026-08-11T20:13:52.373907+00:00');
INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES ('ef56d0bb-6326-4951-9d52-1e457d100ce5', 'যোগাযোগ', 'Contact', '/contact', 'header', 4, 1, '2026-08-11T20:13:52.373907+00:00', '2026-08-11T20:13:52.373907+00:00');
INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES ('38e876b7-eb5b-46ca-b7fc-7efbb1c22b4a', 'কবিতা', NULL, '/c/kobita', 'header', 2, 1, '2026-08-12T03:43:01.67708+00:00', '2026-08-29T02:31:34.792419+00:00');
INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES ('de29ad91-9b96-44bb-a965-ef6b9c759fc5', 'স্মৃতিকথা', NULL, '/c/smritikotha', 'header', 2, 1, '2026-08-12T03:42:32.609058+00:00', '2026-08-29T02:31:34.792419+00:00');
INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES ('7b524046-2c6e-4a81-95b8-8e6d224d1874', 'গল্প', 'Story', '/c/golpo', 'header', 0, 1, '2026-08-19T14:59:51.012583+00:00', '2026-08-29T02:31:34.792419+00:00');
INSERT OR IGNORE INTO site_settings (id, footer_about_bn, footer_about_en, footer_copyright_bn, footer_copyright_en, created_at, updated_at) VALUES ('main', '@ 2026', '@ ২০২৬', 'শব্দ আমার ক্যানভাস, গল্প আমার রঙ; লেখার তুলিতে আঁকি ভাবনা', '', '2026-08-12T03:09:17.437185+00:00', '2026-08-12T03:39:37.676163+00:00');
