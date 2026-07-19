-- Store the original ZIP filename so re-imports can skip already-uploaded recordings
alter table recordings add column if not exists source_filename text;
create unique index if not exists recordings_source_filename_key
  on recordings(source_filename)
  where source_filename is not null;
