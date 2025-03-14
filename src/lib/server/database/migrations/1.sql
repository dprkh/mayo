alter table
  audio
add
  column kind integer not null default 0 check (
    kind = 0
    or kind = 1
  );
