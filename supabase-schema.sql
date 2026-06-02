-- =====================================================
-- Seat of Wisdom Quiz App — Supabase Schema
-- Paste this entire file into your Supabase SQL Editor and click Run
-- =====================================================

create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  section text not null check (section in (
    'Little Sprouts',
    'Rising Explorers',
    'Builders League',
    'Champions Circle',
    'Elite Masters',
    'Grand Legends'
  )),
  category text not null check (category in ('Maths','Spelling Bee','General Knowledge')),
  question text not null,
  answer text not null,
  difficulty text check (difficulty in ('easy', 'moderate', 'hard', 'champion')) default null,
  hint text default null,
  created_at timestamptz default now()
);

-- Add columns if they don't exist (for existing databases)
alter table questions add column if not exists difficulty text check (difficulty in ('easy', 'moderate', 'hard', 'champion')) default null;
alter table questions add column if not exists hint text default null;

create table if not exists leaderboard (
  id uuid default gen_random_uuid() primary key,
  team_name text not null,
  section text not null,
  score integer default 0,
  wins integer default 0,
  created_at timestamptz default now()
);

create table if not exists spelling_words (
  id uuid default gen_random_uuid() primary key,
  section text not null,
  word text not null,
  hint text default null,
  audio_url text default null,
  created_at timestamptz default now(),
  constraint unique_word_section unique(section, word)
);

alter table questions enable row level security;
alter table leaderboard enable row level security;
drop policy if exists "public_questions" on questions;
create policy "public_questions" on questions for all using (true) with check (true);
drop policy if exists "public_leaderboard" on leaderboard;
create policy "public_leaderboard" on leaderboard for all using (true) with check (true);

