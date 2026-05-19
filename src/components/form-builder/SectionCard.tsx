import type { SectionSchema } from '../../types/formBuilder';

interface SectionCardProps {
  section: SectionSchema;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  short_text: 'Short Text',
  number: 'Number',
  date: 'Date',
  textarea: 'Textarea',
  dropdown: 'Dropdown',
  file: 'File',
  relation: 'Relation'
};

export function SectionCard({ section, isSelected, onSelect, onDelete }: SectionCardProps) {
  const isRepeatable = section.type === 'repeatable';

  return (
    <div
      className={`fb-section-card${isSelected ? ' fb-section-card--selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-pressed={isSelected}
    >
      {/* Section card header */}
      <div className="fb-section-card__header">
        <div className="fb-section-card__title-row">
          {/* Drag handle (visual only) */}
          {!section.locked && (
            <span className="fb-drag-handle" aria-hidden>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <circle cx="3" cy="3" r="1.5" fill="currentColor" />
                <circle cx="9" cy="3" r="1.5" fill="currentColor" />
                <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                <circle cx="9" cy="8" r="1.5" fill="currentColor" />
                <circle cx="3" cy="13" r="1.5" fill="currentColor" />
                <circle cx="9" cy="13" r="1.5" fill="currentColor" />
              </svg>
            </span>
          )}
          <span className="fb-section-card__name">{section.name}</span>
          <span className={`fb-badge${section.locked ? ' fb-badge--locked' : isRepeatable ? ' fb-badge--repeatable' : ' fb-badge--standard'}`}>
            {section.locked ? 'Locked' : isRepeatable ? 'Repeatable Rows' : 'Standard'}
          </span>
        </div>

        {!section.locked && onDelete && (
          <button
            className="fb-section-card__delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${section.name} section`}
            title="Delete section"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Field preview */}
      <div className="fb-section-card__body">
        {isRepeatable ? (
          <>
            {/* Desktop: table-style header + ghost row */}
            <div className="fb-repeatable-desktop-only">
              <div className="fb-repeatable-header">
                {section.fields.map((f) => (
                  <div key={f.id} className="fb-repeatable-col">
                    <span className="fb-col-label">{f.label}</span>
                    {f.required && (
                      <span className="fb-required-dot" aria-label="required">
                        *
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="fb-repeatable-row fb-repeatable-row--ghost">
                {section.fields.map((f) => (
                  <div key={f.id} className="fb-repeatable-cell">
                    <div className="fb-field-stub">{FIELD_TYPE_LABELS[f.type]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: same grid layout as standard sections */}
            <div className="fb-fields-grid fb-repeatable-mobile-only">
              {section.fields.map((f) => (
                <div key={f.id} className="fb-field-preview">
                  <div className="fb-field-preview__label">
                    {f.label}
                    {f.required && (
                      <span className="fb-required-dot" aria-label="required">
                        {' '}
                        *
                      </span>
                    )}
                  </div>
                  <div className="fb-field-stub">{FIELD_TYPE_LABELS[f.type]}</div>
                </div>
              ))}
            </div>

            <div className="fb-repeatable-add-hint">+ {section.addButtonLabel ?? `Add another ${section.rowLabel ?? 'row'}`}</div>
          </>
        ) : (
          <div className="fb-fields-grid">
            {section.fields.map((f) => (
              <div key={f.id} className="fb-field-preview">
                <div className="fb-field-preview__label">
                  {f.label}
                  {f.required && (
                    <span className="fb-required-dot" aria-label="required">
                      {' '}
                      *
                    </span>
                  )}
                  {f.locked && (
                    <span className="fb-core-badge" title="Core field — cannot be removed">
                      Core
                    </span>
                  )}
                </div>
                <div className="fb-field-stub">{FIELD_TYPE_LABELS[f.type]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile tap affordance */}
      {!section.locked && (
        <div className="fb-card-tap-hint" aria-hidden="true">
          Tap to edit
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </div>
  );
}
