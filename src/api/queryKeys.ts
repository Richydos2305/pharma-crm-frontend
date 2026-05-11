export const queryKeys = {
  me: ['me'] as const,
  patients: {
    all: ['patients'] as const,
    detail: (id: string) => ['patient', id] as const
  },
  pharmacists: ['pharmacists'] as const,
  settings: ['settings'] as const
};
