import { useState } from 'react';
import api, { errMsg } from '../../api.js';
import { Field } from '../ui.jsx';

export default function AccountTab({ notify }) {
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return notify('New passwords do not match', 'error');
    setBusy(true);
    try {
      await api.put('/auth/password', {
        currentPassword: f.currentPassword,
        newPassword: f.newPassword,
      });
      notify('Password changed');
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card max-w-md space-y-4" onSubmit={submit}>
      <h3 className="font-mono text-neon">$ passwd</h3>
      <Field label="Current password">
        <input type="password" required autoComplete="current-password" className="input" value={f.currentPassword} onChange={set('currentPassword')} />
      </Field>
      <Field label="New password" hint="min 8 characters">
        <input type="password" required minLength={8} autoComplete="new-password" className="input" value={f.newPassword} onChange={set('newPassword')} />
      </Field>
      <Field label="Confirm new password">
        <input type="password" required minLength={8} autoComplete="new-password" className="input" value={f.confirm} onChange={set('confirm')} />
      </Field>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}
