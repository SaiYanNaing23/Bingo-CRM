import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useEditorNavigation } from '@/lib/use-editor-navigation'
import { toast } from 'sonner'
import { ResourceList } from '@/components/shared/resource-list'
import { RecordActions } from '@/components/shared/record-actions'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader, Loading, ErrorState } from '@/components/shared/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRecord, useWrite, resourceApi } from '@/lib/resources'
import { safeReturnPath } from '@/lib/api-client'
import { displayDate } from '@/lib/dates'
import { RelatedNotes } from '@/features/notes/related-notes'
import { projectsConfig as config } from './config'
import { ProjectForm } from './project-form'
import { ProgressAction } from './progress-action'
import { ActivityHistory } from './activity-history'
import { safeHttpUrl } from './forms'

function Screenshot({ url, index }: { url: string; index: number }) {
  const [failed, setFailed] = useState(false)
  return safeHttpUrl(url) ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-w-0 overflow-hidden rounded-lg border"
    >
      {failed ? (
        <div className="flex aspect-video items-center justify-center bg-muted p-4 text-sm text-muted-foreground">
          Image unavailable
        </div>
      ) : (
        <img
          alt={`Project screenshot ${index + 1}`}
          src={url}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="aspect-video w-full bg-muted object-contain"
        />
      )}
      <span className="block truncate p-3 text-xs text-link">Open screenshot {index + 1}</span>
    </a>
  ) : null
}
function Detail() {
  const { id } = useParams(),
    location = useLocation()
  const result = useRecord('projects', id)
  const from = safeReturnPath(location.state?.from, '/projects')
  if (result.isPending) return <Loading />
  if (result.isError) return <ErrorState error={result.error} retry={() => void result.refetch()} />
  const project = result.data.data
  return (
    <>
      <PageHeader
        title={project.name}
        description={`Project details · Updated ${displayDate(project.updatedAt)}`}
        back={from}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <StatusBadge value={project.status} />
        <div className="flex flex-wrap gap-2">
          <RecordActions config={config} record={project} from={from} />
          <ProgressAction project={project} />
        </div>
      </div>
      <section className="panel space-y-6 p-6">
        <div>
          <div className="mb-2 flex justify-between">
            <h2 className="font-semibold">Progress</h2>
            <span>{project.progress}%</span>
          </div>
          <progress
            aria-label="Project progress"
            max={100}
            value={project.progress}
            className="project-progress h-2 w-full overflow-hidden rounded-full"
          />
        </div>
        <dl className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ['GitHub', project.githubUrl],
              ['Live demo', project.liveDemoUrl],
            ] as const
          ).map(([label, url]) => (
            <div key={label}>
              <dt className="mb-2 text-xs text-muted-foreground">{label}</dt>
              <dd>
                {url && safeHttpUrl(url) ? (
                  <a
                    href={url}
                    className="break-all text-link underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url}
                  </a>
                ) : (
                  'Not added'
                )}
              </dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="mb-2 text-xs text-muted-foreground">Technology stack</dt>
            <dd className="flex flex-wrap gap-2">
              {project.stack.length
                ? project.stack.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))
                : 'Not added'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="mb-2 text-xs text-muted-foreground">Lessons learned</dt>
            <dd className="whitespace-pre-wrap break-words leading-relaxed">
              {project.lessonsLearned || 'Not added'}
            </dd>
          </div>
        </dl>
        {!!project.screenshots.length && (
          <div>
            <h2 className="mb-3 font-semibold">Screenshots</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {project.screenshots.map((url, index) => (
                <Screenshot key={url} url={url} index={index} />
              ))}
            </div>
          </div>
        )}
      </section>
      <ActivityHistory key={project.id} id={project.id} />
      <RelatedNotes entity={{ type: 'PROJECT', id: project.id }} />
      <Button asChild variant="ghost" className="mt-6">
        <Link to={from}>Back to projects</Link>
      </Button>
    </>
  )
}
function Edit() {
  const { id } = useParams(),
    location = useLocation(),
    navigate = useEditorNavigation()
  const result = useRecord('projects', id)
  const writer = useWrite((body: Record<string, unknown>) =>
    id ? resourceApi('projects').update(id, body) : resourceApi('projects').create(body),
  )
  const from = safeReturnPath(location.state?.from, '/projects'),
    cancelTo = id ? `/projects/${id}` : from
  if (id && result.isPending) return <Loading />
  if (id && result.isError)
    return <ErrorState error={result.error} retry={() => void result.refetch()} />
  return (
    <>
      <PageHeader
        title={id ? 'Edit project' : 'New project'}
        description={result.data?.data.name ?? 'Give your next project a place to grow.'}
        back={cancelTo}
        backState={{ from }}
      />
      <ProjectForm
        key={id ?? 'new'}
        record={result.data?.data}
        cancelTo={cancelTo}
        onSave={async (body) => {
          const saved = await writer.mutateAsync(body)
          toast.success(id ? 'Changes saved' : 'Project created')
          navigate(`/projects/${saved.data.id}`, { replace: true, state: { from } })
        }}
      />
    </>
  )
}
export default function Pages({ view }: { view: 'list' | 'detail' | 'edit' }) {
  return view === 'list' ? (
    <ResourceList config={config} />
  ) : view === 'detail' ? (
    <Detail />
  ) : (
    <Edit />
  )
}
