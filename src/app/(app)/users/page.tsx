'use client';
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { appRoleOf, scopeOf } from '@/lib/bsc';
import { Icon, IC } from '@/components/ui';
import { LOGO } from '@/lib/logo';
import type { AppUser } from '@/lib/types';

export default function UsersPage() {
  const { db, session, saveUser, deleteUser } = useStore();
  const admin = session.role === 'admin';
  const [edit, setEdit] = useState<AppUser | null>(null);
  const [orig, setOrig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const accShort = (id: string | null) => (id === 'ALL' ? 'Semua Unit' : db.accountability.find((a) => a.id === id)?.short || id);
  const adminCount = useMemo(() => db.app_users.filter((u) => /admin/i.test(u.role || '') && u.status === 'Active').length, [db.app_users]);

  const open = (u: AppUser | null) => {
    if (!admin) return;
    setOrig(u ? u.email : null);
    setEdit(u ? { ...u } : { email: '', name: '', role: 'Program PIC', dept: '', acc_id: db.accountability[0]?.id || 'ALL', can_edit: true, can_approve: false, status: 'Active' });
  };

  const depts = useMemo(() => {
    const base = db.accountability.map((a) => a.short!).filter(Boolean);
    if (edit?.dept && edit.dept !== 'All' && !base.includes(edit.dept)) base.push(edit.dept);
    return base;
  }, [db.accountability, edit?.dept]);

  const syncRole = (role: string, u: AppUser): AppUser => {
    if (/admin/i.test(role)) return { ...u, role, can_edit: true, can_approve: true };
    if (role === 'Viewer') return { ...u, role, can_edit: false, can_approve: false };
    return { ...u, role, can_edit: true };
  };

  const save = async () => {
    if (!edit) return;
    if (!edit.name.trim()) return alert('Nama wajib diisi.');
    if (!/.+@.+/.test(edit.email)) return alert('Email tidak valid.');
    if (!orig && db.app_users.some((x) => x.email.toLowerCase() === edit.email.toLowerCase())) return alert('Email sudah terdaftar.');
    setBusy(true);
    try { await saveUser(edit, orig); setEdit(null); } catch (e: any) { alert('Gagal menyimpan: ' + e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!edit) return;
    if (/admin/i.test(edit.role) && adminCount <= 1) return alert('Tidak bisa menghapus satu-satunya Administrator.');
    if (!confirm('Hapus pengguna ' + edit.name + '?')) return;
    setBusy(true);
    try { await deleteUser(edit.email); setEdit(null); } catch (e: any) { alert('Gagal: ' + e.message); } finally { setBusy(false); }
  };

  const eff = edit ? (() => {
    const r = appRoleOf(edit); const sc = scopeOf(edit); const ac = db.accountability.find((a) => a.id === edit.acc_id);
    const unit = (r === 'admin' || !sc) ? 'semua unit' : (ac?.short || edit.acc_id);
    return r === 'admin' ? 'Administrator — semua unit & kelola pengguna' : r === 'pic' ? `Program PIC — ${unit} (lihat & ubah)` : `Viewer — ${unit} (hanya lihat)`;
  })() : '';

  return (
    <>
      {admin && (
        <div className="toolbar"><div style={{ flex: 1 }} />
          <button className="btn solid" onClick={() => open(null)}><Icon path={IC.plus} />Tambah Pengguna</button>
        </div>
      )}
      <div className="tbl-wrap"><div className="tbl-scroll">
        <table>
          <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Unit</th><th>Hak Edit</th><th>Hak Approve</th><th>Status</th>{admin && <th></th>}</tr></thead>
          <tbody>
            {db.app_users.map((u) => {
              const r = appRoleOf(u);
              return (
                <tr key={u.email} style={{ cursor: admin ? 'pointer' : 'default' }} onClick={() => admin && open(u)}>
                  <td><b>{u.name}</b>{r === 'admin' && <span className="tag-sm" style={{ marginLeft: 6 }}>ADMIN</span>}</td>
                  <td className="muted">{u.email}</td>
                  <td>{u.role}</td>
                  <td>{accShort(u.acc_id)}</td>
                  <td>{u.can_edit ? <span className="badge b-on"><span className="dot" />Ya</span> : <span className="badge b-off"><span className="dot" />Tidak</span>}</td>
                  <td>{u.can_approve ? <span className="badge b-on"><span className="dot" />Ya</span> : <span className="badge b-off"><span className="dot" />Tidak</span>}</td>
                  <td>{u.status === 'Active' ? <span className="badge b-on"><span className="dot" />Aktif</span> : <span className="pill">{u.status}</span>}</td>
                  {admin && <td><Icon path={IC.edit} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></div>
      <p className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
        {admin ? 'Klik baris untuk mengubah peran, unit, dan hak akses. Peran "Administrator" akses penuh; "Program PIC" dibatasi unitnya (atau "Semua Unit" untuk lintas-unit).' : 'Manajemen pengguna hanya tersedia untuk Administrator.'}
      </p>

      {edit && (
        <div className="modal-bg show" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setEdit(null); }}>
          <div className="modal" style={{ width: 640 }}>
            <div className="modal-head">
              <div className="brand-mark" style={{ width: 34, height: 34 }}><img src={LOGO} alt="" /></div>
              <h3 style={{ marginTop: 2 }}>{orig ? 'Ubah Akses Pengguna' : 'Tambah Pengguna'}</h3>
              <button className="x" onClick={() => setEdit(null)}><Icon path={IC.x} /></button>
            </div>
            <div className="modal-body"><div className="form-grid">
              <div className="fg"><label>Nama Lengkap</label><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div className="fg"><label>Email</label><input value={edit.email} disabled={!!orig} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
              <div className="fg"><label>Peran Akses</label>
                <select value={/admin/i.test(edit.role) ? 'Administrator' : edit.role} onChange={(e) => setEdit(syncRole(e.target.value, edit))}>
                  <option>Administrator</option><option>Program PIC</option><option>Viewer</option>
                </select>
              </div>
              <div className="fg"><label>Unit Akuntabilitas</label>
                <select value={edit.acc_id || 'ALL'} onChange={(e) => setEdit({ ...edit, acc_id: e.target.value })}>
                  <option value="ALL">Semua Unit (All)</option>
                  {db.accountability.map((a) => <option key={a.id} value={a.id}>{a.short} — {a.name}</option>)}
                </select>
              </div>
              <div className="fg"><label>Departemen</label>
                <select value={edit.dept || 'All'} onChange={(e) => setEdit({ ...edit, dept: e.target.value })}>
                  <option value="All">Semua Departemen (All)</option>
                  {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="fg"><label>Status</label>
                <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}><option>Active</option><option>Inactive</option></select>
              </div>
              <div className="fg full" style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--ink)' }}>
                  <input type="checkbox" checked={edit.can_edit} onChange={(e) => setEdit({ ...edit, can_edit: e.target.checked })} style={{ width: 'auto' }} /> Hak mengubah data (edit)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--ink)' }}>
                  <input type="checkbox" checked={edit.can_approve} onChange={(e) => setEdit({ ...edit, can_approve: e.target.checked })} style={{ width: 'auto' }} /> Hak menyetujui (approve)
                </label>
              </div>
              <div className="fg full"><div className="ro">Akses efektif: <b>{eff}</b></div></div>
            </div></div>
            <div className="modal-foot">
              {orig && !(/admin/i.test(edit.role) && adminCount <= 1) && <button className="btn ghost" style={{ color: 'var(--off)' }} onClick={remove}>Hapus</button>}
              <button className="btn" onClick={() => setEdit(null)}>Tutup</button>
              <button className="btn solid" disabled={busy} onClick={save}><Icon path={IC.check} />{busy ? 'Menyimpan…' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
