import { useRef, useEffect, useState, useCallback, type ReactNode, type CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const FADE_PX = 40;

function buildMask(fadeTop: boolean, fadeBottom: boolean): string {
  if (!fadeTop && !fadeBottom) return 'none';
  if (fadeTop && fadeBottom) {
    return `linear-gradient(to bottom, transparent 0, black ${FADE_PX}px, black calc(100% - ${FADE_PX}px), transparent 100%)`;
  }
  if (fadeTop) {
    return `linear-gradient(to bottom, transparent 0, black ${FADE_PX}px)`;
  }
  return `linear-gradient(to top, transparent 0, black ${FADE_PX}px)`;
}

export function ScrollFadeContainer({ children, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setFadeTop(el.scrollTop > 1);
    setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update]);

  const mask = buildMask(fadeTop, fadeBottom);

  return (
    <div ref={ref} className={className} style={{ ...style, WebkitMaskImage: mask, maskImage: mask }}>
      {children}
    </div>
  );
}
