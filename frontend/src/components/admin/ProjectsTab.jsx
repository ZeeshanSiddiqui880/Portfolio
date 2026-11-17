import { useEffect, useState, useCallback } from 'react';
import api, { errMsg } from '../../api.js';
import { Field } from '../ui.jsx';

const empty = {
  title: '', description: '', techStack: '', bullets: '',
  githubUrl: '', liveUrl: '', featured: false, order: 0,
};

export default function ProjectsTab({ notify }) {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | project
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/projects').then(({ data }) => setList(data)), []);
  useEffect(() => { load(); }, [load]);

  const open = (p) => {
    setImage(null);
    setRemoveImage(false);
    setForm(
      p === 'new'
        ? { ...empty, order: list.length + 1 }
        : { ...p, techStack: (p.techStack || []).join(', '), bullets: (p.bullets || []).join('\n') }
    );
    setEditing(p);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      ['title', 'description', 'techStack', 'bullets', 'githubUrl', 'liveUrl', 'order'].forEach((k) =>
        fd.append(k, form[k] ?? '')
      );
      fd.append('featured', form.featured);
      if (image) fd.append('image', image);
      if (removeImage) fd.append('removeImage', 'true');

      if (editing === 'new') await api.post('/projects', fd);
      else await api.put(`/projects/${editing._id}`, fd);

      notify(editing === 'new' ? 'Project added' : 'Project updated');
      setEditing(null);
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await api.delete(`/projects/${p._id}`);
      notify('Project deleted');
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  if (editing) {
    return (
      <form className="card space-y-4" onSubmit={save}>
        <h3 className="font-mono text-neon">{editing === 'new' ? '$ add project' : '$ edit project'}</h3>
        <Field label="Title *"><input required className="input" value={form.title} onChange={set('title')} /></Field>
        <Field label="Short description"><input className="input" value={form.description} onChange={set('description')} /></Field>
        <Field label="Tech stack" hint="comma separated">
          <input className="input" value={form.techStack} onChange={set('techStack')} placeholder="React, Node.js, MongoDB" />
        </Field>
        <Field label="Highlights" hint="one per line">
          <textarea rows="6" className="input" value={form.bullets} onChange={set('bullets')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="GitHub URL"><input className="input" value={form.githubUrl} onChange={set('githubUrl')} /></Field>
          <Field label="Live demo URL"><input className="input" value={form.liveUrl} onChange={set('liveUrl')} /></Field>
          <Field label="Order" hint="lower = first"><input type="number" className="input" value={form.order} onChange={set('order')} /></Field>
        </div>
        <Field label="Screenshot" hint="optional, uploaded to Cloudinary">
          <input type="file" accept="image/*" className="input" onChange={(e) => setImage(e.target.files[0] || null)} />
        </Field>
        {editing !== 'new' && editing.imageUrl && (
          <div className="flex items-center gap-3">
            <img className="h-11 w-16 rounded border border-line object-cover" src={editing.imageUrl} alt="" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
              Delete current image
            </label>
          </div>
        )}
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
        <h3 className="font-mono text-slate-400">{list.length} project{list.length !== 1 && 's'}</h3>
        <button className="btn btn-primary btn-sm" onClick={() => open('new')}>+ Add project</button>
      </div>
      {list.map((p) => (
        <div className="card flex flex-wrap items-center justify-between gap-3" key={p._id}>
          <div className="flex items-center gap-3">
            {p.imageUrl && <img className="h-11 w-16 rounded border border-line object-cover" src={p.imageUrl} alt="" />}
            <div>
              <p className="font-semibold text-white">{p.title}</p>
              <p className="font-mono text-xs text-slate-500">{(p.techStack || []).join(' · ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => open(p)}>Edit</button>
            <button className="btn btn-sm btn-danger" onClick={() => remove(p)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
