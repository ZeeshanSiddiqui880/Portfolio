import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Field, FileOrLink } from '../ui.jsx';

const empty = {
  role: '', company: '', period: '', bullets: '', order: 0,
  certificateLink: '', lorLink: '',
};

export default function ExperienceTab({ notify }) {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | experience
  const [form, setForm] = useState(empty);
  const [certFile, setCertFile] = useState(null);
  const [lorFile, setLorFile] = useState(null);
  const [rmCert, setRmCert] = useState(false);
  const [rmLor, setRmLor] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/experience').then(({ data }) => setList(data)), []);
  useEffect(() => { load(); }, [load]);

  const open = (x) => {
    setCertFile(null); setLorFile(null); setRmCert(false); setRmLor(false);
    setForm(
      x === 'new'
        ? { ...empty, order: list.length + 1 }
        : { ...empty, ...x, bullets: (x.bullets || []).join('\n') }
    );
    setEditing(x);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      ['role', 'company', 'period', 'bullets', 'order', 'certificateLink', 'lorLink'].forEach((k) =>
        fd.append(k, form[k] ?? '')
      );
      if (certFile) fd.append('certificate', certFile);
      if (lorFile) fd.append('lor', lorFile);
      if (rmCert) fd.append('remove_certificate', 'true');
      if (rmLor) fd.append('remove_lor', 'true');

      if (editing === 'new') await api.post('/experience', fd);
      else await api.put(`/experience/${editing._id}`, fd);

      notify(editing === 'new' ? 'Experience added' : 'Experience updated');
      setEditing(null);
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (x) => {
    if (!window.confirm(`Delete "${x.role}"? Its uploaded files are deleted too.`)) return;
    try {
      await api.delete(`/experience/${x._id}`);
      notify('Experience deleted');
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  if (editing) {
    const cur = editing === 'new' ? {} : editing;
    return (
      <form className="card space-y-4" onSubmit={save}>
        <h3 className="font-mono text-neon">{editing === 'new' ? '$ add experience' : '$ edit experience'}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Role *"><input required className="input" value={form.role} onChange={set('role')} /></Field>
          <Field label="Company"><input className="input" value={form.company} onChange={set('company')} /></Field>
          <Field label="Period"><input className="input" value={form.period} onChange={set('period')} placeholder="Oct 2025 – Jun 2026" /></Field>
        </div>
        <Field label="Highlights" hint="one per line. A short line like Impact or Projects becomes a heading. Write Name (type): description. Tech, Tech for project cards with tech chips">
          <textarea rows="6" className="input" value={form.bullets} onChange={set('bullets')} />
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <FileOrLink
            title="Experience certificate"
            existingUrl={cur.certificateFileUrl}
            onFile={setCertFile}
            link={form.certificateLink}
            onLink={(v) => setForm({ ...form, certificateLink: v })}
            remove={rmCert}
            onRemove={setRmCert}
          />
          <FileOrLink
            title="Letter of recommendation (LOR)"
            existingUrl={cur.lorFileUrl}
            onFile={setLorFile}
            link={form.lorLink}
            onLink={(v) => setForm({ ...form, lorLink: v })}
            remove={rmLor}
            onRemove={setRmLor}
          />
        </div>

        <Field label="Order" hint="lower = first" className="max-w-[160px]">
          <input type="number" className="input" value={form.order} onChange={set('order')} />
        </Field>
        <div className="flex gap-3">
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-slate-400">{list.length} experience entr{list.length === 1 ? 'y' : 'ies'}</h3>
        <button className="btn btn-primary btn-sm" onClick={() => open('new')}>+ Add experience</button>
      </div>
      {list.map((x) => (
        <div className="card flex flex-wrap items-center justify-between gap-3" key={x._id}>
          <div>
            <p className="font-semibold text-white">{x.role} <span className="text-neon">@ {x.company}</span></p>
            <p className="font-mono text-xs text-slate-500">
              {x.period}
              {(x.certificateFileUrl || x.certificateLink) && ' · certificate'}
              {(x.lorFileUrl || x.lorLink) && ' · LOR'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => open(x)}>Edit</button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(x)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
