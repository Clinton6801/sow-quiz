-- =====================================================
-- SOW Quiz Championship — Spelling Game Tables
-- Paste into Supabase SQL Editor and click Run
-- =====================================================

-- spelling_words: word bank managed by admin
create table if not exists spelling_words (
  id         uuid default gen_random_uuid() primary key,
  word       text not null,
  section    text not null,  -- matches SECTIONS in lib/questions.ts
  hint       text,           -- optional clue e.g. "a large African animal"
  created_at timestamptz default now()
);

-- spelling_scores: per-game scores saved at end screen
create table if not exists spelling_scores (
  id          uuid default gen_random_uuid() primary key,
  player_name text not null,
  section     text not null,
  score       int  default 0,
  streak      int  default 0,
  accuracy    int  default 0,  -- percentage 0-100
  created_at  timestamptz default now()
);

-- RLS: public read/write (same pattern as existing tables)
alter table spelling_words  enable row level security;
alter table spelling_scores enable row level security;

create policy "public_spelling_words"  on spelling_words  for all using (true) with check (true);
create policy "public_spelling_scores" on spelling_scores for all using (true) with check (true);

-- ─── Seed starter words ──────────────────────────────────────────────────────

insert into spelling_words (word, section, hint) values
  -- Little Sprouts
  ('ANIMAL',    'Little Sprouts', 'a living creature'),
  ('MANGO',     'Little Sprouts', 'a sweet tropical fruit'),
  ('PARROT',    'Little Sprouts', 'a colourful bird that talks'),
  ('ORANGE',    'Little Sprouts', 'a round citrus fruit'),
  ('BANANA',    'Little Sprouts', 'a yellow curved fruit'),
  ('SCHOOL',    'Little Sprouts', 'a place where you learn'),
  ('WATER',     'Little Sprouts', 'you drink this every day'),
  ('HOUSE',     'Little Sprouts', 'a place where people live'),
  ('FLOWER',    'Little Sprouts', 'a pretty plant that blooms'),
  ('HAPPY',     'Little Sprouts', 'feeling joyful'),
  ('PENCIL',    'Little Sprouts', 'you write with this'),
  ('RABBIT',    'Little Sprouts', 'a small furry animal with long ears'),
  -- Rising Explorers
  ('BASKET',    'Rising Explorers', 'a container made of woven material'),
  ('MARKET',    'Rising Explorers', 'a place where people buy and sell'),
  ('FARMER',    'Rising Explorers', 'a person who grows food'),
  ('BRIDGE',    'Rising Explorers', 'a structure over water'),
  ('CANDLE',    'Rising Explorers', 'it gives light when lit'),
  ('GARDEN',    'Rising Explorers', 'a place where plants grow'),
  ('BOTTLE',    'Rising Explorers', 'a container for liquids'),
  ('SPIDER',    'Rising Explorers', 'an eight-legged creature'),
  ('PLANET',    'Rising Explorers', 'a large body orbiting a star'),
  ('FOREST',    'Rising Explorers', 'a large area covered with trees'),
  ('BUTTER',    'Rising Explorers', 'a yellow spread made from cream'),
  ('FINGER',    'Rising Explorers', 'part of your hand'),
  -- Builders League
  ('THUNDER',   'Builders League', 'the loud sound during a storm'),
  ('LEOPARD',   'Builders League', 'a spotted wild cat'),
  ('VILLAGE',   'Builders League', 'a small community of people'),
  ('KITCHEN',   'Builders League', 'a room where food is cooked'),
  ('BLANKET',   'Builders League', 'you use this to keep warm'),
  ('CHICKEN',   'Builders League', 'a common farm bird'),
  ('MORNING',   'Builders League', 'the start of the day'),
  ('RAINBOW',   'Builders League', 'colourful arc in the sky after rain'),
  ('BROTHER',   'Builders League', 'a male sibling'),
  ('TEACHER',   'Builders League', 'a person who helps you learn'),
  ('CAPTAIN',   'Builders League', 'the leader of a team or ship'),
  ('DIAMOND',   'Builders League', 'a precious gemstone'),
  -- Champions Circle
  ('BUTTERFLY', 'Champions Circle', 'a beautiful insect with wings'),
  ('UMBRELLA',  'Champions Circle', 'you use this when it rains'),
  ('CALENDAR',  'Champions Circle', 'shows the days of the year'),
  ('HOSPITAL',  'Champions Circle', 'a place where sick people are treated'),
  ('MOUNTAIN',  'Champions Circle', 'a very tall hill'),
  ('FOOTBALL',  'Champions Circle', 'a popular sport played with a round ball'),
  ('LANGUAGE',  'Champions Circle', 'a system of communication'),
  ('SATURDAY',  'Champions Circle', 'the sixth day of the week'),
  ('CHILDREN',  'Champions Circle', 'young people'),
  ('ELEPHANT',  'Champions Circle', 'the largest land animal'),
  ('CHAMPION',  'Champions Circle', 'a winner of a competition'),
  ('DISCOVER',  'Champions Circle', 'to find something for the first time'),
  -- Elite Masters
  ('BEAUTIFUL',    'Elite Masters', 'very pleasing to look at'),
  ('NECESSARY',    'Elite Masters', 'something that must be done'),
  ('KNOWLEDGE',    'Elite Masters', 'information and understanding'),
  ('ADVENTURE',    'Elite Masters', 'an exciting experience'),
  ('CELEBRATE',    'Elite Masters', 'to mark a special occasion'),
  ('CHOCOLATE',    'Elite Masters', 'a sweet brown food'),
  ('PARLIAMENT',   'Elite Masters', 'the law-making body of a country'),
  ('FRIENDSHIP',   'Elite Masters', 'a close relationship between people'),
  ('GOVERNMENT',   'Elite Masters', 'the group that rules a country'),
  ('ENVIRONMENT',  'Elite Masters', 'the natural world around us'),
  ('ACHIEVEMENT',  'Elite Masters', 'something accomplished successfully'),
  ('COMPETITION',  'Elite Masters', 'a contest between rivals'),
  -- Grand Legends
  ('MISCELLANEOUS',  'Grand Legends', 'consisting of various kinds'),
  ('CONSCIENTIOUS',  'Grand Legends', 'very careful and thorough'),
  ('PHILANTHROPY',   'Grand Legends', 'charitable giving to help others'),
  ('PHOTOSYNTHESIS', 'Grand Legends', 'how plants make food from sunlight'),
  ('EQUILIBRIUM',    'Grand Legends', 'a state of balance'),
  ('INFRASTRUCTURE', 'Grand Legends', 'basic systems of a country'),
  ('MULTIPLICATION', 'Grand Legends', 'the process of multiplying numbers'),
  ('PARLIAMENTARY',  'Grand Legends', 'relating to parliament'),
  ('ENTREPRENEURSHIP','Grand Legends','starting and running a business'),
  ('MALNOURISHMENT', 'Grand Legends', 'suffering from lack of proper nutrition'),
  ('ELECTROMAGNETIC','Grand Legends', 'relating to electricity and magnetism'),
  ('ARCHAEOLOGICAL', 'Grand Legends', 'relating to the study of ancient history');
