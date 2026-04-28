import { useState, useRef, useEffect } from 'react';
import type { IPharmacist } from '../types';

export interface CustomFieldEntry {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date';
  value: string;
}

export interface PatientFormValues {
  fullName: string;
  age: string;
  phoneNumber: string;
  address: string;
  pharmacistName: string;
  appointmentDate: string;
  notes: string;
  prescriptions: { text: string }[];
  customFields: CustomFieldEntry[];
}

interface PatientFormProps {
  initialValues?: Partial<PatientFormValues>;
  onSubmit: (values: PatientFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
  error?: string;
  pharmacists?: IPharmacist[];
  isUpdate?: boolean;
}

const DEFAULT_VALUES: PatientFormValues = {
  fullName: '',
  age: '',
  phoneNumber: '',
  address: '',
  pharmacistName: '',
  appointmentDate: '',
  notes: '',
  prescriptions: [],
  customFields: []
};

export function PatientForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  error,
  pharmacists = [],
  isUpdate = false
}: PatientFormProps) {
  const [values, setValues] = useState<PatientFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const rxContainerRef = useRef<HTMLDivElement>(null);
  const shouldFocusLastRx = useRef(false);

  useEffect(() => {
    if (shouldFocusLastRx.current && rxContainerRef.current) {
      shouldFocusLastRx.current = false;
      const sections = rxContainerRef.current.querySelectorAll('.rx-section');
      const last = sections[sections.length - 1];
      const textarea = last?.querySelector('textarea') as HTMLTextAreaElement | null;
      textarea?.focus();
    }
  }, [values.prescriptions.length]);

  function set(field: keyof PatientFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  // Prescriptions as textarea rows
  function addRx() {
    shouldFocusLastRx.current = true;
    setValues((v) => ({
      ...v,
      prescriptions: [...v.prescriptions, { text: '' }]
    }));
  }

  function updateRxText(index: number, text: string) {
    setValues((v) => ({
      ...v,
      prescriptions: v.prescriptions.map((rx, i) => (i === index ? { text } : rx))
    }));
  }

  function removeRx(index: number) {
    setValues((v) => ({ ...v, prescriptions: v.prescriptions.filter((_, i) => i !== index) }));
  }

  // Custom fields
  function addCustomField() {
    const id = `cf_${Date.now()}`;
    setValues((v) => ({
      ...v,
      customFields: [...v.customFields, { id, name: '', type: 'text', value: '' }]
    }));
  }

  function updateCustomField(id: string, patch: Partial<CustomFieldEntry>) {
    setValues((v) => ({
      ...v,
      customFields: v.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f))
    }));
  }

  function removeCustomField(id: string) {
    setValues((v) => ({ ...v, customFields: v.customFields.filter((f) => f.id !== id) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      {/* Personal Information */}
      <div className="card form-section">
        <div className="card-header">
          <h3>Personal Information</h3>
          <button type="button" className="add-field-btn" onClick={addCustomField}>
            + Add Custom Field
          </button>
        </div>
        <div className="card-body">
          <div className="form-grid-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                className="form-input"
                type="text"
                placeholder="e.g. Margaret Osei"
                value={values.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                className="form-input"
                type="number"
                placeholder="e.g. 0.5 (6 months), 5, 47"
                min={0}
                step={0.1}
                value={values.age}
                onChange={(e) => set('age', e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                className="form-input"
                type="tel"
                placeholder="+1 (600) 000-0000"
                value={values.phoneNumber}
                onChange={(e) => set('phoneNumber', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="address">
                Home Address
              </label>
              <input
                id="address"
                className="form-input"
                type="text"
                placeholder="123 Main St, City, State"
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>
          </div>

          {/* Attended To By */}
          <div className="form-group" style={{ margin: '8px 0 0' }}>
            <label className="form-label" htmlFor="pharmacistName">
              Attended To By
            </label>
            {isUpdate ? (
              <div className="locked-input">
                <span>{values.pharmacistName || '—'}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            ) : (
              <select
                id="pharmacistName"
                className={`form-select${!values.pharmacistName ? ' placeholder' : ''}`}
                value={values.pharmacistName}
                onChange={(e) => set('pharmacistName', e.target.value)}
              >
                <option value="">Select pharmacist...</option>
                {pharmacists.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Custom fields (personal section) */}
          {values.customFields.length > 0 && (
            <div className="custom-fields-container">
              {values.customFields.map((cf, idx) => (
                <div key={cf.id} className="custom-field-section">
                  <span className="custom-field-label">Custom Field {idx + 1}</span>
                  <div className="custom-field-row">
                    <div className="form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="form-label">Field Name</label>
                      <input
                        className="form-input custom-field-input"
                        type="text"
                        placeholder="e.g. Blood Type"
                        value={cf.name}
                        onChange={(e) => updateCustomField(cf.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Field Type</label>
                      <select
                        className="custom-field-type"
                        value={cf.type}
                        onChange={(e) => updateCustomField(cf.id, { type: e.target.value as CustomFieldEntry['type'] })}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="textarea">Textarea</option>
                      </select>
                    </div>
                    <button type="button" className="custom-field-delete" onClick={() => removeCustomField(cf.id)} aria-label="Remove field">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                  {/* Value input for the custom field */}
                  <div style={{ paddingLeft: 0 }}>
                    {cf.type === 'textarea' ? (
                      <textarea
                        className="form-input"
                        placeholder="Value..."
                        value={cf.value}
                        onChange={(e) => updateCustomField(cf.id, { value: e.target.value })}
                      />
                    ) : (
                      <input
                        className="form-input"
                        type={cf.type}
                        placeholder="Value..."
                        value={cf.value}
                        onChange={(e) => updateCustomField(cf.id, { value: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medical Information */}
      <div className="card form-section">
        <div className="card-header">
          <h3>Medical Information</h3>
          <button type="button" className="add-field-btn" onClick={addCustomField}>
            + Add Custom Field
          </button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="apptDate">
              Appointment Date
            </label>
            <input
              id="apptDate"
              className="form-input"
              type="date"
              value={values.appointmentDate}
              onChange={(e) => set('appointmentDate', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="form-input"
              placeholder="Add any relevant medical notes..."
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Prescriptions */}
      <div className="card form-section">
        <div className="card-header">
          <h3>Prescriptions</h3>
          <button type="button" className="add-rx-btn" onClick={addRx}>
            + Add Prescription
          </button>
        </div>
        <div ref={rxContainerRef} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {values.prescriptions.map((rx, i) => (
            <div className="rx-section" key={i}>
              <div className="rx-label-row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="rx-delete-btn" onClick={() => removeRx(i)} title="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
              <textarea
                className="form-input"
                placeholder="e.g. Metformin 500mg, twice daily..."
                value={rx.text}
                onChange={(e) => updateRxText(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop form actions */}
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-save" disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>

      {/* Mobile form actions */}
      <div className="mobile-form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-save" disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
