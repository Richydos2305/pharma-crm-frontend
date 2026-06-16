import { useState, useEffect } from 'react';
import type { FieldSchema, FieldType } from '../../types/formBuilder';
import { ScrollFadeContainer } from '../ScrollFadeContainer';

interface AddCustomFieldSheetProps {
  open: boolean;
  onAdd: (field: Omit<FieldSchema, 'id'>) => void;
  onClose: () => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'short_text',
    label: 'Short Text',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V5h16v2" />
        <path d="M9 20h6" />
        <line x1="12" y1="5" x2="12" y2="20" />
      </svg>
    )
  },
  {
    type: 'number',
    label: 'Number',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9l4-4 4 4" />
        <path d="M8 5v14" />
        <path d="M14 15l4 4 4-4" />
        <path d="M18 5v14" />
      </svg>
    )
  },
  {
    type: 'date',
    label: 'Date',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <polyline points="8 10 12 14 16 10" />
      </svg>
    )
  },
  {
    type: 'file',
    label: 'File',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="13" x2="12" y2="17" />
        <line x1="10" y1="15" x2="14" y2="15" />
      </svg>
    )
  }
];

export function AddCustomFieldSheet({ open, onAdd, onClose }: AddCustomFieldSheetProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('short_text');
  const [required, setRequired] = useState(false);
  const [labelError, setLabelError] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabel('');
      setType('short_text');
      setRequired(false);
      setLabelError('');
    }
  }, [open]);

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) {
      setLabelError('Please enter a field label.');
      return;
    }
    onAdd({ label: trimmed, type, required });
    onClose();
  }

  return (
    <div className={`fb-sheet-overlay${open ? ' open' : ''}`} onClick={onClose} role="dialog" aria-modal aria-label="Add custom field">
      <div className="fb-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fb-sheet__header">
          <div>
            <div className="fb-sheet__title">Add Custom Field</div>
            <div className="fb-sheet__subtitle">Define a new column in this section</div>
          </div>
          <button className="fb-sheet__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ScrollFadeContainer className="fb-sheet__body">
          {/* Field label */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="fb-field-label">
              Field Label
            </label>
            <input
              id="fb-field-label"
              className={`form-input${labelError ? ' error' : ''}`}
              type="text"
              placeholder="e.g. Blood Type"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelError('');
              }}
              autoFocus
            />
            {labelError && <span className="field-error">{labelError}</span>}
          </div>

          {/* Field type grid */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Field Type</label>
            <div className="fb-type-grid">
              {FIELD_TYPES.map(({ type: t, label: l, icon }) => (
                <button key={t} type="button" className={`fb-type-tile${type === t ? ' fb-type-tile--selected' : ''}`} onClick={() => setType(t)}>
                  <span className="fb-type-tile__icon">{icon}</span>
                  <span className="fb-type-tile__label">{l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Required toggle */}
          <div className="fb-toggle-row">
            <div>
              <div className="fb-toggle-label">Required</div>
              <div className="fb-toggle-hint">Form cannot be submitted without this field</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={required}
              className={`fb-toggle${required ? ' fb-toggle--on' : ''}`}
              onClick={() => setRequired((r) => !r)}
            >
              <span className="fb-toggle__thumb" />
            </button>
          </div>
        </ScrollFadeContainer>

        <div className="fb-sheet__footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-save" onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
}
