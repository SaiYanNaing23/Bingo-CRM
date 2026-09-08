import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader, Loading, EmptyState } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/status-badge'
import { RecordForm } from '@/components/shared/record-form'
import { companiesConfig } from '@/features/companies/config'
export default function DesignPreview() {
  const [view, setView] = useState('list')
  return (
    <main className="page-width p-6 sm:p-10">
      <div role="status" className="mb-6 rounded-lg border bg-accent p-4">
        Design preview · Sample data only. This page is available in development and does not save
        records.
      </div>
      <PageHeader
        title="A considered workspace"
        description="A restrained palette and clear, familiar controls. This preview follows your appearance settings."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {['list', 'detail', 'form', 'loading', 'empty'].map((item) => (
          <Button
            variant={view === item ? 'default' : 'outline'}
            onClick={() => setView(item)}
            key={item}
          >
            {item}
          </Button>
        ))}
      </div>
      {view === 'form' ? (
        <RecordForm
          config={companiesConfig}
          onSave={async () => {
            toast.info('Preview only — nothing was saved.')
          }}
          cancelTo="/design-preview"
          saving={false}
        />
      ) : view === 'loading' ? (
        <Loading />
      ) : view === 'empty' ? (
        <div className="panel">
          <EmptyState
            title="Your companies start here"
            description="Add your first company to begin."
          />
        </div>
      ) : (
        <section className="panel">
          <div className="border-b p-5 font-semibold">
            {view === 'detail' ? 'Sample company details' : 'Sample companies'}
          </div>
          {['Northstar Studio', 'Paperplane Labs', 'Evergreen Technologies']
            .slice(0, view === 'detail' ? 1 : 3)
            .map((name, index) => (
              <div
                key={name}
                className="flex flex-wrap items-center justify-between gap-4 border-b p-5 last:border-0"
              >
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Software · Singapore · Remote
                  </p>
                </div>
                <StatusBadge value={index === 2 ? 'ARCHIVED' : 'ACTIVE'} />
              </div>
            ))}
        </section>
      )}
    </main>
  )
}
