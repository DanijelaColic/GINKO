-- 004_booking_guest_fields.sql
-- Extends the bookings table with additional guest detail fields
-- collected from the enriched booking form (form step 2).

alter table bookings
  add column if not exists guest_first_name    text,
  add column if not exists guest_last_name     text,
  add column if not exists guest_country       text,
  add column if not exists booking_for         text not null default 'self'
    constraint bookings_booking_for_check check (booking_for in ('self', 'other')),
  add column if not exists guest_staying_name  text,
  add column if not exists needs_crib          boolean not null default false,
  add column if not exists is_business         boolean not null default false,
  add column if not exists company_name        text,
  add column if not exists vat_id              text;

comment on column bookings.guest_first_name   is 'First name from split name form (may be null for older records)';
comment on column bookings.guest_last_name    is 'Last name from split name form (may be null for older records)';
comment on column bookings.guest_country      is 'Country / region selected by the guest';
comment on column bookings.booking_for        is 'self = guest is booker; other = booker reserves for someone else';
comment on column bookings.guest_staying_name is 'Full name of the actual staying guest when booking_for = other';
comment on column bookings.needs_crib         is 'Guest requested a baby cot (subject to availability)';
comment on column bookings.is_business        is 'Guest indicated a business trip';
comment on column bookings.company_name       is 'Company name for business trips';
comment on column bookings.vat_id             is 'VAT identification number for business trips';
