-- Tracks how far into a re-exported WhatsApp chat we've already processed,
-- so re-uploading the same (growing) export doesn't re-parse old messages.
-- chat_identifier is the teacher's sender name as it appears in the export
-- (chosen by the user at import time) -- one row per teacher/chat.
create table whatsapp_import_cursor (
  chat_identifier text primary key,
  last_imported_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table whatsapp_import_cursor enable row level security;
