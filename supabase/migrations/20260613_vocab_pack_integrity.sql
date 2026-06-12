-- Catalog V3 — toàn vẹn micro-pack:
--  1) RPC import_vocab_pack: ghi pack + membership + tính progress trong MỘT transaction
--     (tránh trạng thái "insert từ xong nhưng lưu pack/membership lỗi").
--  2) Trigger khi xóa từ khỏi pack: tự tính lại word_count/reviewed_count; xóa pack nếu rỗng.
--
-- An toàn idempotent. KHÔNG sửa dữ liệu sẵn có ngoài việc đồng bộ lại bộ đếm.

-- ──────────────────────────────────────────────────────────────────────────
-- 1) Import pack atomic
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.import_vocab_pack(
  p_user_id uuid,
  p_pack_id text,
  p_catalog_version text,
  p_topic_id text,
  p_topic_title text,
  p_pack_index integer,
  p_word_ids uuid[]
)
returns public.user_vocab_packs
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_count integer := coalesce(array_length(p_word_ids, 1), 0);
  v_existing public.user_vocab_packs%rowtype;
  v_result public.user_vocab_packs%rowtype;
begin
  if auth.uid() is distinct from p_user_id
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Not authorized to import vocabulary pack' using errcode = '42501';
  end if;
  if v_count < 1 or v_count > 20 then
    raise exception 'Pack phải có 1-20 từ (nhận %).', v_count using errcode = '22023';
  end if;

  select * into v_existing from public.user_vocab_packs
   where user_id = p_user_id and pack_id = p_pack_id;

  -- Upsert pack (giữ started_at/status completed cũ)
  insert into public.user_vocab_packs as packs (
    user_id, pack_id, catalog_version, topic_id, topic_title, pack_index,
    status, word_count, started_at, last_studied_at
  ) values (
    p_user_id, p_pack_id, p_catalog_version, p_topic_id, p_topic_title, p_pack_index,
    case when v_existing.status = 'completed' then 'completed' else 'in_progress' end,
    v_count, coalesce(v_existing.started_at, now()), now()
  )
  on conflict (user_id, pack_id) do update set
    catalog_version = excluded.catalog_version,
    topic_id = excluded.topic_id,
    topic_title = excluded.topic_title,
    pack_index = excluded.pack_index,
    word_count = excluded.word_count,
    status = case when packs.status = 'completed' then 'completed' else 'in_progress' end,
    last_studied_at = now();

  -- Membership: thêm các từ mới (giữ position), bỏ qua trùng. KHÔNG xóa để trigger delete không kích hoạt.
  insert into public.user_vocab_pack_words (user_id, pack_id, word_id, position)
  select p_user_id, p_pack_id, wid, ord - 1
    from unnest(p_word_ids) with ordinality as t(wid, ord)
  on conflict (user_id, pack_id, word_id) do nothing;

  -- Tính lại progress (đếm từ đã review > 0) cho pack vừa import.
  update public.user_vocab_packs as packs
     set reviewed_count = least(sub.reviewed, packs.word_count),
         status = case
           when sub.reviewed >= packs.word_count then 'completed'
           when sub.reviewed > 0 then 'in_progress'
           when packs.started_at is not null then 'in_progress'
           else 'not_started' end,
         completed_at = case when sub.reviewed >= packs.word_count then coalesce(packs.completed_at, now()) else null end
    from (
      select count(srs.word_id)::integer as reviewed
        from public.user_vocab_pack_words pw
        left join public.srs_progress srs
          on srs.user_id = pw.user_id and srs.word_id = pw.word_id and srs.review_count > 0
       where pw.user_id = p_user_id and pw.pack_id = p_pack_id
    ) as sub
   where packs.user_id = p_user_id and packs.pack_id = p_pack_id;

  select * into v_result from public.user_vocab_packs
   where user_id = p_user_id and pack_id = p_pack_id;
  return v_result;
end;
$function$;

comment on function public.import_vocab_pack(uuid, text, text, text, text, integer, uuid[]) is
  'Ghi pack + membership + progress atomic cho 1 micro-pack. Chỉ user đó hoặc service_role.';
revoke all on function public.import_vocab_pack(uuid, text, text, text, text, integer, uuid[]) from public;
grant execute on function public.import_vocab_pack(uuid, text, text, text, text, integer, uuid[]) to authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 2) Khi từ rời pack (word bị xóa → cascade xóa membership): đồng bộ bộ đếm, dọn pack rỗng
-- ──────────────────────────────────────────────────────────────────────────
create or replace function public.sync_vocab_pack_after_word_removal()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  r record;
  v_remaining integer;
  v_reviewed integer;
begin
  -- Gom các (user_id, pack_id) bị ảnh hưởng trong batch xóa.
  for r in select distinct user_id, pack_id from oldtab loop
    select count(*) into v_remaining
      from public.user_vocab_pack_words
     where user_id = r.user_id and pack_id = r.pack_id;

    if v_remaining = 0 then
      delete from public.user_vocab_packs where user_id = r.user_id and pack_id = r.pack_id;
    else
      select count(srs.word_id)::integer into v_reviewed
        from public.user_vocab_pack_words pw
        left join public.srs_progress srs
          on srs.user_id = pw.user_id and srs.word_id = pw.word_id and srs.review_count > 0
       where pw.user_id = r.user_id and pw.pack_id = r.pack_id;

      update public.user_vocab_packs as packs
         set word_count = v_remaining,
             reviewed_count = least(v_reviewed, v_remaining),
             status = case
               when v_reviewed >= v_remaining then 'completed'
               when v_reviewed > 0 then 'in_progress'
               when packs.started_at is not null then 'in_progress'
               else 'not_started' end,
             completed_at = case when v_reviewed >= v_remaining then coalesce(packs.completed_at, now()) else null end
       where packs.user_id = r.user_id and packs.pack_id = r.pack_id;
    end if;
  end loop;
  return null;
end;
$function$;

drop trigger if exists trg_sync_vocab_pack_after_word_removal on public.user_vocab_pack_words;
create trigger trg_sync_vocab_pack_after_word_removal
  after delete on public.user_vocab_pack_words
  referencing old table as oldtab
  for each statement
  execute function public.sync_vocab_pack_after_word_removal();

comment on function public.sync_vocab_pack_after_word_removal() is
  'Sau khi từ rời pack: tính lại word_count/reviewed_count; xóa pack nếu không còn từ.';
