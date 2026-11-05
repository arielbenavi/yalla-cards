-- Scenes of one episode are grouped on /watch. Rollback: alter table media_items drop column series, drop column sort;
alter table media_items add column if not exists series text;
alter table media_items add column if not exists sort int not null default 0;
