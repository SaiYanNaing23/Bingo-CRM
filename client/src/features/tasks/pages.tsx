import { ResourceList } from '@/components/shared/resource-list'
import { ResourceDetail } from '@/components/shared/resource-detail'
import { ResourceEdit } from '@/components/shared/resource-edit'
import { tasksConfig as config } from './config'
export default function Pages({ view }: { view: 'list' | 'detail' | 'edit' }) {
  return view === 'list' ? (
    <ResourceList config={config} />
  ) : view === 'detail' ? (
    <ResourceDetail config={config} />
  ) : (
    <ResourceEdit config={config} />
  )
}
