import { useState } from 'react';
import type { FormSchema, FieldSchema, SectionSchema } from '../types/formBuilder';
import type { IPharmacist, CreatePatientPayload, FileMetadata } from '../types';
import { deletePatientFile } from '../api/patients';
import type { FileFieldState, FileState, RepeatableRow, FormState } from './schemaFormUtils';

// ─── Private type aliases ─────────────────────────────────────────────────────

type FieldValues = Record<string, string>;

// ─── Core field mapping ───────────────────────────────────────────────────────
// Fields with these IDs map to top-level patient fields (not customFields).
// Everything else (including core-appointment-date) goes into customFields.

const CORE_TOP_LEVEL: Record<string, string> = {
  'core-full-name': 'fullName',
  'core-age': 'age',
  'core-phone': 'phoneNumber',
  'core-address': 'address',
  'core-attended-by': 'pharmacistName',
  'core-notes': 'notes'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function initState(schema: FormSchema): FormState {
  const state: FormState = {};
  for (const section of schema.sections) {
    state[section.id] = section.type === 'standard' ? {} : [];
  }
  return state;
}

function initFileState(schema: FormSchema, initial?: FileState): FileState {
  const fs: FileState = {};
  for (const section of schema.sections) {
    if (section.type !== 'standard') continue;
    for (const field of section.fields) {
      if (field.type !== 'file') continue;
      fs[field.id] = initial?.[field.id] ?? { existing: [], pending: [] };
    }
  }
  return fs;
}

// ─── Build API payload from form state ───────────────────────────────────────

function buildPayload(schema: FormSchema, state: FormState, isUpdate = false): CreatePatientPayload {
  const payload: Record<string, unknown> = {};
  const customFields: Record<string, unknown> = {};

  for (const section of schema.sections) {
    if (section.type === 'standard') {
      const values = (state[section.id] as FieldValues) ?? {};
      for (const field of section.fields) {
        if (field.type === 'file') continue; // files uploaded post-save
        const value = values[field.id] ?? '';
        const coreKey = CORE_TOP_LEVEL[field.id];
        if (coreKey) {
          // pharmacistName is set at creation only — never send on update
          if (isUpdate && coreKey === 'pharmacistName') continue;
          if (coreKey === 'age') {
            payload[coreKey] = value ? Number(value) : 0;
          } else if (value) {
            payload[coreKey] = value;
          }
        } else if (value) {
          // core-appointment-date and all custom fields go here
          customFields[field.id] = value;
        }
      }
    } else {
      // Repeatable: all rows go to customFields keyed by section.id
      const rows = (state[section.id] as RepeatableRow[]) ?? [];
      if (rows.length > 0) {
        customFields[section.id] = rows.map((r) => r.values);
      }
    }
  }

  payload.customFields = customFields;
  return payload as unknown as CreatePatientPayload;
}

// ─── Field input renderer ─────────────────────────────────────────────────────

interface FieldInputProps {
  field: FieldSchema;
  value: string;
  onChange: (value: string) => void;
  pharmacists: IPharmacist[];
  disabled?: boolean;
}

function FieldInput({ field, value, onChange, pharmacists, disabled }: FieldInputProps) {
  const isFullWidth = field.type === 'textarea' || field.type === 'relation';

  const input = (() => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className="form-input"
            placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );

      case 'relation':
        if (disabled) {
          return (
            <div className="locked-input">
              <span>{value || '—'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          );
        }
        return (
          <select
            className={`form-select${!value ? ' placeholder' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Select pharmacist…</option>
            {pharmacists.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        );

      case 'dropdown':
        return (
          <select
            className={`form-select${!value ? ' placeholder' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            className="form-input"
            type="number"
            placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <input
            className="form-input"
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );

      default: // short_text
        return (
          <input
            className="form-input"
            type="text"
            placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );
    }
  })();

  return (
    <div className="form-group" style={{ margin: 0, ...(isFullWidth ? { gridColumn: '1 / -1' } : {}) }}>
      <label className="form-label">
        {field.label}
        {field.required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
      </label>
      {input}
    </div>
  );
}

// ─── Standard section ─────────────────────────────────────────────────────────

interface FileFieldInputProps {
  field: FieldSchema;
  fileFieldState: FileFieldState;
  onAddFiles: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  onDeleteExisting: (publicId: string) => Promise<void>;
}

function FileFieldInput({ field, fileFieldState, onAddFiles, onRemovePending, onDeleteExisting }: FileFieldInputProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(publicId: string) {
    setDeletingId(publicId);
    try {
      await onDeleteExisting(publicId);
    } finally {
      setDeletingId(null);
    }
  }

  const hasFiles = fileFieldState.existing.length + fileFieldState.pending.length > 0;

  return (
    <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
      <label className="form-label">
        {field.label}
        {field.required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
      </label>
      <div className="file-field">
        {fileFieldState.existing.map((f) => (
          <div key={f.publicId} className="file-chip file-chip--existing">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <a href={f.url} target="_blank" rel="noreferrer" className="file-chip__name">
              {f.name}
            </a>
            <button
              type="button"
              className="file-chip__remove"
              onClick={() => handleDelete(f.publicId)}
              disabled={deletingId === f.publicId}
              title="Delete file"
            >
              {deletingId === f.publicId ? (
                <span style={{ fontSize: 11, lineHeight: 1 }}>…</span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              )}
            </button>
          </div>
        ))}
        {fileFieldState.pending.map((f, i) => (
          <div key={i} className="file-chip file-chip--pending">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="file-chip__name">{f.name}</span>
            <button type="button" className="file-chip__remove" onClick={() => onRemovePending(i)} title="Remove">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        <label className="file-pick-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {hasFiles ? 'Add more files' : 'Add files'}
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) onAddFiles(files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}

interface StandardSectionProps {
  section: SectionSchema;
  values: FieldValues;
  onFieldChange: (fieldId: string, value: string) => void;
  pharmacists: IPharmacist[];
  isUpdate: boolean;
  fileState: FileState;
  onAddFiles: (fieldId: string, files: File[]) => void;
  onRemovePending: (fieldId: string, index: number) => void;
  onDeleteExisting: (fieldId: string, publicId: string) => Promise<void>;
}

function StandardSection({
  section,
  values,
  onFieldChange,
  pharmacists,
  isUpdate,
  fileState,
  onAddFiles,
  onRemovePending,
  onDeleteExisting
}: StandardSectionProps) {
  return (
    <div className="card form-section">
      <div className="card-header">
        <h3>{section.name}</h3>
      </div>
      <div className="card-body">
        <div className="form-grid-2">
          {section.fields.map((field) =>
            field.type === 'file' ? (
              <FileFieldInput
                key={field.id}
                field={field}
                fileFieldState={fileState[field.id] ?? { existing: [], pending: [] }}
                onAddFiles={(files) => onAddFiles(field.id, files)}
                onRemovePending={(i) => onRemovePending(field.id, i)}
                onDeleteExisting={(publicId) => onDeleteExisting(field.id, publicId)}
              />
            ) : (
              <FieldInput
                key={field.id}
                field={field}
                value={values[field.id] ?? ''}
                onChange={(v) => onFieldChange(field.id, v)}
                pharmacists={pharmacists}
                disabled={isUpdate && field.id === 'core-attended-by'}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Repeatable section ───────────────────────────────────────────────────────

interface RepeatableSectionProps {
  section: SectionSchema;
  rows: RepeatableRow[];
  onRowsChange: (rows: RepeatableRow[]) => void;
  pharmacists: IPharmacist[];
}

function RepeatableSection({ section, rows, onRowsChange, pharmacists }: RepeatableSectionProps) {
  function addRow() {
    const emptyValues: FieldValues = {};
    for (const f of section.fields) {
      if (f.type !== 'file') emptyValues[f.id] = '';
    }
    onRowsChange([...rows, { rowId: uid(), values: emptyValues }]);
  }

  function removeRow(rowId: string) {
    onRowsChange(rows.filter((r) => r.rowId !== rowId));
  }

  function updateRowField(rowId: string, fieldId: string, value: string) {
    onRowsChange(rows.map((r) => (r.rowId === rowId ? { ...r, values: { ...r.values, [fieldId]: value } } : r)));
  }

  return (
    <div className="card form-section">
      <div className="card-header">
        <h3>{section.name}</h3>
        <button type="button" className="add-rx-btn" onClick={addRow}>
          + {section.addButtonLabel ?? `Add ${section.rowLabel ?? 'row'}`}
        </button>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {rows.map((row, i) => (
          <div className="rx-section" key={row.rowId}>
            <div className="rx-label-row" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)' }}>
                {section.rowLabel ?? 'Row'} {i + 1}
              </span>
              <button type="button" className="rx-delete-btn" onClick={() => removeRow(row.rowId)} title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
            <div className="form-grid-2">
              {section.fields
                .filter((f) => f.type !== 'file')
                .map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={row.values[field.id] ?? ''}
                    onChange={(v) => updateRowField(row.rowId, field.id, v)}
                    pharmacists={pharmacists}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main SchemaForm ──────────────────────────────────────────────────────────

interface SchemaFormProps {
  schema: FormSchema;
  initialState?: FormState;
  initialFileState?: FileState;
  pharmacists?: IPharmacist[];
  onSubmit: (payload: CreatePatientPayload, fileState: FileState) => Promise<void>;
  onExistingFileDeleted?: (fieldId: string, remaining: FileMetadata[]) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
  error?: string;
  isUpdate?: boolean;
}

export function SchemaForm({
  schema,
  initialState,
  initialFileState,
  pharmacists = [],
  onSubmit,
  onExistingFileDeleted,
  onCancel,
  submitLabel,
  loading,
  error,
  isUpdate = false
}: SchemaFormProps) {
  const [state, setState] = useState<FormState>(() => ({
    ...initState(schema),
    ...initialState
  }));

  const [fileState, setFileState] = useState<FileState>(() => initFileState(schema, initialFileState));

  function addFiles(fieldId: string, files: File[]) {
    setFileState((s) => ({
      ...s,
      [fieldId]: { ...s[fieldId], pending: [...(s[fieldId]?.pending ?? []), ...files] }
    }));
  }

  function removePending(fieldId: string, index: number) {
    setFileState((s) => ({
      ...s,
      [fieldId]: { ...s[fieldId], pending: s[fieldId].pending.filter((_, i) => i !== index) }
    }));
  }

  async function deleteExisting(fieldId: string, publicId: string) {
    await deletePatientFile(publicId);
    const remaining = (fileState[fieldId]?.existing ?? []).filter((f) => f.publicId !== publicId);
    setFileState((s) => ({
      ...s,
      [fieldId]: { ...s[fieldId], existing: remaining }
    }));
    await onExistingFileDeleted?.(fieldId, remaining);
  }

  function setFieldValue(sectionId: string, fieldId: string, value: string) {
    setState((s) => ({
      ...s,
      [sectionId]: {
        ...(s[sectionId] as FieldValues),
        [fieldId]: value
      }
    }));
  }

  function setRows(sectionId: string, rows: RepeatableRow[]) {
    setState((s) => ({ ...s, [sectionId]: rows }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(buildPayload(schema, state, isUpdate), fileState);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      {schema.sections.map((section) =>
        section.type === 'standard' ? (
          <StandardSection
            key={section.id}
            section={section}
            values={(state[section.id] as FieldValues) ?? {}}
            onFieldChange={(fieldId, value) => setFieldValue(section.id, fieldId, value)}
            pharmacists={pharmacists}
            isUpdate={isUpdate}
            fileState={fileState}
            onAddFiles={addFiles}
            onRemovePending={removePending}
            onDeleteExisting={deleteExisting}
          />
        ) : (
          <RepeatableSection
            key={section.id}
            section={section}
            rows={(state[section.id] as RepeatableRow[]) ?? []}
            onRowsChange={(rows) => setRows(section.id, rows)}
            pharmacists={pharmacists}
          />
        )
      )}

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
