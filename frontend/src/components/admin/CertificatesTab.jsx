import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Field, FileOrLink } from '../ui.jsx';

const empty = { title: '', issuer: '', issueDate: '', link: '', order: 0 };

export default function CertificatesTab({ notify }) {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | certificate
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/certificates').then(({ data }) => setList(data)), []);
  useEffect(() => { load(); }, [load]);

  const open = (c) => {
    setFile(null);
    setRemoveFile(false);
    setForm(c === 'new' ? { ...empty, order: list.length + 1 } : { ...empty, ...c });
    setEditing(c);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      ['title', 'issuer', 'issueDate', 'link', 'order'].forEach((k) => fd.append(k, form[k] ?? ''));
      if (file) fd.append('file', file);
      if (removeFile) fd.append('removeFile', 'true');

      if (editing === 'new') await api.post('/certificates', fd);
      else await api.put(`/certificates/${editing._id}`, fd);

      notify(editing === 'new' ? 'Certificate added' : 'Certificate updated');
      setEditing(null);
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.title}"? Its uploaded file is deleted too.`)) return;
    try {
      await api.delete(`/certificates/${c._id}`);
      notify('Certificate deleted');
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  if (editing) {
    const cur = editing === 'new' ? {} : editing;
    return (
      <form className="card space-y-4" onSubmit={save}>
        <h3 className="font-mono text-neon">{editing === 'new' ? '$ add certificate' : '$ edit certificate'}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Title *" className="sm:col-span-3">
            <input required className="input" value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Issuer"><input className="input" value={form.issuer} onChange={set('issuer')} placeholder="Udemy, Coursera…" /></Field>
          <Field label="Date"><input className="input" value={form.issueDate} onChange={set('issueDate')} placeholder="Mar 2025" /></Field>
          <Field label="Order" hint="lower = first"><input type="number" className="input" value={form.order} onChange={set('order')} /></Field>
        </div>
        <FileOrLink
          title="Certificate"
          existingUrl={cur.fileUrl}
          onFile={setFile}
          link={form.link}
          onLink={(v) => setForm({ ...form, link: v })}
          remove={removeFile}
          onRemove={setRemoveFile}
        />
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
        <h3 className="font-mono text-slate-400">{list.length} certificate{list.length !== 1 && 's'}</h3>
        <button className="btn btn-primary btn-sm" onClick={() => open('new')}>+ Add certificate</button>
      </div>
      {list.map((c) => (
        <div className="card flex flex-wrap items-center justify-between gap-3" key={c._id}>
          <div>
            <p className="font-semibold text-white">{c.title}</p>
            <p className="font-mono text-xs text-slate-500">
              {[c.issuer, c.issueDate].filter(Boolean).join(' · ')}
              {c.fileUrl && ' · file'}
              {c.link && ' · link'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => open(c)}>Edit</button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
