-- Optional read-only views for the Clover fleet dashboard.
-- Do not run blindly in production. Review RLS and grants first.

create or replace view dashboard_latest_heartbeats as
select distinct on (agent)
  id,
  agent,
  machine,
  status,
  current_task,
  uptime_hours,
  memory_usage_mb,
  created_at as last_seen_at,
  case
    when created_at < now() - interval '15 minutes' then true
    else false
  end as is_stale
from agent_heartbeats
order by agent, created_at desc;

create or replace view dashboard_pending_proposals as
select
  id,
  proposed_by,
  proposal_type,
  target_knowledge_id,
  related_knowledge_ids,
  payload,
  rationale,
  status,
  reviewed_at,
  reviewed_by,
  auto_approvable,
  created_at
from memory_proposals
where status = 'pending'
order by created_at desc;

create or replace view dashboard_archivist_health as
select
  id,
  title,
  content,
  created_at as last_run_at,
  case
    when created_at >= now() - interval '30 hours' then 'fresh'
    else 'stale'
  end as freshness
from knowledge
where source_agent = 'archivist'
  and project = 'fleet'
  and category = 'status'
order by created_at desc
limit 1;

create or replace view dashboard_mason_attention as
select
  id,
  title,
  status,
  priority,
  venture,
  coalesce(assigned_to, agent) as owner,
  created_at,
  started_at,
  completed_at,
  case
    when status = 'blocked' then 0
    when priority = 'critical' then 1
    when coalesce(assigned_to, agent) = 'mason' then 2
    when priority = 'high' then 3
    else 4
  end as attention_rank
from agent_tasks
where status not in ('completed', 'cancelled', 'failed')
order by attention_rank asc, created_at asc;

create or replace view dashboard_freshness as
select
  'agent_heartbeats' as signal,
  max(created_at) as last_seen_at,
  case when max(created_at) >= now() - interval '15 minutes' then 'fresh' else 'stale' end as freshness
from agent_heartbeats
union all
select
  'archivist',
  max(created_at),
  case when max(created_at) >= now() - interval '30 hours' then 'fresh' else 'stale' end
from knowledge
where source_agent = 'archivist'
  and project = 'fleet'
  and category = 'status'
union all
select
  'daily_briefs',
  max(created_at),
  case
    when max(created_at) >= date_trunc('day', now()) then 'fresh'
    else 'stale'
  end
from daily_briefs;
