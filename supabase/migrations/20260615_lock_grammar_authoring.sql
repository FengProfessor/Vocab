-- Global grammar content may only be authored through service-role API routes
-- guarded by the ADMIN_EMAILS whitelist.
drop policy if exists "Teachers manage grammar topics" on public.grammar_topics;
drop policy if exists "Teachers manage grammar lessons" on public.grammar_lessons;
