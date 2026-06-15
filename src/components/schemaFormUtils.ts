import type { FormSchema } from '../types/formBuilder';
import type { IPatient, FileMetadata, CreatePatientPayload } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldValues = Record<string, string>;
type SectionState = FieldValues | RepeatableRow[];

export type FileFieldState = { existing: FileMetadata[]; pending: File[] };
export type FileState = Record<string, FileFieldState>;
// sectionId → rowId → fieldId → FileFieldState
export type RepeatableFileState = Record<string, Record<string, Record<string, FileFieldState>>>;
export type RepeatableRow = { rowId: string; values: FieldValues; isNew?: boolean };
export type FormState = Record<string, SectionState>;

// ─── Private helpers ──────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const CORE_TOP_LEVEL: Record<string, string> = {
  'core-full-name': 'fullName',
  'core-age': 'age',
  'core-phone-number': 'phoneNumber'
};

// ─── Hydrate state from an existing patient (for UpdatePatientPage) ───────────
// Uses formSnapshot schema to know which fields exist.

export function hydrateState(schema: FormSchema, patient: IPatient): FormState {
  const state: FormState = {};

  for (const section of schema.sections) {
    const match = patient.customFields?.sections?.find((s) => s.name === section.id);

    if (section.type === 'standard') {
      const values: FieldValues = {};
      const row = match?.fields?.[0];

      for (const field of section.fields) {
        if (field.type === 'file') continue; // file fields handled via hydrateFileState
        const coreKey = CORE_TOP_LEVEL[field.id];

        if (coreKey) {
          if (coreKey === 'age') {
            values[field.id] = patient.age != null ? String(patient.age) : '';
          } else {
            values[field.id] = String((patient as unknown as Record<string, unknown>)[coreKey] ?? '');
          }
        } else {
          const cfVal = row?.[field.id];
          values[field.id] = cfVal != null ? String(cfVal) : '';
        }
      }

      state[section.id] = values;
    } else {
      // Repeatable section
      const rows = match?.fields ?? [];
      state[section.id] =
        rows.length > 0
          ? (rows as Array<Record<string, string>>).map((row) => ({
              rowId: uid(),
              values: row,
              isNew: false
            }))
          : [];
    }
  }

  return state;
}

// ─── Hydrate file state from an existing patient ──────────────────────────────

export function hydrateFileState(schema: FormSchema, patient: IPatient): FileState {
  const fs: FileState = {};
  for (const section of schema.sections) {
    if (section.type !== 'standard') continue;
    const match = patient.customFields?.sections?.find((s) => s.name === section.id);
    const row = match?.fields?.[0];
    for (const field of section.fields) {
      if (field.type !== 'file') continue;
      const cfVal = row?.[field.id];
      fs[field.id] = {
        existing: Array.isArray(cfVal) ? (cfVal as FileMetadata[]) : [],
        pending: []
      };
    }
  }
  return fs;
}

// ─── Build API payload from form state ───────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildPayload(schema: FormSchema, state: FormState, _isUpdate = false): CreatePatientPayload {
  const payload: Record<string, unknown> = {};
  const sections: Array<{ name: string; fields: Array<Record<string, unknown>> }> = [];

  for (const section of schema.sections) {
    if (section.type === 'standard') {
      const values = (state[section.id] as FieldValues) ?? {};
      const fieldsMap: Record<string, unknown> = {};
      for (const field of section.fields) {
        if (field.type === 'file') continue; // files uploaded post-save
        const value = values[field.id] ?? '';
        const coreKey = CORE_TOP_LEVEL[field.id];
        if (coreKey) {
          if (coreKey === 'age') {
            payload[coreKey] = value ? Number(value) : 0;
          } else if (value) {
            payload[coreKey] = value;
          }
        } else if (value) {
          fieldsMap[field.id] = value;
        }
      }
      sections.push({ name: section.id, fields: [fieldsMap] });
    } else {
      // Repeatable: all rows go to customFields keyed by section.id
      const rows = (state[section.id] as RepeatableRow[]) ?? [];
      const fileFieldIds = new Set(section.fields.filter((f) => f.type === 'file').map((f) => f.id));
      const rowFields = rows.map((r) => {
        if (fileFieldIds.size === 0) return r.values;
        const vals: FieldValues = {};
        for (const [k, v] of Object.entries(r.values)) {
          if (!fileFieldIds.has(k)) vals[k] = v;
        }
        return vals;
      });
      sections.push({ name: section.id, fields: rowFields });
    }
  }

  payload.customFields = { sections };
  return payload as unknown as CreatePatientPayload;
}

// ─── Derive the most recent appointment date from customFields ────────────────
// `core-appointment-date` is a reserved field id that may appear in any section
// (standard or repeatable, depending on the schema). Scan all of them and take
// the most recent value found (ISO date strings sort lexicographically).

export function getLastAppointmentDate(patient: IPatient): string | null {
  let latest: string | null = null;
  for (const section of patient.customFields?.sections ?? []) {
    for (const fields of section.fields) {
      const val = fields['core-appointment-date'];
      if (typeof val === 'string' && val && (!latest || val > latest)) {
        latest = val;
      }
    }
  }
  return latest;
}
