-- Persist user progress for micro-packs from the bundled vocabulary catalog.
-- Catalog metadata is copied into each user row so progress survives catalog updates.

create table if not exists public.user_vocab_packs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  pack_id text not null,
  catalog_version text not null,
  topic_id text not null,
  topic_title text not null,
  pack_index integer not null,
  status text not null default 'not_started',
  word_count integer not null,
  reviewed_count integer not null default 0,
  started_at timestamptz,
  last_studied_at timestamptz,
  completed_at timestamptz,
  constraint user_vocab_packs_pkey primary key (user_id, pack_id),
  constraint user_vocab_packs_pack_id_not_empty check (btrim(pack_id) <> ''),
  constraint user_vocab_packs_catalog_version_not_empty check (btrim(catalog_version) <> ''),
  constraint user_vocab_packs_topic_id_not_empty check (btrim(topic_id) <> ''),
  constraint user_vocab_packs_topic_title_not_empty check (btrim(topic_title) <> ''),
  constraint user_vocab_packs_pack_index_nonnegative check (pack_index >= 0),
  constraint user_vocab_packs_status_check
    check (status in ('not_started', 'in_progress', 'completed')),
  constraint user_vocab_packs_word_count_check check (word_count between 1 and 20),
  constraint user_vocab_packs_reviewed_count_check
    check (reviewed_count between 0 and word_count)
);

create table if not exists public.user_vocab_pack_words (
  user_id uuid not null,
  pack_id text not null,
  word_id uuid not null references public.words(id) on delete cascade,
  position integer not null,
  constraint user_vocab_pack_words_pkey primary key (user_id, pack_id, position),
  constraint user_vocab_pack_words_pack_fkey
    foreign key (user_id, pack_id)
    references public.user_vocab_packs(user_id, pack_id)
    on update cascade
    on delete cascade,
  constraint user_vocab_pack_words_position_check check (position between 0 and 19),
  constraint user_vocab_pack_words_word_key unique (user_id, pack_id, word_id)
);

-- Supports finding every pack affected when one word is reviewed.
create index if not exists user_vocab_pack_words_word_lookup_idx
  on public.user_vocab_pack_words(user_id, word_id, pack_id);

-- Supports loading the user's unfinished packs ordered by recent activity.
create index if not exists user_vocab_packs_active_idx
  on public.user_vocab_packs(user_id, last_studied_at desc nulls last)
  where status <> 'completed';

alter table public.user_vocab_packs enable row level security;
alter table public.user_vocab_pack_words enable row level security;

drop policy if exists "Users select own vocabulary packs" on public.user_vocab_packs;
create policy "Users select own vocabulary packs"
  on public.user_vocab_packs for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own vocabulary packs" on public.user_vocab_packs;
drop policy if exists "Users update own vocabulary packs" on public.user_vocab_packs;
drop policy if exists "Users delete own vocabulary packs" on public.user_vocab_packs;

drop policy if exists "Users select own vocabulary pack words" on public.user_vocab_pack_words;
create policy "Users select own vocabulary pack words"
  on public.user_vocab_pack_words for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own vocabulary pack words" on public.user_vocab_pack_words;
drop policy if exists "Users update own vocabulary pack words" on public.user_vocab_pack_words;
drop policy if exists "Users delete own vocabulary pack words" on public.user_vocab_pack_words;

-- Mutations only go through authenticated server APIs using service_role.
-- Clients can read their own progress but cannot forge catalog membership/counts.

-- Recalculate every pack containing a reviewed word. SECURITY DEFINER is required
-- so the service role and the owning authenticated user share one atomic code path.
create or replace function public.refresh_vocab_pack_progress(
  p_user_id uuid,
  p_word_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if auth.uid() is distinct from p_user_id
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Not authorized to refresh vocabulary pack progress'
      using errcode = '42501';
  end if;

  with affected_packs as (
    select distinct pack_words.pack_id
    from public.user_vocab_pack_words as pack_words
    where pack_words.user_id = p_user_id
      and pack_words.word_id = p_word_id
  ),
  progress as (
    select
      affected.pack_id,
      count(srs.word_id)::integer as reviewed_count
    from affected_packs as affected
    join public.user_vocab_pack_words as pack_words
      on pack_words.user_id = p_user_id
     and pack_words.pack_id = affected.pack_id
    left join public.srs_progress as srs
      on srs.user_id = pack_words.user_id
     and srs.word_id = pack_words.word_id
     and srs.review_count > 0
    group by affected.pack_id
  )
  update public.user_vocab_packs as packs
  set
    reviewed_count = least(progress.reviewed_count, packs.word_count),
    status = case
      when progress.reviewed_count >= packs.word_count then 'completed'
      when progress.reviewed_count > 0 then 'in_progress'
      when packs.started_at is not null then 'in_progress'
      else 'not_started'
    end,
    started_at = case
      when progress.reviewed_count > 0 then coalesce(packs.started_at, now())
      else packs.started_at
    end,
    last_studied_at = now(),
    completed_at = case
      when progress.reviewed_count >= packs.word_count
        then coalesce(packs.completed_at, now())
      else null
    end
  from progress
  where packs.user_id = p_user_id
    and packs.pack_id = progress.pack_id;
end;
$function$;

comment on function public.refresh_vocab_pack_progress(uuid, uuid) is
  'Recalculates progress for every vocabulary pack owned by p_user_id that contains p_word_id. Callable only by that user or service_role.';

revoke all on function public.refresh_vocab_pack_progress(uuid, uuid) from public;
grant execute on function public.refresh_vocab_pack_progress(uuid, uuid)
  to authenticated, service_role;
