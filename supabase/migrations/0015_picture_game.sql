create table if not exists picture_scenes (
  id uuid primary key default gen_random_uuid(),
  title text not null,               -- e.g. "מטבח", "רחוב", "כיתה"
  image_path text not null,          -- storage path in 'pictures' bucket
  created_at timestamptz default now()
);

create table if not exists picture_hotzones (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid references picture_scenes(id) on delete cascade,
  label_ar text not null,            -- Arabic word, e.g. "طاولة"
  label_he text not null,            -- Hebrew, e.g. "שולחן"
  translit text,                     -- transliteration
  x_pct float not null,              -- center x as % of image width (0-1)
  y_pct float not null,              -- center y as % of image height (0-1)
  radius_pct float default 0.08,     -- hit radius as % of image width
  created_at timestamptz default now()
);

-- Note: The 'pictures' storage bucket must be created manually in the Supabase
-- dashboard (Storage -> New bucket -> name: "pictures", public: false).
-- Storage bucket creation is not supported via the SQL migration API.
