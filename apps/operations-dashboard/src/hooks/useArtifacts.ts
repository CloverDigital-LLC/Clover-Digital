import { useQuery } from '@tanstack/react-query'
import {
  cloverOpsConfigured,
  cloverOpsSupabase,
  supabase,
  supabaseConfigured,
} from '../lib/supabase'
import type { ArtifactParentKind, ArtifactRow } from '../lib/types'
import { fromCloverOpsId, isCloverOpsId } from '../lib/cloverOps'
import { useVentureFilter } from '../context/VentureFilterContext'

const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

export interface ArtifactWithUrl extends ArtifactRow {
  signed_url: string | null
  /** Per-link metadata for THIS view of the artifact (role, linked_at). */
  link_role: string | null
  linked_at: string
}

/**
 * Fetches every artifact linked to a given record + signed URLs.
 *
 * Schema: many-to-many via `artifact_links`. We query the join with a
 * nested select so a single round trip returns the link rows + their
 * embedded artifact metadata.
 *
 * Signed URLs expire after an hour; the query refetches every 50 min
 * to keep them warm while a drawer is open.
 */
export function useArtifacts(
  parentKind: ArtifactParentKind | null,
  parentId: string | null,
) {
  const { viewRole } = useVentureFilter()
  return useQuery({
    queryKey: ['artifacts', viewRole, parentKind, parentId],
    enabled:
      ((viewRole === 'admin' && supabaseConfigured) || cloverOpsConfigured) &&
      Boolean(parentKind && parentId),
    refetchInterval: 50 * 60_000,
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<ArtifactWithUrl[]> => {
      if (!parentKind || !parentId) return []
      const isClover = isCloverOpsId(parentId)
      if (viewRole !== 'admin' && !isClover) return []
      const client = isClover ? cloverOpsSupabase : supabase
      const linkTable = isClover ? 'cd_artifact_links' : 'artifact_links'
      const select = isClover
        ? 'artifact_id, parent_kind, parent_id, role, linked_by, created_at, cd_artifacts!inner(id, bucket, storage_path, name, description, mime_type, size_bytes, tags, uploaded_by, created_at)'
        : 'artifact_id, parent_kind, parent_id, role, linked_by, created_at, artifacts!inner(id, bucket, storage_path, name, description, mime_type, size_bytes, tags, uploaded_by, created_at)'

      // Nested select via Postgrest FK relationship.
      const { data, error } = await client
        .from(linkTable)
        .select(select)
        .eq('parent_kind', parentKind)
        .eq('parent_id', fromCloverOpsId(parentId))
        .order('created_at', { ascending: false })
      if (error) throw error

      type Joined = {
        artifact_id: string
        role: string | null
        created_at: string
        artifacts?: ArtifactRow
        cd_artifacts?: ArtifactRow
      }
      const rows = (data ?? []) as unknown as Joined[]
      if (rows.length === 0) return []

      // Mint signed URLs in parallel.
      const signed = await Promise.all(
        rows.map(async (r) => {
          const a = r.artifacts ?? r.cd_artifacts
          if (!a) return null
          const { data: urlData, error: urlErr } = await client.storage
            .from(a.bucket)
            .createSignedUrl(a.storage_path, SIGNED_URL_TTL_SECONDS)
          if (urlErr) {
            // eslint-disable-next-line no-console
            console.warn('[artifacts] failed to sign', a.storage_path, urlErr.message)
            return {
              ...a,
              signed_url: null,
              link_role: r.role,
              linked_at: r.created_at,
            } as ArtifactWithUrl
          }
          return {
            ...a,
            signed_url: urlData.signedUrl ?? null,
            link_role: r.role,
            linked_at: r.created_at,
          } as ArtifactWithUrl
        }),
      )
      return signed.filter(Boolean) as ArtifactWithUrl[]
    },
  })
}

export function isImageMime(mime: string | null | undefined): boolean {
  if (!mime) return false
  return mime.startsWith('image/')
}

export function isPdfMime(mime: string | null | undefined): boolean {
  if (!mime) return false
  return mime === 'application/pdf'
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
