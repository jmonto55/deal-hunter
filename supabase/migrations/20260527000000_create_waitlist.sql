create table if not exists waitlist (
  id         bigint primary key generated always as identity,
  name       text not null,
  email      text not null unique,
  phone      text,
  created_at timestamptz not null default now()
);
