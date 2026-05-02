import { useState } from 'react'
import {
  formatBytes,
  isImageMime,
  isPdfMime,
  useArtifacts,
  type ArtifactWithUrl,
} from '../../../hooks/useArtifacts'
import type { ArtifactParentKind } from '../../../lib/types'
import { fmtDate, relTime } from '../../../lib/adapters'
import { FieldGroup } from './shared'

interface Props {
  parentKind: ArtifactParentKind
  parentId: string
}

/**
 * Renders all files attached to a record. Drops in below the main
 * content of every detail renderer. Empty state stays quiet — the
 * field group only shows up when there are artifacts.
 */
export function ArtifactGallery({ parentKind, parentId }: Props) {
  const { data: artifacts = [], isLoading } = useArtifacts(parentKind, parentId)
  if (isLoading) return null
  if (artifacts.length === 0) return null

  return (
    <FieldGroup title={`Attachments (${artifacts.length})`}>
      <ul className="space-y-3">
        {artifacts.map((a) => (
          <ArtifactRow key={a.id} artifact={a} />
        ))}
      </ul>
    </FieldGroup>
  )
}

function ArtifactRow({ artifact }: { artifact: ArtifactWithUrl }) {
  const [imgErrored, setImgErrored] = useState(false)
  const url = artifact.signed_url
  const display =
    artifact.name ?? artifact.storage_path.split('/').pop() ?? 'file'

  if (!url) {
    return (
      <li className="rounded-md border border-ochre-300 bg-ochre-100/50 px-3 py-2 text-[12.5px] text-ochre-500">
        Couldn't load <code className="text-[11px]">{display}</code> — signed URL failed.
      </li>
    )
  }

  // Image preview
  if (isImageMime(artifact.mime_type) && !imgErrored) {
    return (
      <li className="space-y-1.5">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-md overflow-hidden border border-cream-300/70 bg-cream-100 hover:border-clover-500 transition"
        >
          <img
            src={url}
            alt={display}
            onError={() => setImgErrored(true)}
            className="w-full h-auto max-h-[400px] object-contain bg-cream-50"
          />
        </a>
        <ArtifactMeta artifact={artifact} display={display} url={url} />
      </li>
    )
  }

  // PDF preview (browser native)
  if (isPdfMime(artifact.mime_type)) {
    return (
      <li className="space-y-1.5">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-md overflow-hidden border border-cream-300/70 bg-cream-100 hover:border-clover-500 transition"
        >
          <iframe
            src={url}
            title={display}
            className="w-full h-[420px] bg-cream-50"
          />
        </a>
        <ArtifactMeta artifact={artifact} display={display} url={url} />
      </li>
    )
  }

  // Generic file — link only
  return (
    <li>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        download={display}
        className="flex items-start gap-3 px-3 py-2.5 rounded-md border border-cream-300/70 bg-cream-100/40 hover:bg-cream-200/60 hover:border-clover-500 transition"
      >
        <FileIcon mime={artifact.mime_type} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-ink-900 font-medium truncate">{display}</div>
          <ArtifactMeta artifact={artifact} display={display} url={url} compact />
        </div>
        <svg
          className="text-ink-400 mt-0.5"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v7H3V3h7" />
        </svg>
      </a>
    </li>
  )
}

function ArtifactMeta({
  artifact,
  display,
  url,
  compact,
}: {
  artifact: ArtifactWithUrl
  display: string
  url: string
  compact?: boolean
}) {
  const tags = artifact.tags ?? []
  return (
    <div
      className={`flex items-start justify-between gap-2 text-[11px] text-ink-500 ${
        compact ? '' : 'px-1'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate">
          {!compact && <span className="font-medium text-ink-700 mr-1.5">{display}</span>}
          {artifact.mime_type && <span className="text-ink-400">{artifact.mime_type}</span>}
          {artifact.size_bytes !== null && (
            <>
              {' · '}
              <span className="tabular-nums">{formatBytes(artifact.size_bytes)}</span>
            </>
          )}
          {artifact.uploaded_by && <> · by {artifact.uploaded_by}</>}
          {' · '}
          <span title={fmtDate(artifact.created_at)}>{relTime(artifact.created_at)}</span>
          {artifact.link_role && (
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.1em] px-1 py-0.5 rounded bg-clover-100 text-clover-800">
              {artifact.link_role}
            </span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded bg-cream-200 text-ink-700"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
      {!compact && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download={display}
          className="text-clover-700 hover:text-clover-800 whitespace-nowrap shrink-0"
        >
          Open ↗
        </a>
      )}
    </div>
  )
}

function FileIcon({ mime }: { mime: string | null | undefined }) {
  return (
    <span className="shrink-0 w-9 h-11 rounded border border-cream-300 bg-white flex items-center justify-center text-[10px] text-ink-500 font-mono uppercase">
      {extensionFromMime(mime)}
    </span>
  )
}

function extensionFromMime(mime: string | null | undefined): string {
  if (!mime) return 'file'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return mime.split('/')[1].slice(0, 4)
  if (mime === 'application/json') return 'json'
  if (mime === 'text/csv') return 'csv'
  if (mime === 'text/plain') return 'txt'
  if (mime.includes('zip')) return 'zip'
  if (mime.includes('word')) return 'doc'
  if (mime.includes('sheet') || mime.includes('excel')) return 'xls'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'ppt'
  return mime.split('/').pop()?.slice(0, 4) ?? 'file'
}
