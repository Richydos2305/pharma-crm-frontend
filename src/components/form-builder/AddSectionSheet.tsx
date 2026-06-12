import { useState } from 'react';
import type { SectionSchema, SectionType } from '../../types/formBuilder';
import { ScrollFadeContainer } from '../ScrollFadeContainer';
import { PRESET_ALLERGIES_SECTION } from '../../types/formBuilder';

interface AddSectionSheetProps {
  onAdd: (section: Omit<SectionSchema, 'id'>) => void;
  onClose: () => void;
}

type Step = 'choose-type' | 'configure';

const SECTION_TYPES: { type: SectionType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'standard',
    label: 'Standard',
    description: 'A simple section with one set of fields per form submission.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="5" rx="1" />
        <rect x="3" y="10" width="18" height="5" rx="1" />
        <rect x="3" y="17" width="18" height="4" rx="1" />
      </svg>
    )
  },
  {
    type: 'repeatable',
    label: 'Repeatable Rows',
    description: 'Multiple instances of the same row — ideal for prescriptions, allergies, or visits.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 10h16M4 14h16M4 18h10" />
        <path d="M17 17l3 3-3 3" />
      </svg>
    )
  }
];

const PRESETS = [
  {
    key: 'allergies',
    label: 'Allergies',
    description: 'Allergy, reaction, severity, and notes',
    section: PRESET_ALLERGIES_SECTION
  }
];

export function AddSectionSheet({ onAdd, onClose }: AddSectionSheetProps) {
  const [step, setStep] = useState<Step>('choose-type');
  const [sectionType, setSectionType] = useState<SectionType>('standard');
  const [name, setName] = useState('');
  const [rowLabel, setRowLabel] = useState('');
  const [nameError, setNameError] = useState('');

  function handleTypeSelect(type: SectionType) {
    setSectionType(type);
    setStep('configure');
  }

  function handlePreset(section: Omit<SectionSchema, 'id'>) {
    onAdd(section);
    onClose();
  }

  function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Please enter a section name.');
      return;
    }
    const section: Omit<SectionSchema, 'id'> = {
      name: trimmedName,
      type: sectionType,
      fields: [],
      ...(sectionType === 'repeatable'
        ? {
            rowLabel: rowLabel.trim() || trimmedName,
            addButtonLabel: `Add another ${rowLabel.trim() || trimmedName.toLowerCase()}`
          }
        : {})
    };
    onAdd(section);
    onClose();
  }

  return (
    <div className="fb-sheet-overlay" onClick={onClose} role="dialog" aria-modal aria-label="Add section">
      <div className="fb-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="fb-sheet__header">
          <div>
            <div className="fb-sheet__title">
              {step === 'choose-type' ? 'Add Section' : `New ${sectionType === 'repeatable' ? 'Repeatable' : 'Standard'} Section`}
            </div>
            <div className="fb-sheet__subtitle">{step === 'choose-type' ? 'Choose a section type or pick a preset' : 'Configure your section'}</div>
          </div>
          <button className="fb-sheet__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ScrollFadeContainer className="fb-sheet__body">
          {step === 'choose-type' ? (
            <>
              {/* Section type tiles */}
              <div className="fb-section-type-list">
                {SECTION_TYPES.map(({ type, label, description, icon }) => (
                  <button key={type} type="button" className="fb-section-type-tile" onClick={() => handleTypeSelect(type)}>
                    <span className="fb-section-type-tile__icon">{icon}</span>
                    <span className="fb-section-type-tile__body">
                      <span className="fb-section-type-tile__label">{label}</span>
                      <span className="fb-section-type-tile__desc">{description}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Presets divider */}
              <div className="fb-sheet__divider">
                <span>Preset Sections</span>
              </div>

              <div className="fb-preset-list">
                {PRESETS.map((p) => (
                  <button key={p.key} type="button" className="fb-preset-tile" onClick={() => handlePreset(p.section)}>
                    <span className="fb-preset-tile__label">{p.label}</span>
                    <span className="fb-preset-tile__desc">{p.description}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="fb-sheet__back"
                onClick={() => {
                  setStep('choose-type');
                  setNameError('');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="fb-section-name">
                  Section Name
                </label>
                <input
                  id="fb-section-name"
                  className={`form-input${nameError ? ' error' : ''}`}
                  type="text"
                  placeholder={sectionType === 'repeatable' ? 'e.g. Prescriptions' : 'e.g. Emergency Contact'}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                  }}
                  autoFocus
                />
                {nameError && <span className="field-error">{nameError}</span>}
              </div>

              {sectionType === 'repeatable' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="fb-row-label">
                    Row Label
                  </label>
                  <input
                    id="fb-row-label"
                    className="form-input"
                    type="text"
                    placeholder='e.g. Prescription (used in "Add another ___")'
                    value={rowLabel}
                    onChange={(e) => setRowLabel(e.target.value)}
                  />
                  {rowLabel && <span className="fb-hint">Button will read: "Add another {rowLabel.trim().toLowerCase() || '...'}"</span>}
                </div>
              )}
            </>
          )}
        </ScrollFadeContainer>

        {step === 'configure' && (
          <div className="fb-sheet__footer">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-save" onClick={handleCreate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
