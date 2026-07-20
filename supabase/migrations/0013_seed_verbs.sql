-- Seed 10 common Palestinian Arabic verbs

insert into verb_conjugations (root, meaning_he, forms) values
(
  'كتب', 'לכתוב',
  '{"ana":"بكتب","inta":"بتكتب","inti":"بتكتبي","huwwe":"بيكتب","hiyye":"بتكتب","ihna":"منكتب","intu":"بتكتبوا","hum":"بيكتبوا"}'
),
(
  'قرأ', 'לקרוא',
  '{"ana":"بقرأ","inta":"بتقرأ","inti":"بتقريئي","huwwe":"بيقرأ","hiyye":"بتقرأ","ihna":"منقرأ","intu":"بتقرأوا","hum":"بيقرأوا"}'
),
(
  'أكل', 'לאכול',
  '{"ana":"باكل","inta":"بتاكل","inti":"بتاكلي","huwwe":"بياكل","hiyye":"بتاكل","ihna":"مناكل","intu":"بتاكلوا","hum":"بياكلوا"}'
),
(
  'شرب', 'לשתות',
  '{"ana":"بشرب","inta":"بتشرب","inti":"بتشربي","huwwe":"بيشرب","hiyye":"بتشرب","ihna":"منشرب","intu":"بتشربوا","hum":"بيشربوا"}'
),
(
  'راح', 'ללכת',
  '{"ana":"بروح","inta":"بتروح","inti":"بتروحي","huwwe":"بيروح","hiyye":"بتروح","ihna":"منروح","intu":"بتروحوا","hum":"بيروحوا"}'
),
(
  'جا', 'לבוא',
  '{"ana":"بجي","inta":"بتجي","inti":"بتجي","huwwe":"بيجي","hiyye":"بتجي","ihna":"منجي","intu":"بتجوا","hum":"بيجوا"}'
),
(
  'حكى', 'לדבר',
  '{"ana":"بحكي","inta":"بتحكي","inti":"بتحكي","huwwe":"بيحكي","hiyye":"بتحكي","ihna":"منحكي","intu":"بتحكوا","hum":"بيحكوا"}'
),
(
  'شاف', 'לראות',
  '{"ana":"بشوف","inta":"بتشوف","inti":"بتشوفي","huwwe":"بيشوف","hiyye":"بتشوف","ihna":"منشوف","intu":"بتشوفوا","hum":"بيشوفوا"}'
),
(
  'عمل', 'לעשות',
  '{"ana":"بعمل","inta":"بتعمل","inti":"بتعملي","huwwe":"بيعمل","hiyye":"بتعمل","ihna":"منعمل","intu":"بتعملوا","hum":"بيعملوا"}'
),
(
  'نام', 'לישון',
  '{"ana":"بنام","inta":"بتنام","inti":"بتنامي","huwwe":"بينام","hiyye":"بتنام","ihna":"مننام","intu":"بتناموا","hum":"بيناموا"}'
);

-- Create 3 SRS tracks for every seeded verb
insert into conjugation_srs (verb_id, track)
select v.id, t.track
from verb_conjugations v
cross join (values ('recognition'), ('production'), ('audio')) as t(track)
on conflict (verb_id, track) do nothing;
