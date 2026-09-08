import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useRecord, useWrite, resourceApi, titleOf, valueOf } from '@/lib/resources'
import { safeReturnPath } from '@/lib/api-client'
import type { ResourceConfig } from '@/lib/fields'
import { PageHeader, Loading, ErrorState } from './states'
import { RecordForm } from './record-form'
export function ResourceEdit({ config }: { config: ResourceConfig }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const record = useRecord(config.kind, id)
  const writer = useWrite((body: Record<string, unknown>) =>
    id ? resourceApi(config.kind).update(id, body) : resourceApi(config.kind).create(body),
  )
  const from = safeReturnPath(location.state?.from, `/${config.kind}`)
  const cancelTo = id ? `/${config.kind}/${id}` : from
  if (id && record.isPending) return <Loading />
  if (id && record.isError)
    return <ErrorState error={record.error} retry={() => void record.refetch()} />
  if (config.kind === 'tasks' && record.data && valueOf(record.data.data, 'status') === 'COMPLETED')
    return (
      <ErrorState
        error={
          new Error('Completed tasks are read-only. Open the task to view its completion details.')
        }
      />
    )
  return (
    <>
      <PageHeader
        title={id ? `Edit ${config.singular}` : `New ${config.singular}`}
        description={
          record.data
            ? titleOf(record.data.data)
            : `A new ${config.singular}, ready for your next step.`
        }
        back={cancelTo}
      />
      <RecordForm
        key={id || 'new'}
        config={config}
        record={record.data?.data}
        saving={writer.isPending}
        cancelTo={cancelTo}
        onSave={async (body) => {
          const result = await writer.mutateAsync(body)
          toast.success(
            id
              ? 'Changes saved'
              : `${config.singular[0].toUpperCase()}${config.singular.slice(1)} created`,
          )
          navigate(`/${config.kind}/${result.data.id}`, { replace: true, state: { from } })
        }}
      />
    </>
  )
}
