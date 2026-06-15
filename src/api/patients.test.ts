import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { listPatients, getPatient, createPatient, updatePatient, deletePatient, uploadPatientFile, deletePatientFile } from './patients';
import type { IPatient } from '../types';

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Factories ────────────────────────────────────────────────────────────────

const createMockPatient = (overrides: Partial<IPatient> = {}): IPatient => ({
  id: 'patient-1',
  userId: 'user-1',
  pharmacistName: ['Dr. Smith'],
  fullName: 'Jane Doe',
  age: 35,
  phoneNumber: '08012345678',
  customFields: { sections: [] },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
});

// ─── listPatients ─────────────────────────────────────────────────────────────

describe('listPatients', () => {
  it('should GET /api/patients and return the patients array from data.data.patients', async () => {
    const patients = [createMockPatient(), createMockPatient({ id: 'patient-2', fullName: 'John Doe' })];

    server.use(http.get(`${BASE}/api/patients`, () => HttpResponse.json({ data: { patients, total: 2 } })));

    const result = await listPatients();

    expect(result).toEqual(patients);
  });

  it('should forward search, sort, and age as query params', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.get(`${BASE}/api/patients`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: { patients: [], total: 0 } });
      })
    );

    await listPatients({ search: 'Jane', sort: 'name', age: '30' });

    const url = new URL(capturedUrl!);
    expect(url.searchParams.get('search')).toBe('Jane');
    expect(url.searchParams.get('sort')).toBe('name');
    expect(url.searchParams.get('age')).toBe('30');
  });

  it('should omit query params when called with no arguments', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.get(`${BASE}/api/patients`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: { patients: [], total: 0 } });
      })
    );

    await listPatients();

    const url = new URL(capturedUrl!);
    expect(url.search).toBe('');
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.get(`${BASE}/api/patients`, () => HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })));

    await expect(listPatients()).rejects.toMatchObject({ response: { status: 500 } });
  });
});

// ─── getPatient ───────────────────────────────────────────────────────────────

