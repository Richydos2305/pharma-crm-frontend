import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnboardingChecklist } from './OnboardingChecklist';
import type { OnboardingSteps } from '../types';

afterEach(() => {
  vi.clearAllMocks();
});

const allFalse: OnboardingSteps = {
  profileComplete: false,
  firstPharmacistAdded: false,
  formBuilt: false,
  firstPatientAdded: false
};

function renderChecklist(steps: OnboardingSteps) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <OnboardingChecklist steps={steps} /> },
      { path: '/profile', element: <div>Profile Page</div> },
      { path: '/pharmacists', element: <div>Pharmacists Page</div> },
      { path: '/patients/form-builder', element: <div>Form Builder Page</div> },
      { path: '/patients/new', element: <div>New Patient Page</div> }
    ],
    { initialEntries: ['/'] }
  );

  const { container } = render(<RouterProvider router={router} />);
  return { router, container };
}

// ─── Progress counter ─────────────────────────────────────────────────────────

describe('progress counter', () => {
  it('should show "0 of 5 steps complete" when all steps are incomplete', () => {
    renderChecklist(allFalse);

    expect(screen.getByText('0 of 5 steps complete')).toBeInTheDocument();
  });

  it('should show "2 of 5 steps complete" when two steps are complete', () => {
    renderChecklist({ ...allFalse, profileComplete: true, firstPharmacistAdded: true });

    expect(screen.getByText('2 of 5 steps complete')).toBeInTheDocument();
  });
});

// ─── Progress bar ARIA ────────────────────────────────────────────────────────

describe('progress bar ARIA attributes', () => {
  it('should have aria-valuenow=0, aria-valuemin=0, aria-valuemax=5 when nothing is complete', () => {
    renderChecklist(allFalse);

    const bar = screen.getByRole('progressbar');

    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
  });

  it('should have aria-valuenow=2 when two steps are complete', () => {
    renderChecklist({ ...allFalse, profileComplete: true, firstPharmacistAdded: true });

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  });
});

// ─── Completed steps ──────────────────────────────────────────────────────────

describe('completed steps', () => {
  it('should apply onboarding-step--done class to the completed step li', () => {
    const { container } = renderChecklist({ ...allFalse, profileComplete: true });

    const profileItem = container.querySelectorAll('li.onboarding-step')[0];

    expect(profileItem).toHaveClass('onboarding-step--done');
  });

  it('should not render description text for a completed step', () => {
    renderChecklist({ ...allFalse, profileComplete: true });

    expect(screen.queryByText('Add your company name and phone number.')).not.toBeInTheDocument();
  });

  it('should not render a CTA button for a completed step', () => {
    renderChecklist({ ...allFalse, profileComplete: true });

    expect(screen.queryByRole('button', { name: 'Go to Profile' })).not.toBeInTheDocument();
  });

  it('should render an SVG checkmark for a completed step', () => {
    const { container } = renderChecklist({ ...allFalse, profileComplete: true });

    const profileItem = container.querySelectorAll('li.onboarding-step')[0];

    expect(profileItem.querySelector('svg')).toBeInTheDocument();
    expect(profileItem.querySelector('circle')).toBeInTheDocument();
  });
});

// ─── Incomplete steps ─────────────────────────────────────────────────────────

describe('incomplete steps', () => {
  it('should render description text for an incomplete step', () => {
    renderChecklist(allFalse);

    expect(screen.getByText('Add your company name and phone number.')).toBeInTheDocument();
  });

  it('should render CTA buttons for steps 1–4 when all are incomplete', () => {
    renderChecklist(allFalse);

    expect(screen.getByRole('button', { name: 'Go to Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a pharmacist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Form Builder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a patient' })).toBeInTheDocument();
  });

  it('should not render a CTA button for step 5 (Explore your dashboard)', () => {
    renderChecklist(allFalse);

    const exploreStep = screen.getByText('Explore your dashboard').closest('li')!;

    expect(within(exploreStep).queryByRole('button')).not.toBeInTheDocument();
  });

  it('should navigate to /profile when the step 1 CTA is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist(allFalse);

    await user.click(screen.getByRole('button', { name: 'Go to Profile' }));

    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  it('should navigate to /pharmacists when the step 2 CTA is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist(allFalse);

    await user.click(screen.getByRole('button', { name: 'Add a pharmacist' }));

    expect(screen.getByText('Pharmacists Page')).toBeInTheDocument();
  });

  it('should navigate to /patients/form-builder when the step 3 CTA is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist(allFalse);

    await user.click(screen.getByRole('button', { name: 'Open Form Builder' }));

    expect(screen.getByText('Form Builder Page')).toBeInTheDocument();
  });

  it('should navigate to /patients/new when the step 4 CTA is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist(allFalse);

    await user.click(screen.getByRole('button', { name: 'Add a patient' }));

    expect(screen.getByText('New Patient Page')).toBeInTheDocument();
  });
});

// ─── Mobile toggle ────────────────────────────────────────────────────────────

describe('mobile toggle', () => {
  it('should start with aria-expanded="true" and steps list with onboarding-steps--open', () => {
    const { container } = renderChecklist(allFalse);

    const toggle = container.querySelector('[aria-controls="onboarding-steps-list"]')!;
    const stepsList = container.querySelector('#onboarding-steps-list');

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(stepsList).toHaveClass('onboarding-steps--open');
  });

  it('should set aria-expanded="false" and remove onboarding-steps--open when toggle is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderChecklist(allFalse);

    const toggle = container.querySelector('[aria-controls="onboarding-steps-list"]')!;
    await user.click(toggle);

    const stepsList = container.querySelector('#onboarding-steps-list');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(stepsList).not.toHaveClass('onboarding-steps--open');
  });

  it('should restore onboarding-steps--open when toggle is clicked a second time', async () => {
    const user = userEvent.setup();
    const { container } = renderChecklist(allFalse);

    const toggle = container.querySelector('[aria-controls="onboarding-steps-list"]')!;
    await user.click(toggle);
    await user.click(toggle);

    const stepsList = container.querySelector('#onboarding-steps-list');

    expect(stepsList).toHaveClass('onboarding-steps--open');
  });
});
