import { describe, it, expect } from 'vitest';
import { hydrateState, hydrateFileState, buildPayload, getLastAppointmentDate } from './schemaFormUtils';
import type { FormSchema, SectionSchema, FieldSchema } from '../types/formBuilder';
import type { IPatient, FileMetadata } from '../types';

// ─── Factories ────────────────────────────────────────────────────────────────

const createMockPatient = (overrides: Partial<IPatient> = {}): IPatient => ({
  id: 'patient-1',
  userId: 'user-1',
  pharmacistName: ['Dr. Smith'],
  fullName: 'Jane Doe',
  age: 30,
  phoneNumber: '08012345678',
  customFields: { sections: [] },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
});

const createField = (overrides: Partial<FieldSchema>): FieldSchema => ({
  id: 'field-1',
  label: 'Test Field',
  type: 'short_text',
  required: false,
  ...overrides
});

const createStandardSection = (overrides: Partial<SectionSchema> = {}): SectionSchema => ({
  id: 'section-1',
  name: 'Test Section',
  type: 'standard',
  fields: [],
  ...overrides
});

const createRepeatableSection = (overrides: Partial<SectionSchema> = {}): SectionSchema => ({
  id: 'section-1',
  name: 'Test Section',
  type: 'repeatable',
  fields: [],
  ...overrides
});

const createMockFormSchema = (sections: SectionSchema[]): FormSchema => ({
  id: 'form-1',
  name: 'Test Form',
  status: 'draft',
  sections
});

const createFileMetadata = (overrides: Partial<FileMetadata> = {}): FileMetadata => ({
  url: 'https://example.com/file.pdf',
  publicId: 'pub-1',
  name: 'file.pdf',
  ...overrides
});

// ─── hydrateState ─────────────────────────────────────────────────────────────

