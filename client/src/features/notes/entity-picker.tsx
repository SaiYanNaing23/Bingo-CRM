import { ChoiceSelect } from '@/components/shared/choice-select'
import { RecordPicker } from '@/components/shared/record-picker'
import { EditorField } from '@/components/shared/editor-frame'
import { friendly } from '@/lib/fields'
import { entityKinds, type EntityType } from './types'

export function EntityPicker({
  type,
  id,
  onChange,
  disabled,
  error,
  filter = false,
}: {
  type: string
  id: string
  onChange: (type: string, id: string) => void
  disabled?: boolean
  error?: string
  filter?: boolean
}) {
  const prefix = filter ? 'filter-' : ''
  const validType = Object.hasOwn(entityKinds, type) ? (type as EntityType) : null
  return (
    <>
      <EditorField id={`${prefix}entity-type`} label={filter ? 'Record type filter' : 'Link to'}>
        <ChoiceSelect
          id={`${prefix}entity-type`}
          value={validType ?? ''}
          disabled={disabled}
          onChange={(next) => onChange(next, '')}
          options={[
            { value: '', label: filter ? 'All records' : 'Standalone note' },
            ...Object.keys(entityKinds).map((value) => ({ value, label: friendly(value) })),
          ]}
        />
      </EditorField>
      {validType && (
        <EditorField
          id={`${prefix}entity-id`}
          label={filter ? 'Linked record filter' : 'Linked record'}
          error={error}
        >
          <RecordPicker
            key={validType}
            kind={entityKinds[validType]}
            id={`${prefix}entity-id`}
            label={filter ? 'Linked record filter' : 'Linked record'}
            value={id}
            disabled={disabled}
            onChange={(next) => onChange(validType, next)}
            invalid={!!error}
            describedBy={`${prefix}entity-id-description`}
            required={!filter}
          />
        </EditorField>
      )}
    </>
  )
}
