-- Keep showroom finance entries consistent when their originating vehicle is removed.
-- Historical orphan rows are deliberately preserved for owner-directed cleanup.
begin;

-- Cash rows tied to a vehicle must not be detached and left in the ledger.
alter table public.cash_transactions
  drop constraint if exists cash_transactions_vehicle_id_fkey;
alter table public.cash_transactions
  add constraint cash_transactions_vehicle_id_fkey
  foreign key (vehicle_id) references public.vehicles(id) on delete cascade;

-- A vehicle deleted by its owner also removes its sales. Existing sale triggers
-- reverse recorded cash and restore vehicle state where applicable.
alter table public.sales
  drop constraint if exists sales_vehicle_id_fkey;
alter table public.sales
  add constraint sales_vehicle_id_fkey
  foreign key (vehicle_id) references public.vehicles(id) on delete cascade;

-- Defense in depth: purchase rows created under earlier schema versions may
-- have a missing vehicle_id but still carry the original source_id.
create or replace function public.remove_vehicle_purchase_cash_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  delete from public.cash_transactions
   where showroom_id = old.showroom_id
     and is_system = true
     and source_type = 'vehicle_purchase'
     and source_id = old.id;
  return old;
end;
$fn$;

revoke all on function public.remove_vehicle_purchase_cash_on_delete()
from public, anon, authenticated;

drop trigger if exists vehicles_remove_purchase_cash on public.vehicles;
create trigger vehicles_remove_purchase_cash
after delete on public.vehicles
for each row execute function public.remove_vehicle_purchase_cash_on_delete();

-- Only the showroom owner can remove an automatically-generated record whose
-- source no longer exists. Active system records remain protected.
drop policy if exists transactions_delete_owner on public.cash_transactions;
create policy transactions_delete_owner
on public.cash_transactions
for delete to authenticated
using (
  private.current_showroom_role(showroom_id) = 'owner'
  and (
    is_system = false
    or (
      is_system = true
      and source_id is not null
      and (
        (source_type = 'vehicle_purchase'
          and not exists (
            select 1 from public.vehicles v
             where v.id = cash_transactions.source_id
               and v.showroom_id = cash_transactions.showroom_id))
        or (source_type = 'reconditioning'
          and not exists (
            select 1 from public.vehicle_costs c
             where c.id = cash_transactions.source_id
               and c.showroom_id = cash_transactions.showroom_id))
        or (source_type in ('sale_income', 'sale_commission')
          and not exists (
            select 1 from public.sales s
             where s.id = cash_transactions.source_id
               and s.showroom_id = cash_transactions.showroom_id))
      )
    )
  )
);

commit;
