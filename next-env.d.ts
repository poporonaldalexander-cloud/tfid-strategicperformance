'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { LOGO } from '@/lib/logo';
import { Icon } from '@/components/ui';

export default function LoginPage() {
  const { login, session, ready, loggingIn, loginError } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { if (session.user) router.replace('/dashboard'); }, [session.user, router]);

  const submit = () => { if (email && pwd && !loggingIn) login(email, pwd); };

  return (
    <div className="login-split">
      <div className="ls-brand">
        <div className="ls-brand-inner">
          <div className="ls-logo"><img src={LOGO} alt="Tanoto Foundation" /></div>
          <h1>Strategic Performance</h1>
          <p className="ls-tag">Sistem Manajemen Kinerja Strategis berbasis Balanced Scorecard</p>
          <div className="ls-pills">
            <span>Strategy Map</span><span>Balanced Scorecard</span><span>Monitoring &amp; Evaluasi</span>
          </div>
        </div>
        <div className="ls-foot">Tanoto Foundation</div>
      </div>

      <div className="ls-form">
        <div className="ls-card">
          <h2>Selamat datang</h2>
          <p className="ls-sub">Masuk untuk melanjutkan ke Strategic Performance.</p>

          {loginError && <div className="ls-error">{loginError}</div>}

          <div className="ls-field">
            <label>Email</label>
            <input type="email" autoComplete="username" placeholder="cth. nama@tanotofoundation.org"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>

          <div className="ls-field">
            <label>Kata sandi</label>
            <div className="ls-pwd">
              <input type={showPwd ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                value={pwd} onChange={(e) => setPwd(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()} />
              <button type="button" className="ls-eye" onClick={() => setShowPwd((s) => !s)} title={showPwd ? 'Sembunyikan' : 'Tampilkan'}>
                {showPwd ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>

          <button className="ls-btn" disabled={!email || !pwd || loggingIn} onClick={submit}>
            {loggingIn ? 'Memproses…' : 'Masuk'}
          </button>

          <p className="ls-hint">Gunakan email dan kata sandi yang diberikan administrator. Hubungi administrator bila lupa kata sandi.</p>
        </div>
      </div>
    </div>
  );
}

