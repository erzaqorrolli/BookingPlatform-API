import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MobileExpandableCard({ summary, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <article className={`mobile-expandable-card ${className}`.trim()}>
      <div className="mobile-expandable-card-summary">{summary}</div>
      <button
        type="button"
        className="mobile-expandable-card-toggle"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {open ? 'Close' : 'Open'}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={detailsId}
        className={`mobile-expandable-card-details${open ? ' is-open' : ''}`}
      >
        {children}
      </div>
    </article>
  );
}