describe('hydrateState', () => {
  describe('standard section — core fields', () => {
    it('should map core-full-name to patient.fullName', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-full-name', type: 'short_text' })]
        })
      ]);
      const patient = createMockPatient({ fullName: 'Jane Doe' });

      const state = hydrateState(schema, patient);

      expect((state['personal-info'] as Record<string, string>)['core-full-name']).toBe('Jane Doe');
    });

    it('should map core-age to patient.age as a string', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-age', type: 'number' })]
        })
      ]);
      const patient = createMockPatient({ age: 35 });

      const state = hydrateState(schema, patient);

      expect((state['personal-info'] as Record<string, string>)['core-age']).toBe('35');
    });

    it('should return empty string for core-age when patient.age is null', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-age', type: 'number' })]
        })
      ]);
      const patient = createMockPatient({ age: null as unknown as number });

      const state = hydrateState(schema, patient);

      expect((state['personal-info'] as Record<string, string>)['core-age']).toBe('');
    });

    it('should map core-phone to patient.phoneNumber', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-phone', type: 'short_text' })]
        })
      ]);
      const patient = createMockPatient({ phoneNumber: '08012345678' });

      const state = hydrateState(schema, patient);

      expect((state['personal-info'] as Record<string, string>)['core-phone']).toBe('08012345678');
    });

    it('should read core-address, core-notes and core-attended-by from customFields.sections via the generic path', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [
            createField({ id: 'core-address', type: 'short_text' }),
            createField({ id: 'core-notes', type: 'textarea' }),
            createField({ id: 'core-attended-by', type: 'relation' })
          ]
        })
      ]);
      const patient = createMockPatient({
        customFields: {
          sections: [
            {
              name: 'personal-info',
              fields: [{ 'core-address': '123 Main St', 'core-notes': 'Some notes', 'core-attended-by': 'Dr. Adams' }]
            }
          ]
        }
      });

      const state = hydrateState(schema, patient);
      const values = state['personal-info'] as Record<string, string>;

      expect(values['core-address']).toBe('123 Main St');
      expect(values['core-notes']).toBe('Some notes');
      expect(values['core-attended-by']).toBe('Dr. Adams');
    });

    it('should not include file-type fields in the returned state', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'docs',
          fields: [createField({ id: 'core-full-name', type: 'short_text' }), createField({ id: 'doc-upload', type: 'file' })]
        })
      ]);
      const patient = createMockPatient();

      const state = hydrateState(schema, patient);

      expect(Object.keys(state['docs'] as Record<string, string>)).not.toContain('doc-upload');
    });
  });

  describe('standard section — appointment date', () => {
    it('should read core-appointment-date from the matching customFields section', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'medical',
          fields: [createField({ id: 'core-appointment-date', type: 'date' })]
        })
      ]);
      const patient = createMockPatient({
        customFields: { sections: [{ name: 'medical', fields: [{ 'core-appointment-date': '2024-06-15' }] }] }
      });

      const state = hydrateState(schema, patient);

      expect((state['medical'] as Record<string, string>)['core-appointment-date']).toBe('2024-06-15');
    });

    it('should return empty string when the section has no matching customFields entry', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'medical',
          fields: [createField({ id: 'core-appointment-date', type: 'date' })]
        })
      ]);
      const patient = createMockPatient({ customFields: { sections: [] } });

      const state = hydrateState(schema, patient);

      expect((state['medical'] as Record<string, string>)['core-appointment-date']).toBe('');
    });

    it('should return empty string when the field is absent from the matching section', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'medical',
          fields: [createField({ id: 'core-appointment-date', type: 'date' })]
        })
      ]);
      const patient = createMockPatient({ customFields: { sections: [{ name: 'medical', fields: [{}] }] } });

      const state = hydrateState(schema, patient);

      expect((state['medical'] as Record<string, string>)['core-appointment-date']).toBe('');
    });
  });

  describe('standard section — custom fields', () => {
    it('should read a non-core custom field value from customFields', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'extra',
          fields: [createField({ id: 'blood-type', type: 'short_text' })]
        })
      ]);
      const patient = createMockPatient({ customFields: { sections: [{ name: 'extra', fields: [{ 'blood-type': 'O+' }] }] } });

      const state = hydrateState(schema, patient);

      expect((state['extra'] as Record<string, string>)['blood-type']).toBe('O+');
    });

    it('should return empty string for a custom field not present in customFields', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'extra',
          fields: [createField({ id: 'blood-type', type: 'short_text' })]
        })
      ]);
      const patient = createMockPatient({ customFields: { sections: [] } });

      const state = hydrateState(schema, patient);

      expect((state['extra'] as Record<string, string>)['blood-type']).toBe('');
    });
  });

  describe('repeatable section — prescriptions', () => {
    it('should hydrate core-prescriptions from customFields.sections', () => {
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'core-prescriptions',
          fields: [createField({ id: 'core-prescription-text', type: 'textarea' })]
        })
      ]);
      const patient = createMockPatient({
        customFields: {
          sections: [
            {
              name: 'core-prescriptions',
              fields: [{ 'core-prescription-text': 'Amoxicillin 500mg' }, { 'core-prescription-text': 'Ibuprofen 400mg' }]
            }
          ]
        }
      });

      const state = hydrateState(schema, patient);
      const rows = state['core-prescriptions'] as Array<{ rowId: string; values: Record<string, string> }>;

      expect(rows).toHaveLength(2);
      expect(rows[0].values['core-prescription-text']).toBe('Amoxicillin 500mg');
      expect(rows[1].values['core-prescription-text']).toBe('Ibuprofen 400mg');
    });
  });

  describe('repeatable section — other sections', () => {
    it('should hydrate rows from customFields keyed by section id', () => {
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'allergies',
          fields: [createField({ id: 'allergy-name', type: 'short_text' })]
        })
      ]);
      const patient = createMockPatient({
        customFields: {
          sections: [{ name: 'allergies', fields: [{ 'allergy-name': 'Peanuts' }, { 'allergy-name': 'Latex' }] }]
        }
      });

      const state = hydrateState(schema, patient);
      const rows = state['allergies'] as Array<{ rowId: string; values: Record<string, string> }>;

      expect(rows).toHaveLength(2);
      expect(rows[0].values['allergy-name']).toBe('Peanuts');
    });

    it('should return an empty array when no matching entry exists in customFields', () => {
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'allergies',
          fields: [createField({ id: 'allergy-name', type: 'short_text' })]
        })
      ]);
      const patient = createMockPatient({ customFields: { sections: [] } });

      const state = hydrateState(schema, patient);

      expect(state['allergies']).toEqual([]);
    });

    it('should preserve file field values in repeatable row objects during hydration', () => {
      const fileData = [{ url: 'https://example.com/lab.pdf', publicId: 'pub-2', name: 'lab.pdf' }];
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'visits',
          fields: [createField({ id: 'visit-date', type: 'date' }), createField({ id: 'lab-results', type: 'file' })]
        })
      ]);
      const patient = createMockPatient({
        customFields: {
          sections: [{ name: 'visits', fields: [{ 'visit-date': '2024-06-15', 'lab-results': fileData }] }]
        }
      });

      const state = hydrateState(schema, patient);
      const rows = state['visits'] as Array<{ rowId: string; values: Record<string, unknown> }>;

      expect(rows[0].values['lab-results']).toEqual(fileData);
    });
  });
});

// ─── hydrateFileState ─────────────────────────────────────────────────────────

