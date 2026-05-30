-- 청약·상장 일정, 당첨 여부 (미당첨 시 매도 정보 없음)
alter table ipo_records
  add column if not exists subscription_date date,
  add column if not exists listing_date date,
  add column if not exists allotment_status text not null default 'PENDING';

alter table ipo_records drop constraint if exists ipo_records_allotment_status_check;
alter table ipo_records add constraint ipo_records_allotment_status_check
  check (allotment_status in ('PENDING', 'WON', 'LOST'));

alter table ipo_records drop constraint if exists ipo_records_quantity_check;
alter table ipo_records alter column quantity drop not null;
alter table ipo_records alter column quantity set default 0;
alter table ipo_records add constraint ipo_records_quantity_check check (quantity >= 0);

alter table ipo_records alter column allocation_price drop not null;

update ipo_records
set
  subscription_date = coalesce(subscription_date, sell_date, (created_at at time zone 'UTC')::date),
  allotment_status = case
    when allotment_status is not null and allotment_status <> 'PENDING' then allotment_status
    when coalesce(quantity, 0) > 0 and allocation_price is not null then 'WON'
    else 'PENDING'
  end
where subscription_date is null or allotment_status = 'PENDING';

create index if not exists idx_ipo_records_subscription on ipo_records(user_id, subscription_date desc);
