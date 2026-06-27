'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ROLE_LABEL } from '@/lib/bsc';
import { Icon, IC, csvCell } from '@/components/ui';
import { LOGO } from '@/lib/logo';
import { ragOf } from '@/lib/bsc';

const NAV = [
  { id: 'dashboard', label: 'Dasbor', icon: IC.dash },
  { id: 'strategy', label: 'Peta Strategi', icon: IC.map },
  { id: 'indicators', label: 'Indikator KPI', icon: IC.list },
  { id: 'analytics', label: 'Analitik', icon: IC.chart },
  { grp: 'Pengaturan' } as any,
  { id: 'master', label: 'Data Master', icon: IC.db },
  { id: 'users', label: 'Pengguna', icon: IC.users, admin: true },
  { id: 'settings', label: 'Pengaturan', icon: IC.cog },
];

const TITLE: Record<string, [string, string]> = {
  dashboard: ['Dasbor', 'Ringkasan kinerja strategis'],
  strategy: ['Peta Strategi', 'Balanced Scorecard — 4 perspektif'],
  indicators: ['Indikator KPI', 'Kelola dan pantau indikator kinerja'],
  analytics: ['Analitik', 'Analisis capaian lintas perspektif & unit'],
  master: ['Data Master', 'Struktur Balanced Scorecard'],
  users: ['Pengguna', 'Manajemen akses & peran'],
  settings: ['Pengaturan', 'Profil, data, dan informasi aplikasi'],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { db, session, logout, setYear, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const view = pathname.split('/')[1] || 'dashboard';

  useEffect(() => { if (ready && !session.user) router.replace('/login'); }, [ready, session.user, router]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!session.user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Memuat…</div>;

  const years = [...new Set(db.indicators.map((i) => i.year))].sort();
  const ac = db.accountability.find((a) => a.id === session.scope);
  const [title, sub] = TITLE[view] || ['', ''];
  const u = session.user;
  const initials = (u.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const exportCSV = () => {
    const list = db.indicators.filter((i) => i.year === session.year && (!session.scope || i.acc_id === session.scope));
    const cols: [keyof typeof list[number] | string, string][] = [
      ['year', 'Tahun'], ['sm_id', 'PerspektifID'], ['code', 'Kode'], ['name', 'Indikator'], ['unit', 'Satuan'],
      ['program_name', 'Program'], ['acc_id', 'UnitID'], ['pic', 'PIC'], ['direction', 'Arah'],
      ['target_year_raw', 'TargetTahun'], ['actual_raw', 'Aktual'], ['target_2030_raw', 'Target2030'],
      ['q1', 'Q1'], ['q2', 'Q2'], ['q3', 'Q3'], ['q4', 'Q4'], ['status', 'Status'],
    ];
    const head = cols.map((c) => c[1]).concat(['CapaianTahun%', 'StatusKinerja']);
    const rows = list.map((i: any) => {
      const r = ragOf(i);
      const base = cols.map((c) => {
        const key = c[0] as string;
        let v = i[key];
        if (key.endsWith('_raw')) v = i[key] ?? i[key.replace('_raw', '')];
        return csvCell(v);
      });
      base.push(csvCell(r.ratio != null ? Math.round(r.ratio * 100) : ''));
      base.push(csvCell(r.label));
      return base.join(',');
    });
    const csv = '\ufeff' + head.map(csvCell).join(',') + '\r\n' + rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `TFID_Strategic_Performance_${session.year}.csv`;
    a.click();
  };

  return (
    <div id="app">
      <div className={`backdrop${menuOpen ? ' show' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className="layout">
        <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
          <div className="side-brand">
            <div className="brand-mark"><img src={LOGO} alt="Tanoto Foundation" /></div>
            <div className="txt"><h1>Tanoto Foundation</h1><div className="sub">Strategic Performance</div></div>
          </div>
          <nav className="nav">
            {NAV.map((n: any, ix) =>
              n.grp ? <div className="grp" key={'g' + ix}>{n.grp}</div>
                : (n.admin && session.role !== 'admin') ? null
                : <Link key={n.id} href={`/${n.id}`} className={view === n.id ? 'active' : ''}>
                    <Icon path={n.icon} /><span>{n.label}</span>
                  </Link>
            )}
          </nav>
          <div className="side-foot">
            <div className="user-chip">
              <div className="av">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="nm">{u.name}</div>
                <div className="rl">{ROLE_LABEL[session.role]} · {u.dept || ''}</div>
              </div>
            </div>
            <button className="logout" onClick={() => { logout(); router.replace('/login'); }}>Keluar dari sesi</button>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <button className="icon-btn menu-toggle" onClick={() => setMenuOpen(true)} title="Menu">
              <Icon path='<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' />
            </button>
            <div className="ttl"><h2>{title}</h2><p>{(view === 'dashboard' || view === 'strategy' || view === 'indicators' || view === 'analytics') ? `Tahun ${session.year} · ${sub}` : sub}</p></div>
            <div className="spacer" />
            <span className="scope-chip"><Icon path={IC.db} />{session.scope ? `Unit: ${ac?.short || session.scope}` : 'Semua Unit'}</span>
            <div className="yearsel">
              {years.map((y) => (
                <button key={y} className={y === session.year ? 'active' : ''} onClick={() => setYear(y)}>{y}</button>
              ))}
            </div>
            <button className="icon-btn" onClick={exportCSV} title="Ekspor ke Excel (CSV)"><Icon path={IC.download} /></button>
            <button className="icon-btn" onClick={() => window.print()} title="Cetak / Simpan PDF">
              <Icon path='<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>' />
            </button>
          </header>
          <div className="content">{children}</div>
        </div>
      </div>
    </div>
  );
}