describe('hydrateFileState', () => {
  it('should return { existing: [], pending: [] } for a file field with no customFields entry', () => {
    const schema = createMockFormSchema([
      createStandardSection({
        id: 'docs',
        fields: [createField({ id: 'id-scan', type: 'file' })]
      })
    ]);
    const patient = createMockPatient({ customFields: { sections: [] } });

    const fileState = hydrateFileState(schema, patient);

    expect(fileState['id-scan']).toEqual({ existing: [], pending: [] });
  });

  it('should return existing FileMetadata from customFields as the existing array', () => {
    const file = createFileMetadata({ name: 'id-scan.pdf' });
    const schema = createMockFormSchema([
      createStandardSection({
        id: 'docs',
        fields: [createField({ id: 'id-scan', type: 'file' })]
      })
    ]);
    const patient = createMockPatient({ customFields: { sections: [{ name: 'docs', fields: [{ 'id-scan': [file] }] }] } });

    const fileState = hydrateFileState(schema, patient);

    expect(fileState['id-scan'].existing).toEqual([file]);
    expect(fileState['id-scan'].pending).toEqual([]);
  });

  it('should not include non-file fields in the returned FileState', () => {
    const schema = createMockFormSchema([
      createStandardSection({
        id: 'docs',
        fields: [createField({ id: 'full-name', type: 'short_text' }), createField({ id: 'id-scan', type: 'file' })]
      })
    ]);
    const patient = createMockPatient();

    const fileState = hydrateFileState(schema, patient);

    expect(Object.keys(fileState)).not.toContain('full-name');
    expect(Object.keys(fileState)).toContain('id-scan');
  });

  it('should not include repeatable sections in the returned FileState', () => {
    const schema = createMockFormSchema([
      createRepeatableSection({
        id: 'visits',
        fields: [createField({ id: 'lab-results', type: 'file' })]
      })
    ]);
    const patient = createMockPatient();

    const fileState = hydrateFileState(schema, patient);

    expect(Object.keys(fileState)).not.toContain('lab-results');
  });
});

// ─── getLastAppointmentDate ───────────────────────────────────────────────────

describe('getLastAppointmentDate', () => {
  it('should return the max date across multiple sections each containing core-appointment-date', () => {
    const patient = createMockPatient({
      customFields: {
        sections: [
          { name: 'medical', fields: [{ 'core-appointment-date': '2024-01-01' }] },
          { name: 'visits', fields: [{ 'core-appointment-date': '2024-06-15' }] }
        ]
      }
    });

    expect(getLastAppointmentDate(patient)).toBe('2024-06-15');
  });

  it('should return the max date across multiple rows of a repeatable section', () => {
    const patient = createMockPatient({
      customFields: {
        sections: [
          {
            name: 'visits',
            fields: [{ 'core-appointment-date': '2024-01-01' }, { 'core-appointment-date': '2024-06-15' }, { 'core-appointment-date': '2024-03-10' }]
          }
        ]
      }
    });

    expect(getLastAppointmentDate(patient)).toBe('2024-06-15');
  });

  it('should return null when no section/row has a core-appointment-date value', () => {
    const patient = createMockPatient({
      customFields: { sections: [{ name: 'medical', fields: [{ 'core-attended-by': 'Dr. Adams' }] }] }
    });

    expect(getLastAppointmentDate(patient)).toBeNull();
  });

  it('should return null for customFields: { sections: [] }', () => {
    const patient = createMockPatient({ customFields: { sections: [] } });

    expect(getLastAppointmentDate(patient)).toBeNull();
  });
});

// ─── buildPayload ─────────────────────────────────────────────────────────────