describe('getPatient', () => {
  it('should GET /api/patients/:id and return the patient from data.data', async () => {
    const patient = createMockPatient({ id: 'patient-42' });

    server.use(http.get(`${BASE}/api/patients/patient-42`, () => HttpResponse.json({ data: patient })));

    const result = await getPatient('patient-42');

    expect(result).toEqual(patient);
  });

  it('should reject with the axios error when the patient is not found', async () => {
    server.use(http.get(`${BASE}/api/patients/unknown`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })));

    await expect(getPatient('unknown')).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ─── createPatient ────────────────────────────────────────────────────────────

describe('createPatient', () => {
  it('should POST to /api/patients with a minimal payload — required fields only, no customFields', async () => {
    let capturedBody: unknown;
    const patient = createMockPatient();

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: patient });
      })
    );

    await createPatient({ fullName: 'Jane Doe', age: 35, phoneNumber: '08012345678' });

    expect(capturedBody).toEqual({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678'
    });
  });

  it('should POST with a standard section payload containing text and number customFields', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: { sections: [{ name: 'medical-info', fields: [{ diagnosis: 'Hypertension', 'bp-reading': 120 }] }] }
    });

    expect((capturedBody as Record<string, unknown>).customFields).toEqual({
      sections: [{ name: 'medical-info', fields: [{ diagnosis: 'Hypertension', 'bp-reading': 120 }] }]
    });
  });

  it('should POST with a standard section payload containing dropdown/select customFields', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: { sections: [{ name: 'medical-info', fields: [{ 'blood-group': 'A+', 'condition-severity': 'moderate' }] }] }
    });

    expect((capturedBody as Record<string, unknown>).customFields).toEqual({
      sections: [{ name: 'medical-info', fields: [{ 'blood-group': 'A+', 'condition-severity': 'moderate' }] }]
    });
  });

  it('should POST without file field keys in customFields for a standard section', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    // File fields are stripped by buildPayload before createPatient is called —
    // the payload arriving here must not contain any file keys
    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: { sections: [{ name: 'medical-info', fields: [{ diagnosis: 'Hypertension' }] }] }
    });

    const customFields = (capturedBody as Record<string, unknown>).customFields as {
      sections: Array<{ name: string; fields: Array<Record<string, unknown>> }>;
    };
    expect(customFields.sections[0].fields[0]).not.toHaveProperty('result-scan');
    expect(customFields.sections[0].fields[0]).not.toHaveProperty('lab-report');
  });

  it('should POST with repeatable section rows containing text and number values', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: {
        sections: [
          {
            name: 'core-prescriptions',
            fields: [
              { 'drug-name': 'Aspirin', dosage: 100 },
              { 'drug-name': 'Lisinopril', dosage: 10 }
            ]
          }
        ]
      }
    });

    expect((capturedBody as Record<string, unknown>).customFields).toEqual({
      sections: [
        {
          name: 'core-prescriptions',
          fields: [
            { 'drug-name': 'Aspirin', dosage: 100 },
            { 'drug-name': 'Lisinopril', dosage: 10 }
          ]
        }
      ]
    });
  });

  it('should POST with repeatable section rows containing dropdown values', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: {
        sections: [
          {
            name: 'visits',
            fields: [
              { reason: 'routine-checkup', outcome: 'stable' },
              { reason: 'follow-up', outcome: 'improving' }
            ]
          }
        ]
      }
    });

    expect((capturedBody as Record<string, unknown>).customFields).toEqual({
      sections: [
        {
          name: 'visits',
          fields: [
            { reason: 'routine-checkup', outcome: 'stable' },
            { reason: 'follow-up', outcome: 'improving' }
          ]
        }
      ]
    });
  });

  it('should POST with repeatable section rows that have no file field keys', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    // buildPayload strips file fields from each row before createPatient is called
    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: {
        sections: [
          {
            name: 'labResults',
            fields: [
              { 'test-name': 'CBC', result: 'normal' },
              { 'test-name': 'Lipid Panel', result: 'borderline' }
            ]
          }
        ]
      }
    });

    const customFields = (capturedBody as Record<string, unknown>).customFields as {
      sections: Array<{ name: string; fields: Array<Record<string, unknown>> }>;
    };
    const rows = customFields.sections.find((s) => s.name === 'labResults')?.fields ?? [];
    rows.forEach((row) => {
      expect(row).not.toHaveProperty('result-scan');
      expect(row).not.toHaveProperty('lab-report-file');
    });
  });

  it('should POST a mixed payload combining standard fields, repeatable rows, and dropdowns — with no file keys', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/patients`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: createMockPatient() });
      })
    );

    await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678',
      customFields: {
        sections: [
          { name: 'personal-info', fields: [{ 'core-address': '123 Main St', 'core-notes': 'Patient prefers morning appointments' }] },
          { name: 'medical-info', fields: [{ 'blood-group': 'O+', diagnosis: 'Hypertension' }] },
          { name: 'core-prescriptions', fields: [{ 'drug-name': 'Aspirin', dosage: 100, frequency: 'daily' }] },
          { name: 'visits', fields: [{ reason: 'routine-checkup', outcome: 'stable' }] }
        ]
      }
    });

    const body = capturedBody as Record<string, unknown>;
    expect(body).toMatchObject({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678'
    });
    expect(body).not.toHaveProperty('address');
    expect(body).not.toHaveProperty('notes');
    expect(body).not.toHaveProperty('pharmacistName');
    expect(body.customFields).toMatchObject({
      sections: [
        { name: 'personal-info', fields: [{ 'core-address': '123 Main St', 'core-notes': 'Patient prefers morning appointments' }] },
        { name: 'medical-info', fields: [{ 'blood-group': 'O+', diagnosis: 'Hypertension' }] },
        { name: 'core-prescriptions', fields: [{ 'drug-name': 'Aspirin', dosage: 100, frequency: 'daily' }] },
        { name: 'visits', fields: [{ reason: 'routine-checkup', outcome: 'stable' }] }
      ]
    });
    expect(JSON.stringify(body.customFields)).not.toMatch(/file|scan|report/i);
  });

  it('should return the created patient from data.data', async () => {
    const patient = createMockPatient({ id: 'new-patient', fullName: 'Jane Doe' });

    server.use(http.post(`${BASE}/api/patients`, () => HttpResponse.json({ data: patient })));

    const result = await createPatient({
      fullName: 'Jane Doe',
      age: 35,
      phoneNumber: '08012345678'
    });

    expect(result).toEqual(patient);
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.post(`${BASE}/api/patients`, () => HttpResponse.json({ message: 'Validation failed' }, { status: 422 })));

    await expect(createPatient({ fullName: 'Jane Doe', age: 35, phoneNumber: '08012345678' })).rejects.toMatchObject({
      response: { status: 422 }
    });
  });
});

// ─── updatePatient ────────────────────────────────────────────────────────────

describe('updatePatient', () => {
  it('should PUT to /api/patients/:id with the supplied payload', async () => {
    let capturedBody: unknown;
    const patient = createMockPatient({ id: 'patient-1', fullName: 'Jane Updated' });

    server.use(
      http.put(`${BASE}/api/patients/patient-1`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: patient });
      })
    );

    await updatePatient('patient-1', { fullName: 'Jane Updated', age: 36 });

    expect(capturedBody).toEqual({ fullName: 'Jane Updated', age: 36 });
  });

  it('should return the updated patient from data.data', async () => {
    const patient = createMockPatient({ id: 'patient-1', fullName: 'Jane Updated' });

    server.use(http.put(`${BASE}/api/patients/patient-1`, () => HttpResponse.json({ data: patient })));

    const result = await updatePatient('patient-1', { fullName: 'Jane Updated' });

    expect(result).toEqual(patient);
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.put(`${BASE}/api/patients/patient-1`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })));

    await expect(updatePatient('patient-1', { fullName: 'Ghost' })).rejects.toMatchObject({
      response: { status: 404 }
    });
  });
});

// ─── deletePatient ────────────────────────────────────────────────────────────

describe('deletePatient', () => {
  it('should DELETE /api/patients/:id', async () => {
    let deletedId: string | null = null;

    server.use(
      http.delete(`${BASE}/api/patients/:id`, ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({});
      })
    );

    await deletePatient('patient-1');

    expect(deletedId).toBe('patient-1');
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.delete(`${BASE}/api/patients/patient-1`, () => HttpResponse.json({})));

    const result = await deletePatient('patient-1');

    expect(result).toBeUndefined();
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.delete(`${BASE}/api/patients/patient-1`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })));

    await expect(deletePatient('patient-1')).rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ─── uploadPatientFile ────────────────────────────────────────────────────────

describe('uploadPatientFile', () => {
  it('should POST to /api/files/upload/:patientId as multipart/form-data with the file appended', async () => {
    let capturedFormData: FormData | null = null;

    server.use(
      http.post(`${BASE}/api/files/upload/patient-1`, async ({ request }) => {
        capturedFormData = await request.formData();
        return HttpResponse.json({ data: { url: 'https://cdn.example.com/file.pdf', publicId: 'pub-123' } });
      })
    );

    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

    await uploadPatientFile('patient-1', file);

    expect(capturedFormData!.get('file')).toBeTruthy();
    expect((capturedFormData!.get('file') as File).name).toBe('report.pdf');
  });

  it('should return { url, publicId, name } where name is taken from file.name not the server response', async () => {
    server.use(
      http.post(`${BASE}/api/files/upload/patient-1`, () =>
        HttpResponse.json({ data: { url: 'https://cdn.example.com/file.pdf', publicId: 'pub-123' } })
      )
    );

    const file = new File(['content'], 'lab-result.pdf', { type: 'application/pdf' });

    const result = await uploadPatientFile('patient-1', file);

    expect(result).toEqual({
      url: 'https://cdn.example.com/file.pdf',
      publicId: 'pub-123',
      name: 'lab-result.pdf'
    });
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.post(`${BASE}/api/files/upload/patient-1`, () => HttpResponse.json({ message: 'Upload failed' }, { status: 500 })));

    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

    await expect(uploadPatientFile('patient-1', file)).rejects.toMatchObject({
      response: { status: 500 }
    });
  });
});

// ─── deletePatientFile ────────────────────────────────────────────────────────

describe('deletePatientFile', () => {
  it('should DELETE /api/files/:publicId with the publicId URL-encoded', async () => {
    let capturedSegment: string | null = null;

    server.use(
      http.delete(`${BASE}/api/files/:publicId`, ({ request }) => {
        // Read the raw URL path to verify encoding — MSW decodes params before handing them over
        const rawPath = new URL(request.url).pathname;
        capturedSegment = rawPath.replace('/api/files/', '');
        return HttpResponse.json({});
      })
    );

    await deletePatientFile('folder/sub/file-abc');

    expect(capturedSegment).toBe(encodeURIComponent('folder/sub/file-abc'));
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.delete(`${BASE}/api/files/${encodeURIComponent('folder/file-abc')}`, () => HttpResponse.json({})));

    const result = await deletePatientFile('folder/file-abc');

    expect(result).toBeUndefined();
  });
});
