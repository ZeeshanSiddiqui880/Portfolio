import { useEffect, useRef, useState } from 'react';

export const Spinner = () => (
  <div className="mx-auto my-8 h-8 w-8 animate-spin rounded-full border-4 border-line border-t-neon" />
);

// Fades content in when it scrolls into view
export function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition duration-700 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}

// Code-editor style window with traffic-light dots
export function Terminal({ title, children, className = '', bodyClass = 'p-5' }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-line bg-panel shadow-lg shadow-black/30 transition hover:border-neon/40 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-line bg-soft px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber2/80" />
        <span className="h-3 w-3 rounded-full bg-neon/80" />
        <span className="ml-3 truncate font-mono text-xs text-slate-500">{title}</span>
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export function SectionTitle({ cmd, children }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-sm text-neon">$ {cmd}</p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">{children}</h2>
    </div>
  );
}

/* ---------- admin form helpers ---------- */
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-medium text-slate-300 ${className}`}>
      <span>
        {label} {hint && <small className="font-normal text-slate-500">{hint}</small>}
      </span>
      {children}
    </label>
  );
}

// Optional document slot: Cloudinary file and/or separate link
export function FileOrLink({ title, existingUrl, onFile, link, onLink, remove, onRemove }) {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-soft p-4">
      <p className="font-mono text-sm text-neon">
        {title} <span className="text-slate-500">(optional)</span>
      </p>
      <Field label="Upload file" hint="PDF or image, max 5 MB">
        <input
          type="file"
          accept="application/pdf,image/*"
          className="input"
          onChange={(e) => onFile(e.target.files[0] || null)}
        />
      </Field>
      {existingUrl && (
        <div className="flex flex-wrap items-center gap-3">
          <a className="btn btn-sm" href={existingUrl} target="_blank" rel="noreferrer">
            Current file ↗
          </a>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remove} onChange={(e) => onRemove(e.target.checked)} />
            Delete this file from Cloudinary
          </label>
        </div>
      )}
      <Field label="Or separate link" hint="Drive, Credly, etc. Works even without Cloudinary">
        <input
          className="input"
          value={link}
          onChange={(e) => onLink(e.target.value)}
          placeholder="https://…"
        />
      </Field>
    </div>
  );
}

export function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-lg border bg-panel px-4 py-3 font-mono text-sm shadow-xl ${
        type === 'error' ? 'border-red-400 text-red-400' : 'border-neon text-neon'
      }`}
    >
      {msg}
    </div>
  );
}
