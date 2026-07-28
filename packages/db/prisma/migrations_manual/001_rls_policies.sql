-- Row-level security for tenant isolation.
-- Run this AFTER `prisma migrate dev`/`deploy` against a Supabase (or any
-- Postgres with the Supabase `auth` schema) database. Prisma migrations
-- don't express RLS, so this is applied as a separate manual step —
-- see packages/db/package.json's `migrate:rls` script.
--
-- Design: every tenant-scoped table gets a policy that requires
-- tenant_id = current_tenant_id(), where current_tenant_id() resolves the
-- Supabase JWT's `sub` claim (auth.uid()) to the caller's tenant via the
-- users table. This makes RLS a backstop against app-layer bugs, not the
-- only enforcement layer — application code must still filter by tenantId.

create or replace function current_tenant_id() returns text as $$
  select tenant_id from users where supabase_user_id = auth.uid()::text limit 1;
$$ language sql stable security definer;

-- Tables directly owned by a tenant (have a tenant_id column).
do $$
declare
  t text;
begin
  foreach t in array array[
    'tenants', 'users', 'waba_connections', 'contacts', 'contact_segments',
    'templates', 'campaigns', 'automations', 'kb_documents',
    'product_feed_items', 'escalations', 'ai_classifications', 'plans',
    'audit_log'
  ]
  loop
    execute format('alter table %I enable row level security;', t);

    -- tenants itself is keyed by id, not tenant_id
    if t = 'tenants' then
      execute format(
        'create policy tenant_isolation on %I for all using (id = current_tenant_id());',
        t
      );
    else
      execute format(
        'create policy tenant_isolation on %I for all using (tenant_id = current_tenant_id());',
        t
      );
    end if;
  end loop;
end $$;

-- Tables scoped indirectly (join through a tenant-scoped parent).
alter table contact_segment_members enable row level security;
create policy tenant_isolation on contact_segment_members for all using (
  exists (
    select 1 from contact_segments cs
    where cs.id = contact_segment_members.segment_id
      and cs.tenant_id = current_tenant_id()
  )
);

alter table campaign_recipients enable row level security;
create policy tenant_isolation on campaign_recipients for all using (
  exists (
    select 1 from campaigns c
    where c.id = campaign_recipients.campaign_id
      and c.tenant_id = current_tenant_id()
  )
);

alter table conversations enable row level security;
create policy tenant_isolation on conversations for all using (
  tenant_id = current_tenant_id()
);

alter table messages enable row level security;
create policy tenant_isolation on messages for all using (
  exists (
    select 1 from conversations conv
    where conv.id = messages.conversation_id
      and conv.tenant_id = current_tenant_id()
  )
);

alter table kb_chunks enable row level security;
create policy tenant_isolation on kb_chunks for all using (
  exists (
    select 1 from kb_documents d
    where d.id = kb_chunks.document_id
      and d.tenant_id = current_tenant_id()
  )
);

alter table escalation_events enable row level security;
create policy tenant_isolation on escalation_events for all using (
  exists (
    select 1 from escalations e
    where e.id = escalation_events.escalation_id
      and e.tenant_id = current_tenant_id()
  )
);
