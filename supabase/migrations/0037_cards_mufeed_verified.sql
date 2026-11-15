-- Cards whose Arabic and nikud match MuFeed's dictionary exactly (2026-11-15).
alter table cards add column if not exists mufeed_verified boolean not null default false;
