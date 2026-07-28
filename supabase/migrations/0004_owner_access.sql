-- Owners need to read full booking details (guest name/email included) to
-- actually run the property. This is the one place that PII is meant to
-- be readable -- strictly gated to rows in the owners table, matching the
-- same auth.uid() check used everywhere else owner access is granted.
create policy "owners can read all bookings"
  on bookings for select
  using (exists (select 1 from owners where owners.id = auth.uid()));
