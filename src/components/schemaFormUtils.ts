import type { FormSchema } from '../types/formBuilder';
import type { IPatient, FileMetadata, CreatePatientPayload } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldValues = Record<string, string>;
type SectionState = FieldValues | RepeatableRow[];

export type FileFieldState = { existing: FileMetadata[]; pending: File[] };
export type FileState = Record<string, FileFieldState>;
export type RepeatableRow = { rowId: string; values: FieldValues; isNew?: boolean };
export type FormState = Record<string, SectionState>;

// ─── Private helpers ──────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const CORE_TOP_LEVEL: Record<string, string> = {
  'core-full-name': 'fullName',
  'core-age': 'age',
  'core-phone': 'phoneNumber',
  'core-address': 'address',
  'core-attended-by': 'pharmacistName',
  'core-notes': 'notes'
};

// ─── Hydrate state from an existing patient (for UpdatePatientPage) ───────────
// Uses formSnapshot schema to know which fields exist.
// Falls back to legacy top-level fields for old records.

export function hydrateState(schema: FormSchema, patient: IPatient): FormState {
  const state: FormState = {};

  for (const section of schema.sections) {
    if (section.type === 'standard') {
      const values: FieldValues = {};

      for (const field of section.fields) {
        if (field.type === 'file') continue; // file fields handled via hydrateFileState
        const coreKey = CORE_TOP_LEVEL[field.id];

        if (coreKey) {
          if (coreKey === 'age') {
            values[field.id] = patient.age != null ? String(patient.age) : '';
          } else {
            values[field.id] = String((patient as unknown as Record<string, unknown>)[coreKey] ?? '');
          }
        } else if (field.id === 'core-appointment-date') {
          // New: customFields['core-appointment-date']
          // Legacy fallback: patient.appointmentDates[]
          const cfVal = patient.customFields?.['core-appointment-date'];
          if (cfVal) {
            values[field.id] = String(cfVal);
          } else if (patient.appointmentDates?.length) {
            values[field.id] = new Date(patient.appointmentDates[patient.appointmentDates.length - 1]).toISOString().slice(0, 10);
          } else {
            values[field.id] = '';
          }
        } else {
          const cfVal = patient.customFields?.[field.id];
          values[field.id] = cfVal != null ? String(cfVal) : '';
        }
      }

      state[section.id] = values;
    } else {
      // Repeatable section
      if (section.id === 'core-prescriptions') {
        // New: customFields['core-prescriptions'] = [{ 'core-prescription-text': '...' }]
        // Legacy fallback: patient.prescriptions: string[]
        const newRows = patient.customFields?.['core-prescriptions'];
        if (Array.isArray(newRows) && newRows.length > 0) {
          state[section.id] = (newRows as Array<Record<string, string>>).map((row) => ({
            rowId: uid(),
            values: row,
            isNew: false
          }));
        } else if (Array.isArray(patient.prescriptions) && patient.prescriptions.length > 0) {
          state[section.id] = patient.prescriptions.map((text) => ({
            rowId: uid(),
            values: { 'core-prescription-text': text },
            isNew: false
          }));
        } else {
          state[section.id] = [];
        }
      } else {
        const rows = patient.customFields?.[section.id];
        if (Array.isArray(rows) && rows.length > 0) {
          state[section.id] = (rows as Array<Record<string, string>>).map((row) => ({
            rowId: uid(),
            values: row,
            isNew: false
          }));
        } else {
          state[section.id] = [];
        }
      }
    }
  }

  return state;
}

// ─── Hydrate file state from an existing patient ──────────────────────────────

export function hydrateFileState(schema: FormSchema, patient: IPatient): FileState {
  const fs: FileState = {};
  for (const section of schema.sections) {
    if (section.type !== 'standard') continue;
    for (const field of section.fields) {
      if (field.type !== 'file') continue;
      const cfVal = patient.customFields?.[field.id];
      fs[field.id] = {
        existing: Array.isArray(cfVal) ? (cfVal as FileMetadata[]) : [],
        pending: []
      };
    }
  }
  return fs;
}

// ─── Build API payload from form state ───────────────────────────────────────

export function buildPayload(schema: FormSchema, state: FormState, isUpdate = false): CreatePatientPayload {
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
