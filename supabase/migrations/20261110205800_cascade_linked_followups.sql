-- Follow-ups belong to their referenced vehicle/customer.
-- Remove only the linked follow-up rows when a parent record is deleted.
-- Preserve the independent customer and all unrelated financial history.
begin;

alter table public.leads
  drop constraint if exists leads_vehicle_id_fkey;
alter table public.leads
  add constraint leads_vehicle_id_fkey
    foreign key (vehicle_id)
    references public.vehicles (id)
    on delete cascade;

alter table public.leads
  drop constraint if exists leads_customer_id_fkey;
alter table public.leads
  add constraint leads_customer_id_fkey
    foreign key (customer_id)
    references public.customers (id)
    on delete cascade;

commit;
