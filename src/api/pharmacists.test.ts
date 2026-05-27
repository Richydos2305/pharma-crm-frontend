import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { listPharmacists, createPharmacist, updatePharmacist, deletePharmacist } from './pharmacists';

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── normalize (tested via public API) ───────────────────────────────────────

// normalize is not exported — its behaviour is verified through the functions that call it.

describe('normalize', () => {
  it('should map _id to id and preserve name and phoneNumber', async () => {
    server.use(http.post(`${BASE}/api/pharmacists`, () => HttpResponse.json({ data: { _id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' } })));

    const result = await createPharmacist({ name: 'Dr. Ada', phoneNumber: '08011111111' });

    expect(result).toEqual({ id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' });
    expect(result).not.toHaveProperty('_id');
  });

  it('should return undefined for phoneNumber when it is absent from the raw object', async () => {
    server.use(http.post(`${BASE}/api/pharmacists`, () => HttpResponse.json({ data: { _id: 'ph-2', name: 'Dr. Ben' } })));

    const result = await createPharmacist({ name: 'Dr. Ben' });

    expect(result.phoneNumber).toBeUndefined();
  });
});

// ─── listPharmacists ──────────────────────────────────────────────────────────

describe('listPharmacists', () => {
  it('should GET /api/pharmacists and return a normalised array with id instead of _id', async () => {
    server.use(
      http.get(`${BASE}/api/pharmacists`, () =>
        HttpResponse.json({
          data: {
            pharmacists: [
              { _id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' },
              { _id: 'ph-2', name: 'Dr. Ben', phoneNumber: '08022222222' }
            ],
            total: 2
          }
        })
      )
    );

    const result = await listPharmacists();

    expect(result).toEqual([
      { id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' },
      { id: 'ph-2', name: 'Dr. Ben', phoneNumber: '08022222222' }
    ]);
  });

  it('should return an empty array when the server returns zero pharmacists', async () => {
    server.use(http.get(`${BASE}/api/pharmacists`, () => HttpResponse.json({ data: { pharmacists: [], total: 0 } })));

    const result = await listPharmacists();

    expect(result).toEqual([]);
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.get(`${BASE}/api/pharmacists`, () => HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })));

    await expect(listPharmacists()).rejects.toMatchObject({ response: { status: 500 } });
  });
});

// ─── createPharmacist ─────────────────────────────────────────────────────────

describe('createPharmacist', () => {
  it('should POST to /api/pharmacists with { name, phoneNumber }', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/pharmacists`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: { _id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' } });
      })
    );

    await createPharmacist({ name: 'Dr. Ada', phoneNumber: '08011111111' });

    expect(capturedBody).toEqual({ name: 'Dr. Ada', phoneNumber: '08011111111' });
  });

  it('should POST to /api/pharmacists with name only when phoneNumber is omitted', async () => {
    let capturedBody: unknown;

    server.use(
      http.post(`${BASE}/api/pharmacists`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: { _id: 'ph-3', name: 'Dr. Cara' } });
      })
    );

    await createPharmacist({ name: 'Dr. Cara' });

    expect(capturedBody).toEqual({ name: 'Dr. Cara' });
  });

  it('should return the normalised pharmacist from data.data with id not _id', async () => {
    server.use(http.post(`${BASE}/api/pharmacists`, () => HttpResponse.json({ data: { _id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' } })));

    const result = await createPharmacist({ name: 'Dr. Ada', phoneNumber: '08011111111' });

    expect(result).toEqual({ id: 'ph-1', name: 'Dr. Ada', phoneNumber: '08011111111' });
    expect(result).not.toHaveProperty('_id');
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.post(`${BASE}/api/pharmacists`, () => HttpResponse.json({ message: 'Validation failed' }, { status: 422 })));

    await expect(createPharmacist({ name: 'Dr. Ada' })).rejects.toMatchObject({
      response: { status: 422 }
    });
  });
});

// ─── updatePharmacist ─────────────────────────────────────────────────────────

describe('updatePharmacist', () => {
  it('should PUT to /api/pharmacists/:id with the supplied payload', async () => {
    let capturedBody: unknown;

    server.use(
      http.put(`${BASE}/api/pharmacists/ph-1`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ data: { _id: 'ph-1', name: 'Dr. Ada Updated', phoneNumber: '08099999999' } });
      })
    );

    await updatePharmacist('ph-1', { name: 'Dr. Ada Updated', phoneNumber: '08099999999' });

    expect(capturedBody).toEqual({ name: 'Dr. Ada Updated', phoneNumber: '08099999999' });
  });

  it('should return the normalised updated pharmacist from data.data', async () => {
    server.use(
      http.put(`${BASE}/api/pharmacists/ph-1`, () =>
        HttpResponse.json({ data: { _id: 'ph-1', name: 'Dr. Ada Updated', phoneNumber: '08099999999' } })
      )
    );

    const result = await updatePharmacist('ph-1', { name: 'Dr. Ada Updated' });

    expect(result).toEqual({ id: 'ph-1', name: 'Dr. Ada Updated', phoneNumber: '08099999999' });
    expect(result).not.toHaveProperty('_id');
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.put(`${BASE}/api/pharmacists/ph-1`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })));

    await expect(updatePharmacist('ph-1', { name: 'Ghost' })).rejects.toMatchObject({
      response: { status: 404 }
    });
  });
});

// ─── deletePharmacist ─────────────────────────────────────────────────────────

describe('deletePharmacist', () => {
  it('should DELETE /api/pharmacists/:id', async () => {
    let deletedId: string | null = null;

    server.use(
      http.delete(`${BASE}/api/pharmacists/:id`, ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({});
      })
    );

    await deletePharmacist('ph-1');

    expect(deletedId).toBe('ph-1');
  });

  it('should resolve with undefined on success', async () => {
    server.use(http.delete(`${BASE}/api/pharmacists/ph-1`, () => HttpResponse.json({})));

    const result = await deletePharmacist('ph-1');

    expect(result).toBeUndefined();
  });

  it('should reject with the axios error on a server error', async () => {
    server.use(http.delete(`${BASE}/api/pharmacists/ph-1`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })));

    await expect(deletePharmacist('ph-1')).rejects.toMatchObject({ response: { status: 404 } });
  });
});
