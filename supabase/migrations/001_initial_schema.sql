-- Strategies: customizable buy/sell option names (no limit on count)
create table if not exists strategies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('BUY', 'SELL')) not null,
  option_number int check (option_number >= 1) not null,
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, type, option_number)
);

-- Trades: each buy/sell record
create table if not exists trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  market text check (market in ('KR', 'US')) not null,
  stock_name text not null,
  trade_type text check (trade_type in ('BUY', 'SELL')) not null,
  trade_date date not null,
  reason text default '',
  created_at timestamptz default now()
);

-- Trade options: per-option allocation within a trade (no limit on count)
create table if not exists trade_options (
  id uuid default gen_random_uuid() primary key,
  trade_id uuid references trades(id) on delete cascade not null,
  option_number int check (option_number >= 1) not null,
  price numeric not null check (price >= 0),
  quantity int not null check (quantity > 0),
  amount numeric generated always as (price * quantity) stored
);

-- Indexes
create index if not exists idx_trades_user on trades(user_id);
create index if not exists idx_trades_market on trades(user_id, market);
create index if not exists idx_trade_options_trade on trade_options(trade_id);
create index if not exists idx_strategies_user on strategies(user_id);

-- Row Level Security
alter table strategies enable row level security;
alter table trades enable row level security;
alter table trade_options enable row level security;

create policy "Users manage own strategies"
  on strategies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own trades"
  on trades for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own trade options"
  on trade_options for all
  using (
    exists (
      select 1 from trades
      where trades.id = trade_options.trade_id
        and trades.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trades
      where trades.id = trade_options.trade_id
        and trades.user_id = auth.uid()
    )
  );
