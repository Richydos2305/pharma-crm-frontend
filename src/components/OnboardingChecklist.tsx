import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { OnboardingSteps } from '../types';

interface StepDef {
  key: string;
  label: string;
  description: string;
  done: boolean;
  route?: string;
  ctaLabel?: string;
}

interface Props {
  steps: OnboardingSteps;
}

export function OnboardingChecklist({ steps }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const stepDefs: StepDef[] = [
    {
      key: 'profile',
      label: 'Complete your profile',
      description: 'Add your company name and phone number.',
      done: steps.profileComplete,
      route: '/profile',
      ctaLabel: 'Go to Profile'
    },
    {
      key: 'pharmacist',
      label: 'Add a pharmacist',
      description: 'Register at least one pharmacist on your team.',
      done: steps.firstPharmacistAdded,
      route: '/pharmacists',
      ctaLabel: 'Add a pharmacist'
    },
    {
      key: 'form',
      label: 'Build your intake form',
      description: 'Configure the patient intake form in Settings.',
      done: steps.formBuilt,
      route: '/patients/form-builder',
      ctaLabel: 'Open Form Builder'
    },
    {
      key: 'patient',
      label: 'Add your first patient',
      description: 'Create your first patient record.',
      done: steps.firstPatientAdded,
      route: '/patients/new',
      ctaLabel: 'Add a patient'
    },
    {
      key: 'explore',
      label: 'Explore your dashboard',
      description: 'Finish the steps above to unlock your dashboard.',
      done: false
    }
  ];

  const doneSteps = stepDefs.filter((s) => s.done);
  const pendingSteps = stepDefs.filter((s) => !s.done);
  const completedCount = doneSteps.length;
  const totalCount = stepDefs.length;

  return (
    <div className="onboarding-card">
      <div className="onboarding-header">
        <div className="onboarding-header-left">
          <h2 className="onboarding-title">Getting Started</h2>
          <span className="onboarding-progress-text">
            {completedCount} of {totalCount} steps complete
          </span>
        </div>
        <button className="onboarding-toggle" aria-expanded={expanded} aria-controls="onboarding-steps-list" onClick={() => setExpanded((e) => !e)}>
          {expanded ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>
      </div>

      <div
        className="onboarding-progress-fill-wrap"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${completedCount} of ${totalCount} onboarding steps complete`}
      >
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
        </div>
      </div>

      <ol id="onboarding-steps-list" className={`onboarding-steps${expanded ? ' onboarding-steps--open' : ''}`}>
        {doneSteps.map((step) => (
          <li key={step.key} className="onboarding-step onboarding-step--done">
            <span className="onboarding-step-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div className="onboarding-step-body">
              <span className="onboarding-step-label">{step.label}</span>
            </div>
          </li>
        ))}

        {doneSteps.length > 0 && pendingSteps.length > 0 && <li className="onboarding-step-divider" role="separator" aria-hidden="true" />}

        {pendingSteps.map((step) => (
          <li
            key={step.key}
            className={`onboarding-step${step.route ? ' onboarding-step--navigable' : ''}`}
            onClick={step.route ? () => navigate(step.route!) : undefined}
            role={step.route ? 'button' : undefined}
            tabIndex={step.route ? 0 : undefined}
            onKeyDown={step.route ? (e) => e.key === 'Enter' && navigate(step.route!) : undefined}
          >
            <span className="onboarding-step-icon" aria-hidden="true">
              <span className="onboarding-step-circle" />
            </span>
            <div className="onboarding-step-body">
              <span className="onboarding-step-label">{step.label}</span>
              <span className="onboarding-step-desc">{step.description}</span>
            </div>
            {step.route && (
              <>
                <button
                  className="onboarding-step-cta"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(step.route!);
                  }}
                >
                  {step.ctaLabel}
                </button>
                <span className="onboarding-step-arrow" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
