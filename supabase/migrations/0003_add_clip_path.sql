-- Cards now store their own small playback clip (cut client-side from the
-- full recording) so /review can stream a few-second file instead of the
-- full lesson recording. audio_start_sec/audio_end_sec are kept so the clip
-- can be regenerated from the source recording if needed.
alter table cards add column clip_path text;
