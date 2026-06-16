import { useState } from 'react';
import type { SectionSchema, FieldSchema } from '../../types/formBuilder';
import { AddCustomFieldSheet } from './AddCustomFieldSheet';

interface SectionSettingsPanelProps {
  section: SectionSchema;
  onUpdate: (patch: Partial<SectionSchema>) => void;
  onDeleteField: (fieldId: string) => void;
  onAddField: (field: Omit<FieldSchema, 'id'>) => void;
  onClose?: () => void; // only used in mobile bottom-sheet mode
}

export function SectionSettingsPanel({ section, onUpdate, onDeleteField, onAddField, onClose }: SectionSettingsPanelProps) {
  const [showAddField, setShowAddField] = useState(false);
  const [fieldOverIdx, setFieldOverIdx] = useState<number | null>(null);
  const [fieldDragSrcIdx, setFieldDragSrcIdx] = useState<number | null>(null);

  const isRepeatable = section.type === 'repeatable';

  function handleFieldDragStart(idx: number) {
    setFieldDragSrcIdx(idx);
  }

  function handleFieldDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (fieldOverIdx !== idx) setFieldOverIdx(idx);
  }

  function handleFieldDrop(idx: number) {
    if (fieldDragSrcIdx !== null && fieldDragSrcIdx !== idx) {
      const fields = [...section.fields];
      const [moved] = fields.splice(fieldDragSrcIdx, 1);
      fields.splice(idx, 0, moved);
      onUpdate({ fields });
    }
    setFieldDragSrcIdx(null);
    setFieldOverIdx(null);
  }

  function handleFieldDragEnd() {
    setFieldDragSrcIdx(null);
    setFieldOverIdx(null);
  }

  return (
    <>
      <div className="fb-settings-panel">
        <div className="fb-settings-panel__header">
          <div className="fb-settings-panel__title">Section Settings</div>
          {onClose && (
            <button className="fb-sheet__close" onClick={onClose} aria-label="Close settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="fb-settings-panel__body">
          {/* Section name */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Section Name</label>
            {section.locked ? (
              <div className="locked-input">
                <span>{section.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            ) : (
              <input
                className="form-input"
                type="text"
                value={section.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Section name"
              />
            )}
          </div>

          {/* Repeatable: row label + add button label */}
          {isRepeatable && (
            <>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Row Label</label>
                {section.locked ? (
                  <div className="locked-input">
                    <span>{section.rowLabel}</span>
                  </div>
                ) : (
                  <input
                    className="form-input"
                    type="text"
                    value={section.rowLabel ?? ''}
                    onChange={(e) => onUpdate({ rowLabel: e.target.value })}
                    placeholder="e.g. Prescription"
                  />
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Add Button Label</label>
                {section.locked ? (
                  <div className="locked-input">
                    <span>{section.addButtonLabel}</span>
                  </div>
                ) : (
                  <input
                    className="form-input"
                    type="text"
                    value={section.addButtonLabel ?? ''}
                    onChange={(e) => onUpdate({ addButtonLabel: e.target.value })}
                    placeholder="e.g. Add another prescription"
                  />
                )}
              </div>
            </>
          )}

          {/* Fields list */}
          <div className="fb-settings-panel__section-label">Fields</div>
          <div className="fb-settings-fields">
            {section.fields.length === 0 && <div className="fb-settings-empty">No fields yet. Add your first field below.</div>}
            {section.fields.map((f, idx) => (
              <div
                key={f.id}
                draggable
                onDragStart={() => handleFieldDragStart(idx)}
                onDragOver={(e) => handleFieldDragOver(e, idx)}
                onDrop={() => handleFieldDrop(idx)}
                onDragEnd={handleFieldDragEnd}
                className={`fb-settings-field-row fb-settings-field-row--draggable${fieldOverIdx === idx && fieldDragSrcIdx !== idx ? ' fb-settings-field-row--over' : ''}`}
              >
                <span className="fb-field-drag-handle" aria-hidden>
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                    <circle cx="2.5" cy="2.5" r="1.5" fill="currentColor" />
                    <circle cx="7.5" cy="2.5" r="1.5" fill="currentColor" />
                    <circle cx="2.5" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="7.5" cy="7" r="1.5" fill="currentColor" />
                    <circle cx="2.5" cy="11.5" r="1.5" fill="currentColor" />
                    <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
                  </svg>
                </span>
                <div className="fb-settings-field-info">
                  <span className="fb-settings-field-label">{f.label}</span>
                  <span className="fb-settings-field-type">{f.type.replace('_', ' ')}</span>
                  {f.required && (
                    <span className="fb-required-dot" style={{ marginLeft: 4 }}>
                      *
                    </span>
                  )}
                  {f.locked && (
                    <span className="fb-core-badge" style={{ marginLeft: 6 }}>
                      Core
                    </span>
                  )}
                </div>
                {!f.locked && (
                  <button className="fb-settings-field-delete" onClick={() => onDeleteField(f.id)} aria-label={`Remove ${f.label}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom field button */}
          <button type="button" className="fb-add-field-btn" onClick={() => setShowAddField(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Custom Field
          </button>
        </div>
      </div>

      <AddCustomFieldSheet
        open={showAddField}
        onAdd={(field) => {
          onAddField(field);
          setShowAddField(false);
        }}
        onClose={() => setShowAddField(false)}
      />
    </>
  );
}