-- =====================================================
-- SEED DATA (120 questions)
-- =====================================================
alter table questions drop constraint if exists questions_section_check;
insert into questions (section, category, question, answer) values
('Little Sprouts','Maths','What is 5 + 3?','8'),
('Little Sprouts','Maths','What is 10 - 4?','6'),
('Little Sprouts','Maths','What is 2 × 3?','6'),
('Little Sprouts','Maths','How many sides does a triangle have?','3'),
('Little Sprouts','Maths','What is half of 8?','4'),
('Little Sprouts','Maths','What comes after 19?','20'),
('Little Sprouts','Maths','What is 7 + 6?','13'),
('Little Sprouts','Maths','What is 15 - 9?','6'),
('Little Sprouts','Maths','How many days in a week?','7'),
('Little Sprouts','Maths','What is 4 × 2?','8'),
('Little Sprouts','Spelling Bee','CAT','C-A-T'),
('Little Sprouts','Spelling Bee','BOOK','B-O-O-K'),
('Little Sprouts','Spelling Bee','HAPPY','H-A-P-P-Y'),
('Little Sprouts','Spelling Bee','APPLE','A-P-P-L-E'),
('Little Sprouts','Spelling Bee','BALL','B-A-L-L'),
('Little Sprouts','Spelling Bee','TREE','T-R-E-E'),
('Little Sprouts','Spelling Bee','FISH','F-I-S-H'),
('Little Sprouts','Spelling Bee','JUMP','J-U-M-P'),
('Little Sprouts','Spelling Bee','DOOR','D-O-O-R'),
('Little Sprouts','Spelling Bee','RAIN','R-A-I-N'),
('Little Sprouts','General Knowledge','What color is the sky on a sunny day?','Blue'),
('Little Sprouts','General Knowledge','How many legs does a spider have?','8'),
('Little Sprouts','General Knowledge','What sound does a cow make?','Moo'),
('Little Sprouts','General Knowledge','What is the largest planet in our solar system?','Jupiter'),
('Little Sprouts','General Knowledge','How many months are in a year?','12'),
('Little Sprouts','General Knowledge','What do caterpillars turn into?','Butterflies'),
('Little Sprouts','General Knowledge','Which animal is known as man''s best friend?','Dog'),
('Little Sprouts','General Knowledge','How many fingers do humans normally have?','10'),
('Little Sprouts','General Knowledge','What is the opposite of hot?','Cold'),
('Little Sprouts','General Knowledge','What do bees make?','Honey'),
('Rising Explorers','Maths','What is 12 × 12?','144'),
('Rising Explorers','Maths','What is 25% of 200?','50'),
('Rising Explorers','Maths','Solve: 3x = 21. What is x?','7'),
('Rising Explorers','Maths','What is the area of a rectangle 6cm × 4cm?','24 sq cm'),
('Rising Explorers','Maths','What is the square root of 64?','8'),
('Rising Explorers','Maths','What is 2/3 + 1/3?','1'),
('Rising Explorers','Maths','What is 0.5 × 0.5?','0.25'),
('Rising Explorers','Maths','A triangle has angles 60° and 80°. What is the third?','40°'),
('Rising Explorers','Maths','What is 1000 ÷ 25?','40'),
('Rising Explorers','Maths','What is 15% of 80?','12'),
('Rising Explorers','Spelling Bee','BEAUTIFUL','B-E-A-U-T-I-F-U-L'),
('Rising Explorers','Spelling Bee','NECESSARY','N-E-C-E-S-S-A-R-Y'),
('Rising Explorers','Spelling Bee','ENVIRONMENT','E-N-V-I-R-O-N-M-E-N-T'),
('Rising Explorers','Spelling Bee','GOVERNMENT','G-O-V-E-R-N-M-E-N-T'),
('Rising Explorers','Spelling Bee','FRIENDSHIP','F-R-I-E-N-D-S-H-I-P'),
('Rising Explorers','Spelling Bee','KNOWLEDGE','K-N-O-W-L-E-D-G-E'),
('Rising Explorers','Spelling Bee','CHOCOLATE','C-H-O-C-O-L-A-T-E'),
('Rising Explorers','Spelling Bee','PARLIAMENT','P-A-R-L-I-A-M-E-N-T'),
('Rising Explorers','Spelling Bee','ADVENTURE','A-D-V-E-N-T-U-R-E'),
('Rising Explorers','Spelling Bee','CELEBRATE','C-E-L-E-B-R-A-T-E'),
('Rising Explorers','General Knowledge','What is the capital of Nigeria?','Abuja'),
('Rising Explorers','General Knowledge','How many continents are there on Earth?','7'),
('Rising Explorers','General Knowledge','What gas do plants absorb from the air?','Carbon dioxide'),
('Rising Explorers','General Knowledge','Which ocean is the largest?','Pacific Ocean'),
('Rising Explorers','General Knowledge','What is the fastest land animal?','Cheetah'),
('Rising Explorers','General Knowledge','How many bones does an adult human have?','206'),
('Rising Explorers','General Knowledge','Who invented the telephone?','Alexander Graham Bell'),
('Rising Explorers','General Knowledge','What is the chemical symbol for water?','H2O'),
('Rising Explorers','General Knowledge','Which planet is closest to the sun?','Mercury'),
('Rising Explorers','General Knowledge','What is the longest river in Africa?','The Nile'),
('Builders League','Maths','What is the value of π (pi) to 2 decimal places?','3.14'),
('Builders League','Maths','Factorize: x² - 9','(x+3)(x-3)'),
('Builders League','Maths','What is 2³ × 3²?','72'),
('Builders League','Maths','What is the LCM of 12 and 18?','36'),
('Builders League','Maths','Solve: 2x + 5 = 17. What is x?','6'),
('Builders League','Maths','What is the gradient of y = 3x + 7?','3'),
('Builders League','Maths','What is 15% of 340?','51'),
('Builders League','Maths','Find the circumference of a circle with radius 7cm (π=22/7)','44 cm'),
('Builders League','Maths','What is (-5) × (-4)?','20'),
('Builders League','Maths','Express 0.35 as a fraction in its lowest terms','7/20'),
('Builders League','Spelling Bee','MISCELLANEOUS','M-I-S-C-E-L-L-A-N-E-O-U-S'),
('Builders League','Spelling Bee','CONSCIENTIOUS','C-O-N-S-C-I-E-N-T-I-O-U-S'),
('Builders League','Spelling Bee','ENTREPRENEURSHIP','E-N-T-R-E-P-R-E-N-E-U-R-S-H-I-P'),
('Builders League','Spelling Bee','PHILANTHROPY','P-H-I-L-A-N-T-H-R-O-P-Y'),
('Builders League','Spelling Bee','PARLIAMENTARY','P-A-R-L-I-A-M-E-N-T-A-R-Y'),
('Builders League','Spelling Bee','PHOTOSYNTHESIS','P-H-O-T-O-S-Y-N-T-H-E-S-I-S'),
('Builders League','Spelling Bee','MALNOURISHMENT','M-A-L-N-O-U-R-I-S-H-M-E-N-T'),
('Builders League','Spelling Bee','EQUILIBRIUM','E-Q-U-I-L-I-B-R-I-U-M'),
('Builders League','Spelling Bee','INFRASTRUCTURE','I-N-F-R-A-S-T-R-U-C-T-U-R-E'),
('Builders League','Spelling Bee','MULTIPLICATION','M-U-L-T-I-P-L-I-C-A-T-I-O-N'),
('Builders League','General Knowledge','What year did World War II end?','1945'),
('Builders League','General Knowledge','What is the powerhouse of the cell?','Mitochondria'),
('Builders League','General Knowledge','Who wrote Romeo and Juliet?','William Shakespeare'),
('Builders League','General Knowledge','What is the chemical symbol for gold?','Au'),
('Builders League','General Knowledge','What is the speed of light approximately?','300,000 km/s'),
('Builders League','General Knowledge','What type of government does Nigeria operate?','Federal Republic'),
('Builders League','General Knowledge','Who painted the Mona Lisa?','Leonardo da Vinci'),
('Builders League','General Knowledge','What is the largest organ in the human body?','Skin'),
('Builders League','General Knowledge','What is the Pythagorean theorem?','a² + b² = c²'),
('Builders League','General Knowledge','What does DNA stand for?','Deoxyribonucleic Acid'),
('Champions Circle','Maths','Differentiate: y = 3x² + 5x - 2','dy/dx = 6x + 5'),
('Champions Circle','Maths','What is log₁₀(1000)?','3'),
('Champions Circle','Maths','Solve: x² - 5x + 6 = 0','x = 2 or x = 3'),
('Champions Circle','Maths','Sum of AP: 10 terms, first term 3, common difference 2','120'),
('Champions Circle','Maths','Convert 45° to radians','π/4'),
('Champions Circle','Maths','Integrate: ∫2x dx','x² + C'),
('Champions Circle','Maths','Determinant of matrix [[2,3],[1,4]]','5'),
('Champions Circle','Maths','Simplify: (2x³y²)/(4xy⁴)','x²/(2y²)'),
('Champions Circle','Maths','Binomial expansion of (1+x)³','1 + 3x + 3x² + x³'),
('Champions Circle','Maths','Find the nth term of: 2, 5, 8, 11...','3n - 1'),
('Champions Circle','Spelling Bee','CONCATENATION','C-O-N-C-A-T-E-N-A-T-I-O-N'),
('Champions Circle','Spelling Bee','JURISPRUDENCE','J-U-R-I-S-P-R-U-D-E-N-C-E'),
('Champions Circle','Spelling Bee','PHARMACEUTICAL','P-H-A-R-M-A-C-E-U-T-I-C-A-L'),
('Champions Circle','Spelling Bee','SERENDIPITOUS','S-E-R-E-N-D-I-P-I-T-O-U-S'),
('Champions Circle','Spelling Bee','DISENFRANCHISEMENT','D-I-S-E-N-F-R-A-N-C-H-I-S-E-M-E-N-T'),
('Champions Circle','Spelling Bee','IDIOSYNCRATIC','I-D-I-O-S-Y-N-C-R-A-T-I-C'),
('Champions Circle','Spelling Bee','NEUROSCIENTIST','N-E-U-R-O-S-C-I-E-N-T-I-S-T'),
('Champions Circle','Spelling Bee','ARCHAEOLOGICAL','A-R-C-H-A-E-O-L-O-G-I-C-A-L'),
('Champions Circle','Spelling Bee','ELECTROMAGNETIC','E-L-E-C-T-R-O-M-A-G-N-E-T-I-C'),
('Champions Circle','Spelling Bee','CONSCIENTIOUSLY','C-O-N-S-C-I-E-N-T-I-O-U-S-L-Y'),
('Champions Circle','General Knowledge','Nigeria''s first military head of state?','General Aguiyi-Ironsi'),
('Champions Circle','General Knowledge','Name the three branches of government','Executive, Legislative, Judicial'),
('Champions Circle','General Knowledge','Theory of relativity is associated with?','Albert Einstein'),
('Champions Circle','General Knowledge','What is the largest democracy in the world?','India'),
('Champions Circle','General Knowledge','Molar mass of water (H₂O)?','18 g/mol'),
('Champions Circle','General Knowledge','What does GDP stand for?','Gross Domestic Product'),
('Champions Circle','General Knowledge','Who wrote Things Fall Apart?','Chinua Achebe'),
('Champions Circle','General Knowledge','Process by which plants make food?','Photosynthesis'),
('Champions Circle','General Knowledge','Capital of South Africa (seat of government)?','Pretoria'),
('Champions Circle','General Knowledge','What does RNA stand for?','Ribonucleic Acid'),
('Elite Masters','Maths','What is the volume of a cylinder with radius 5cm and height 10cm?','250π cm³'),
('Elite Masters','Maths','Solve the quadratic: 2x² - 7x + 3 = 0','x = 3 or x = 0.5'),
('Elite Masters','Maths','What is the derivative of sin(x)?','cos(x)'),
('Elite Masters','Maths','Find the area of a triangle with sides 5, 6, 7','Approximately 14.7 sq units'),
('Elite Masters','Maths','What is the sum of exterior angles of any polygon?','360°'),
('Elite Masters','Maths','Express 2.5 as a percentage','250%'),
('Elite Masters','Maths','What is the probability of rolling two dice and getting a sum of 7?','1/6'),
('Elite Masters','Maths','Solve: 3x + 4y = 18, 2x - y = 1','x = 2, y = 3'),
('Elite Masters','Maths','What is the circumference of a circle with diameter 14cm?','44 cm'),
('Elite Masters','Maths','Find the value of tan(45°)','1'),
('Elite Masters','Spelling Bee','SERENDIPITOUS','S-E-R-E-N-D-I-P-I-T-O-U-S'),
('Elite Masters','Spelling Bee','PERSEVERANCE','P-E-R-S-E-V-E-R-A-N-C-E'),
('Elite Masters','Spelling Bee','BUREAUCRATIC','B-U-R-E-A-U-C-R-A-T-I-C'),
('Elite Masters','Spelling Bee','RESILIENCE','R-E-S-I-L-I-E-N-C-E'),
('Elite Masters','Spelling Bee','MISCELLANEOUS','M-I-S-C-E-L-L-A-N-E-O-U-S'),
('Elite Masters','Spelling Bee','QUINTESSENTIAL','Q-U-I-N-T-E-S-S-E-N-T-I-A-L'),
('Elite Masters','Spelling Bee','SURVEILLANCE','S-U-R-V-E-I-L-L-A-N-C-E'),
('Elite Masters','Spelling Bee','DICHOTOMY','D-I-C-H-O-T-O-M-Y'),
('Elite Masters','Spelling Bee','AMBIVALENT','A-M-B-I-V-A-L-E-N-T'),
('Elite Masters','Spelling Bee','UBIQUITOUS','U-B-I-Q-U-I-T-O-U-S'),
('Elite Masters','General Knowledge','What is the chemical equation for photosynthesis?','6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'),
('Elite Masters','General Knowledge','Who was the first president of Nigeria?','Nnamdi Azikiwe'),
('Elite Masters','General Knowledge','What is the boiling point of water at sea level?','100°C or 212°F'),
('Elite Masters','General Knowledge','What does HTTP stand for?','HyperText Transfer Protocol'),
('Elite Masters','General Knowledge','Name the five major oceans','Pacific, Atlantic, Indian, Arctic, Southern'),
('Elite Masters','General Knowledge','What is the capital of Canada?','Ottawa'),
('Elite Masters','General Knowledge','Who discovered penicillin?','Alexander Fleming'),
('Elite Masters','General Knowledge','What is the most abundant element in Earth''s crust?','Oxygen'),
('Elite Masters','General Knowledge','What year did Nigeria gain independence?','1960'),
('Elite Masters','General Knowledge','What is the SI unit of force?','Newton (N)'),
('Grand Legends','Maths','What is the integral of e^x?','e^x + C'),
('Grand Legends','Maths','Solve: x³ - 3x² + 2x = 0','x = 0, x = 1, or x = 2'),
('Grand Legends','Maths','What is the sum to infinity of the geometric series with a=1 and r=0.5?','2'),
('Grand Legends','Maths','Find the eigenvalues of matrix [[4,1],[1,3]]','5 and 2'),
('Grand Legends','Maths','What is the Fourier series used for?','Representing periodic functions'),
('Grand Legends','Maths','Differentiate: ln(x³ + 2x)','(3x² + 2)/(x³ + 2x)'),
('Grand Legends','Maths','What is the modulus of the complex number 3 + 4i?','5'),
('Grand Legends','Maths','Solve the differential equation: dy/dx = 2x','y = x² + C'),
('Grand Legends','Maths','What is the standard deviation formula?','√[Σ(x - μ)² / n]'),
('Grand Legends','Maths','Find the limit: lim(x→0) sin(x)/x','1'),
('Grand Legends','Spelling Bee','INEFFABLENESS','I-N-E-F-F-A-B-L-E-N-E-S-S'),
('Grand Legends','Spelling Bee','MAGNANIMOUS','M-A-G-N-A-N-I-M-O-U-S'),
('Grand Legends','Spelling Bee','OBFUSCATION','O-B-F-U-S-C-A-T-I-O-N'),
('Grand Legends','Spelling Bee','PERSPICACIOUS','P-E-R-S-P-I-C-A-C-I-O-U-S'),
('Grand Legends','Spelling Bee','SURREPTITIOUS','S-U-R-R-E-P-T-I-T-I-O-U-S'),
('Grand Legends','Spelling Bee','VINDICTIVE','V-I-N-D-I-C-T-I-V-E'),
('Grand Legends','Spelling Bee','CLANDESTINE','C-L-A-N-D-E-S-T-I-N-E'),
('Grand Legends','Spelling Bee','EPHEMERAL','E-P-H-E-M-E-R-A-L'),
('Grand Legends','Spelling Bee','SUPERFLUOUS','S-U-P-E-R-F-L-U-O-U-S'),
('Grand Legends','Spelling Bee','PARADOXICAL','P-A-R-A-D-O-X-I-C-A-L'),
('Grand Legends','General Knowledge','What is the theory of evolution primarily attributed to?','Charles Darwin'),
('Grand Legends','General Knowledge','What is the speed of sound in air at 20°C?','Approximately 343 m/s'),
('Grand Legends','General Knowledge','Who is the author of the novel 1984?','George Orwell'),
('Grand Legends','General Knowledge','What is the name of Nigeria''s national anthem?','Arise, O Compatriots'),
('Grand Legends','General Knowledge','What is CRISPR used for in biology?','Gene editing'),
('Grand Legends','General Knowledge','What is the Magna Carta?','A document that limited the power of the English king'),
('Grand Legends','General Knowledge','Who developed the theory of relativity?','Albert Einstein'),
('Grand Legends','General Knowledge','What is blockchain technology primarily used for?','Cryptocurrency and distributed ledgers'),
('Grand Legends','General Knowledge','What is the name of the membrane that surrounds the nucleus?','Nuclear envelope'),
('Grand Legends','General Knowledge','What is the primary function of mitochondria?','ATP production (cellular respiration)');

-- =====================================================
-- Spelling Audio Storage Bucket
-- =====================================================
-- Create spelling-audio bucket for teacher recordings
insert into storage.buckets (id, name, public) values ('spelling-audio', 'spelling-audio', true) on conflict (id) do nothing;

-- Allow public read access to spelling audio files
create policy if not exists "Public can read spelling audio" on storage.objects for select using (bucket_id = 'spelling-audio');

-- Allow admin uploads via service role key (handled server-side in API route)
create policy if not exists "Service role can upload spelling audio" on storage.objects for insert with check (bucket_id = 'spelling-audio');

-- Alter spelling_words table to ensure audio_url column exists
alter table spelling_words add column if not exists audio_url text default null;
