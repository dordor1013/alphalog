-- 공모주 투자노트 (일육공 스타일)
create table if not exists ipo_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stock_name text not null,
  underwriter text not null default '',
  quantity int not null check (quantity > 0),
  allocation_price numeric not null check (allocation_price > 0),
  sell_date date,
  sell_price numeric check (sell_price is null or sell_price >= 0),
  created_at timestamptz default now()
);

create index if not exists idx_ipo_records_user on ipo_records(user_id);
create index if not exists idx_ipo_records_sell_date on ipo_records(user_id, sell_date desc);

alter table ipo_records enable row level security;

create policy "Users manage own ipo records"
  on ipo_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
