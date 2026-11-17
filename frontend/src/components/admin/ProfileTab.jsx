import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api.js';
import { Field, Spinner } from '../ui.jsx';

const skillsToText = (s = []) => s.map((g) => `${g.category}: ${g.items.join(', ')}`).join('\n');
const textToSkills = (t) =>
  t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf(':');
    return {
      category: i === -1 ? 'Other' : l.slice(0, i).trim(),
      items: (i === -1 ? l : l.slice(i + 1)).split(',').map((x) => x.trim()).filter(Boolean),
    };
  });

const eduToText = (e = []) => e.map((x) => [x.degree, x.school, x.year].join(' | ')).join('\n');
const textToEdu = (t) =>
  t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [degree = '', school = '', year = ''] = l.split('|').map((x) => x.trim());
    return { degree, school, year };
  });

export default function ProfileTab({ notify }) {
  const [f, setF] = useState(null);
  const [skillsText, setSkillsText] = useState('');
  const [eduText, setEduText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      setF(data);
      setSkillsText(skillsToText(data.skills));
      setEduText(eduToText(data.education));
    });
  }, []);

  if (!f) return <Spinner />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/profile', {
        name: f.name, title: f.title, summary: f.summary, location: f.location,
        email: f.email, phone: f.phone, github: f.github, linkedin: f.linkedin, leetcode: f.leetcode,
        skills: textToSkills(skillsText),
        education: textToEdu(eduText),
      });
      notify('Profile saved');
    } catch (err) {
      notify(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={save}>
      <div className="card grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className="input" value={f.name || ''} onChange={set('name')} /></Field>
        <Field label="Title"><input className="input" value={f.title || ''} onChange={set('title')} /></Field>
        <Field label="Location"><input className="input" value={f.location || ''} onChange={set('location')} /></Field>
        <Field label="Phone"><input className="input" value={f.phone || ''} onChange={set('phone')} placeholder="+91 …" /></Field>
        <Field label="Public email"><input type="email" className="input" value={f.email || ''} onChange={set('email')} /></Field>
        <Field label="GitHub URL"><input className="input" value={f.github || ''} onChange={set('github')} /></Field>
        <Field label="LinkedIn URL"><input className="input" value={f.linkedin || ''} onChange={set('linkedin')} /></Field>
        <Field label="LeetCode URL"><input className="input" value={f.leetcode || ''} onChange={set('leetcode')} /></Field>
        <Field label="Summary" className="sm:col-span-2">
          <textarea rows="4" className="input" value={f.summary || ''} onChange={set('summary')} />
        </Field>
      </div>

      <div className="card space-y-4">
        <Field label="Skills" hint="one group per line → Category: item, item">
          <textarea rows="6" className="input font-mono" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
        </Field>
        <Field label="Education" hint="Degree | School | Year (one per line)">
          <textarea rows="2" className="input font-mono" value={eduText} onChange={(e) => setEduText(e.target.value)} />
        </Field>
      </div>

      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}
