-- Allow quantity 0 for "기준만 선택" rows when one trade has multiple criteria
-- (실제 매매 금액은 최소 option_number 행 한 줄에만 기록)
alter table trade_options drop constraint if exists trade_options_quantity_check;
alter table trade_options add constraint trade_options_quantity_nonneg check (quantity >= 0);
