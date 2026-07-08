-- Freeform label for recordings (e.g. WhatsApp voice notes under a minute are
-- auto-tagged "פתגם יומי" so they can be filtered in /recordings).
alter table recordings add column tag text;
