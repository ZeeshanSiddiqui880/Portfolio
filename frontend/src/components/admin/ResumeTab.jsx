import { useEffect, useState, useCallback } from 'react';
import api, { errMsg, resumeDownloadUrl } from '../../api.js';
import { Field, Spinner } from '../ui.jsx';

export default function ResumeTab({ notify }) {
  const [info, setInfo] = useState(null);
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api.get('/profile').then(({ data }) => {
        setInfo({ hasFile: Boolean(data.hasResumeFile), hasAny: Boolean(data.hasResume) });
        setLink(data.resumeLink || '');
      }),
    []
  );
  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      await api.post('/resume', fd);
      notify('Resume uploaded');
      setFile(null);
      e.target.reset();
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async () => {
    if (!window.confirm('Delete the uploaded resume file from Cloudinary?')) return;
    try {
      await api.delete('/resume');
      notify('Resume file deleted');
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  const saveLink = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile', { resumeLink: link.trim() });
      notify(link.trim() ? 'Resume link saved' : 'Resume link removed');
      load();
    } catch (err) {
      notify(errMsg(err), 'error');
    }
  };

  if (!info) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">
            {info.hasFile ? 'Resume file uploaded' : info.hasAny ? 'Using external link only' : 'No resume yet'}
          </p>
          <p className="text-sm text-slate-500">
            Visitors get the uploaded file. If it is missing or Cloudinary fails, they are sent to the link below.
          </p>
        </div>
        {info.hasAny && (
          <div className="flex gap-2">
            <a className="btn btn-sm" href={resumeDownloadUrl}>Download</a>
            {info.hasFile && <button className="btn btn-sm btn-danger" onClick={removeFile}>Delete file</button>}
          </div>
        )}
      </div>

      <form className="card space-y-3" onSubmit={upload}>
        <h3 className="font-mono text-neon">{info.hasFile ? '$ replace resume' : '$ upload resume'}</h3>
        <input type="file" accept=".pdf,.doc,.docx" className="input" onChange={(e) => setFile(e.target.files[0] || null)} />
        <p className="text-sm text-slate-500">PDF or Word, max 5 MB. Uploading replaces the old file.</p>
        <button className="btn btn-primary" disabled={!file || busy}>{busy ? 'Uploading…' : 'Upload'}</button>
      </form>

      <form className="card space-y-3" onSubmit={saveLink}>
        <h3 className="font-mono text-neon">$ separate resume link</h3>
        <Field label="External URL" hint="Google Drive, Dropbox, etc. Leave empty to remove.">
          <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/…" />
        </Field>
        <button className="btn btn-primary">Save link</button>
      </form>
    </div>
  );
}
