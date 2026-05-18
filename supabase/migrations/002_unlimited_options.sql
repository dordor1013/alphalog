-- Remove option_number restriction from strategies (was limited to 1,2,3)
alter table strategies drop constraint if exists strategies_option_number_check;
alter table strategies add constraint strategies_option_number_check check (option_number >= 1);

-- Remove option_number restriction from trade_options
alter table trade_options drop constraint if exists trade_options_option_number_check;
alter table trade_options add constraint trade_options_option_number_check check (option_number >= 1);
