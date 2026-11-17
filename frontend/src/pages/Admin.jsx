import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { Toast } from '../components/ui.jsx';
import ProjectsTab from '../components/admin/ProjectsTab.jsx';
import ExperienceTab from '../components/admin/ExperienceTab.jsx';
import CertificatesTab from '../components/admin/CertificatesTab.jsx';
import ProfileTab from '../components/admin/ProfileTab.jsx';
import ResumeTab from '../components/admin/ResumeTab.jsx';
import AccountTab from '../components/admin/AccountTab.jsx';

const TABS = [
  ['projects', 'Projects', ProjectsTab],
  ['experience', 'Experience', ExperienceTab],
  ['certificates', 'Certificates', CertificatesTab],
  ['profile', 'Profile', ProfileTab],
  ['resume', 'Resume', ResumeTab],
  ['account', 'Account', AccountTab],
];

export default function Admin() {
  const nav = useNavigate();
  const [tab, setTab] = useState('projects');
  const [toast, setToast] = useState({ msg: '', type: 'ok' });

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 3500);
  };

  // kick out if the token expired
  useEffect(() => {
    api.get('/auth/me').catch(() => {
      localStorage.removeItem('token');
      nav('/admin/login');
    });
  }, [nav]);

  const logout = () => {
    localStorage.removeItem('token');
    nav('/admin/login');
  };

  const Active = TABS.find(([k]) => k === tab)[2];

  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-xl text-white">
          <span className="text-neon">admin@portfolio</span>:~$ <span className="text-slate-500">dashboard</span>
        </h1>
        <div className="flex gap-2">
          <Link to="/" className="btn btn-sm">View site</Link>
          <button className="btn btn-sm" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 font-mono text-sm transition ${
              tab === k ? 'border-neon text-neon' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Active notify={notify} />
      <Toast {...toast} />
    </div>
  );
}