describe('buildPayload', () => {
  describe('core fields', () => {
    it('should map core text fields to top-level payload properties and non-core fields into the section', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [
            createField({ id: 'core-full-name', type: 'short_text' }),
            createField({ id: 'core-phone', type: 'short_text' }),
            createField({ id: 'core-address', type: 'short_text' }),
            createField({ id: 'core-notes', type: 'textarea' })
          ]
        })
      ]);
      const state = {
        'personal-info': {
          'core-full-name': 'Jane Doe',
          'core-phone': '08012345678',
          'core-address': '123 Main St',
          'core-notes': 'Healthy'
        }
      };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'personal-info');

      expect(payload.fullName).toBe('Jane Doe');
      expect(payload.phoneNumber).toBe('08012345678');
      expect(section?.fields[0]).toMatchObject({ 'core-address': '123 Main St', 'core-notes': 'Healthy' });
    });

    it('should convert core-age to a number', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-age', type: 'number' })]
        })
      ]);
      const state = { 'personal-info': { 'core-age': '42' } };

      const payload = buildPayload(schema, state);

      expect(payload.age).toBe(42);
    });

    it('should set age to 0 when core-age value is an empty string', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-age', type: 'number' })]
        })
      ]);
      const state = { 'personal-info': { 'core-age': '' } };

      const payload = buildPayload(schema, state);

      expect(payload.age).toBe(0);
    });

    it('should put core-attended-by into the section fields regardless of isUpdate, and never set pharmacistName', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'medical',
          fields: [createField({ id: 'core-attended-by', type: 'relation' })]
        })
      ]);
      const state = { medical: { 'core-attended-by': 'Dr. Adams' } };

      const createPayload = buildPayload(schema, state, false);
      const updatePayload = buildPayload(schema, state, true);

      expect(createPayload.customFields?.sections.find((s) => s.name === 'medical')?.fields[0]).toMatchObject({
        'core-attended-by': 'Dr. Adams'
      });
      expect(updatePayload.customFields?.sections.find((s) => s.name === 'medical')?.fields[0]).toMatchObject({
        'core-attended-by': 'Dr. Adams'
      });
      expect(createPayload).not.toHaveProperty('pharmacistName');
      expect(updatePayload).not.toHaveProperty('pharmacistName');
    });

    it('should omit core-full-name from the payload when its value is an empty string', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'personal-info',
          fields: [createField({ id: 'core-full-name', type: 'short_text' })]
        })
      ]);
      const state = { 'personal-info': { 'core-full-name': '' } };

      const payload = buildPayload(schema, state);

      expect(payload.fullName).toBeUndefined();
    });
  });

  describe('custom fields', () => {
    it('should put non-core field values into the matching customFields section', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'extra',
          fields: [createField({ id: 'blood-type', type: 'short_text' })]
        })
      ]);
      const state = { extra: { 'blood-type': 'O+' } };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'extra');

      expect(section?.fields[0]).toEqual({ 'blood-type': 'O+' });
    });

    it('should omit non-core fields with empty string values from the section', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'extra',
          fields: [createField({ id: 'blood-type', type: 'short_text' })]
        })
      ]);
      const state = { extra: { 'blood-type': '' } };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'extra');

      expect(section?.fields[0]).not.toHaveProperty('blood-type');
    });

    it('should skip file-type fields and not include them in the section', () => {
      const schema = createMockFormSchema([
        createStandardSection({
          id: 'docs',
          fields: [createField({ id: 'id-scan', type: 'file' })]
        })
      ]);
      const state = { docs: {} };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'docs');

      expect(section?.fields[0]).not.toHaveProperty('id-scan');
    });

    it('should include an entry in customFields.sections for every schema section, including empty ones', () => {
      const schema = createMockFormSchema([
        createStandardSection({ id: 'personal-info', fields: [createField({ id: 'core-full-name', type: 'short_text' })] }),
        createRepeatableSection({ id: 'visits', fields: [createField({ id: 'visit-date', type: 'date' })] })
      ]);
      const state = {};

      const payload = buildPayload(schema, state);

      expect(payload.customFields?.sections).toHaveLength(schema.sections.length);
      payload.customFields?.sections.forEach((section, i) => {
        expect(section.name).toBe(schema.sections[i].id);
      });
    });
  });

  describe('repeatable sections', () => {
    it('should serialise rows into the matching customFields.sections entry', () => {
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'core-prescriptions',
          fields: [createField({ id: 'core-prescription-text', type: 'textarea' })]
        })
      ]);
      const state = {
        'core-prescriptions': [
          { rowId: 'r1', values: { 'core-prescription-text': 'Amoxicillin 500mg' } },
          { rowId: 'r2', values: { 'core-prescription-text': 'Ibuprofen 400mg' } }
        ]
      };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'core-prescriptions');

      expect(section?.fields).toEqual([{ 'core-prescription-text': 'Amoxicillin 500mg' }, { 'core-prescription-text': 'Ibuprofen 400mg' }]);
    });

    it('should still include the section in customFields.sections with an empty fields array when rows are empty', () => {
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'core-prescriptions',
          fields: [createField({ id: 'core-prescription-text', type: 'textarea' })]
        })
      ]);
      const state = { 'core-prescriptions': [] };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'core-prescriptions');

      expect(section?.fields).toEqual([]);
    });

    it('should strip file-type field values from repeatable rows before serialising', () => {
      const schema = createMockFormSchema([
        createRepeatableSection({
          id: 'visits',
          fields: [createField({ id: 'visit-date', type: 'date' }), createField({ id: 'lab-results', type: 'file' })]
        })
      ]);
      const state = {
        visits: [{ rowId: 'r1', values: { 'visit-date': '2024-06-15', 'lab-results': 'some-file-data' } }]
      };

      const payload = buildPayload(schema, state);
      const section = payload.customFields?.sections.find((s) => s.name === 'visits');
      const rows = section?.fields as Array<Record<string, string>>;

      expect(rows[0]).toHaveProperty('visit-date', '2024-06-15');
      expect(rows[0]).not.toHaveProperty('lab-results');
    });
  });
});
