import { useState } from 'react';
import type { FormSchema, SectionSchema, FieldSchema, FieldValue, SectionPreviewState, RepeatableRowValues } from '../../types/formBuilder';

interface PreviewCanvasProps {
  schema: FormSchema;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyRow(fields: FieldSchema[]): RepeatableRowValues {
  return { rowId: uid(), values: Object.fromEntries(fields.map((f) => [f.id, null])) };
}

function initState(schema: FormSchema): SectionPreviewState[] {
  return schema.sections.map((s) => ({
    sectionId: s.id,
    values: s.type === 'standard' ? Object.fromEntries(s.fields.map((f) => [f.id, null])) : undefined,
    rows: s.type === 'repeatable' ? [emptyRow(s.fields)] : undefined
  }));
}

// ─── Single field renderer ────────────────────────────────────────────────────

function FieldInput({ field, value, onChange }: { field: FieldSchema; value: FieldValue; onChange: (v: FieldValue) => void }) {
  const strVal = (value as string) ?? '';

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          className="form-input"
          placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
          value={strVal}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          style={{ height: 88, padding: '10px 12px' }}
        />
      );
    case 'dropdown':
      return (
        <select
          className={`form-select${!strVal ? ' placeholder' : ''}`}
          value={strVal}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'file':
      return (
        <label className="fb-preview-file-label">
          <input type="file" style={{ display: 'none' }} onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
          <span className="fb-preview-file-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {value instanceof File ? value.name : 'Choose file…'}
          </span>
        </label>
      );
    case 'relation':
      return (
        <input
          className="form-input"
          type="text"
          placeholder={`Search ${field.label.toLowerCase()}…`}
          value={(value as string) ?? ''}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          className="form-input"
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}…`}
          value={strVal}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

// ─── Standard section ─────────────────────────────────────────────────────────

function StandardSection({
  section,
  state,
  onValueChange
}: {
  section: SectionSchema;
  state: SectionPreviewState;
  onValueChange: (fieldId: string, value: FieldValue) => void;
}) {
  return (
    <div className="fb-preview-fields-grid">
      {section.fields.map((f) => (
        <div key={f.id} className="form-group" style={{ margin: 0 }}>
          <label className="form-label">
            {f.label}
            {f.required && <span className="fb-required-dot"> *</span>}
          </label>
          <FieldInput field={f} value={state.values?.[f.id] ?? null} onChange={(v) => onValueChange(f.id, v)} />
        </div>
      ))}
    </div>
  );
}

// ─── Repeatable section ───────────────────────────────────────────────────────

function RepeatableSection({
  section,
  state,
  onRowValueChange,
  onAddRow,
  onRemoveRow
}: {
  section: SectionSchema;
  state: SectionPreviewState;
  onRowValueChange: (rowId: string, fieldId: string, value: FieldValue) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
}) {
  const rows = state.rows ?? [];

  return (
    <div className="fb-preview-repeatable">
      {rows.map((row, rowIdx) => (
        <div key={row.rowId} className="fb-preview-repeatable-row">
          <div className="fb-preview-repeatable-row__header">
            <span className="fb-preview-repeatable-row__label">
              {section.rowLabel ?? 'Row'} {rowIdx + 1}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                className="rx-delete-btn"
                onClick={() => onRemoveRow(row.rowId)}
                aria-label={`Remove ${section.rowLabel ?? 'row'} ${rowIdx + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
              </button>
            )}
          </div>
          <div className="fb-preview-fields-grid">
            {section.fields.map((f) => (
              <div key={f.id} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  {f.label}
                  {f.required && <span className="fb-required-dot"> *</span>}
                </label>
                <FieldInput field={f} value={row.values[f.id] ?? null} onChange={(v) => onRowValueChange(row.rowId, f.id, v)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" className="fb-preview-add-row-btn" onClick={onAddRow}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {section.addButtonLabel ?? `Add another ${section.rowLabel?.toLowerCase() ?? 'row'}`}
      </button>
    </div>
  );
}

// ─── Preview canvas ───────────────────────────────────────────────────────────

export function PreviewCanvas({ schema }: PreviewCanvasProps) {
  const [sectionStates, setSectionStates] = useState<SectionPreviewState[]>(() => initState(schema));

  function getState(sectionId: string): SectionPreviewState {
    return sectionStates.find((s) => s.sectionId === sectionId) ?? { sectionId };
  }

  function patchSection(sectionId: string, patch: Partial<SectionPreviewState>) {
    setSectionStates((prev) => prev.map((s) => (s.sectionId === sectionId ? { ...s, ...patch } : s)));
  }

  function handleValueChange(sectionId: string, fieldId: string, value: FieldValue) {
    const st = getState(sectionId);
    patchSection(sectionId, { values: { ...st.values, [fieldId]: value } });
  }

  function handleRowValueChange(sectionId: string, rowId: string, fieldId: string, value: FieldValue) {
    const st = getState(sectionId);
    const rows = (st.rows ?? []).map((r) => (r.rowId === rowId ? { ...r, values: { ...r.values, [fieldId]: value } } : r));
    patchSection(sectionId, { rows });
  }

  function handleAddRow(section: SectionSchema) {
    const st = getState(section.id);
    patchSection(section.id, { rows: [...(st.rows ?? []), emptyRow(section.fields)] });
  }

  function handleRemoveRow(sectionId: string, rowId: string) {
    const st = getState(sectionId);
    patchSection(sectionId, { rows: (st.rows ?? []).filter((r) => r.rowId !== rowId) });
  }

  return (
    <div className="fb-preview-canvas">
      <div className="fb-preview-canvas__title">{schema.name}</div>
      <div className="fb-preview-canvas__subtitle">Fill in all required fields before submitting.</div>

      {schema.sections.map((section) => {
        const state = getState(section.id);
        return (
          <div key={section.id} className="card fb-preview-section">
            <div className="card-header">
              <h3>{section.name}</h3>
              {section.locked && <span className="fb-badge fb-badge--locked">Required</span>}
            </div>
            <div className="card-body">
              {section.type === 'standard' ? (
                <StandardSection section={section} state={state} onValueChange={(fieldId, value) => handleValueChange(section.id, fieldId, value)} />
              ) : (
                <RepeatableSection
                  section={section}
                  state={state}
                  onRowValueChange={(rowId, fieldId, value) => handleRowValueChange(section.id, rowId, fieldId, value)}
                  onAddRow={() => handleAddRow(section)}
                  onRemoveRow={(rowId) => handleRemoveRow(section.id, rowId)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
