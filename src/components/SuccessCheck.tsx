interface SuccessCheckProps {
  visible: boolean;
}

export function SuccessCheck({ visible }: SuccessCheckProps) {
  if (!visible) return null;

  return (
    <div className="success-check-overlay" aria-hidden="true">
      <svg className="success-check-svg" viewBox="0 0 52 52" fill="none">
        <circle className="success-check-circle" cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" />
        <path
          className="success-check-path"
          d="M14 26l8 8 16-16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
