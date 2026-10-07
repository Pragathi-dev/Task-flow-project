import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * Renders children into document.body via a portal.
 * Creates and cleans up the portal container element automatically.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  const [container] = useState(() => {
    const el = document.createElement('div');
    el.setAttribute('data-portal', 'modal');
    return el;
  });

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  return createPortal(children, container);
}
