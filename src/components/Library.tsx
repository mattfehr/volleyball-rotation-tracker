import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRotationSets, deleteRotationSet, renameRotationSet } from '../lib/firestore';
import type { RotationSet } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import CourtThumbnail from './CourtThumbnail';
import ConfirmDialog from './editor/ConfirmDialog';

const ITEMS_PER_PAGE = 9;

function CreateNewCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center min-h-[300px] group hover:border-athletic-orange transition-all cursor-pointer"
    >
      <span className="material-symbols-outlined text-outline group-hover:text-athletic-orange text-5xl mb-4 transition-colors">
        add_box
      </span>
      <span className="text-sm font-semibold text-on-surface-variant group-hover:text-athletic-orange transition-colors tracking-wide uppercase">
        Create New Strategy
      </span>
    </div>
  );
}

export default function Library() {
  const { user } = useAuth();
  const [sets, setSets] = useState<(RotationSet & { id: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<(RotationSet & { id: string }) | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    getUserRotationSets(user.uid).then(setSets);
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (editingId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingId]);

  const handleLoad = (set: RotationSet & { id: string }) => {
    localStorage.setItem('rotation-id', set.id);
    navigate('/');
  };

  const handleNewRotation = () => {
    localStorage.removeItem('rotation-id');
    navigate('/');
  };

  const handleDelete = async (set: RotationSet & { id: string }) => {
    await deleteRotationSet(user!.uid, set.id);
    setSets(prev => prev.filter(r => r.id !== set.id));
    setDeleteTarget(null);
  };

  const startRename = (set: RotationSet & { id: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(set.id);
    setEditTitle(set.title || 'Untitled');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveRename = async (set: RotationSet & { id: string }) => {
    const trimmed = editTitle.trim() || 'Untitled';
    const previousTitle = set.title || 'Untitled';
    setEditingId(null);
    setEditTitle('');

    if (trimmed === previousTitle) return;

    await renameRotationSet(user!.uid, set.id, trimmed);
    setSets(prev =>
      prev.map(r => (r.id === set.id ? { ...r, title: trimmed } : r))
    );
  };

  const handleRenameKeyDown = (
    e: React.KeyboardEvent,
    set: RotationSet & { id: string }
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveRename(set);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sets;
    const q = searchQuery.toLowerCase();
    return sets.filter(s => (s.title || '').toLowerCase().includes(q));
  }, [sets, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const showPagination = totalPages > 1;

  return (
    <div className="bg-surface-base text-on-surface font-sans min-h-screen flex flex-col">

      {/* ── Top Nav Bar ── */}
      <header className="bg-court-green shadow-md flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="font-display text-2xl font-extrabold text-athletic-orange">
            VolleyTactics Pro
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <button className="text-on-primary/80 hover:text-on-primary text-sm font-semibold transition-colors">
              Dashboard
            </button>
            <span className="text-athletic-orange border-b-2 border-athletic-orange text-sm font-bold pb-0.5">
              History
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="material-symbols-outlined text-on-primary p-2 hover:bg-primary-container/20 rounded-full transition-colors">
            settings
          </button>
          <button
            onClick={() => signOut(auth)}
            className="hidden md:flex items-center gap-1.5 text-on-primary/80 hover:text-on-primary px-4 py-2 text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-grow w-full max-w-screen-xl mx-auto px-6 py-8">

        {/* Page header + CTA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-5xl font-extrabold text-primary mb-2 tracking-tight">
              Tactical Library
            </h1>
            <p className="text-lg text-on-surface-variant">
              Review and manage your saved team rotations and game strategies.
            </p>
          </div>
          <button
            onClick={handleNewRotation}
            className="bg-athletic-orange text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-lg font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Rotation
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-grow relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sessions, teams, or dates..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-court-green focus:border-court-green outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
              Date
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">groups</span>
              Team
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
            </button>
            <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {paginated.map(set => (
            <div
              key={set.id}
              onClick={() => {
                if (editingId !== set.id) handleLoad(set);
              }}
              className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden group hover:shadow-md transition-all cursor-pointer"
            >
              <CourtThumbnail home={set.home} away={set.away} />

              <div className="p-4">
                {editingId === set.id ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={() => void saveRename(set)}
                    onKeyDown={e => handleRenameKeyDown(e, set)}
                    onClick={e => e.stopPropagation()}
                    className="font-display text-lg font-bold text-primary mb-1 w-full bg-surface-container-low border border-outline-variant rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-court-green"
                  />
                ) : (
                  <h3 className="font-display text-lg font-bold text-primary mb-1 truncate">
                    {set.title || 'Untitled'}
                  </h3>
                )}
                <div className="flex items-center gap-2 text-on-surface-variant mb-4">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="text-xs font-medium">
                    {set.updatedAt.toDate().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                  <span />
                  <div className="flex gap-3">
                    <button
                      onClick={e => startRename(set, e)}
                      className="material-symbols-outlined text-on-surface-variant hover:text-athletic-orange transition-colors"
                      title="Rename"
                    >
                      edit
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteTarget(set);
                      }}
                      className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
                      title="Delete"
                    >
                      delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <CreateNewCard onClick={handleNewRotation} />
        </div>

        {filtered.length === 0 && searchQuery && (
          <p className="text-center text-on-surface-variant mt-6">
            No rotations match "{searchQuery}".
          </p>
        )}

        {showPagination && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant hover:bg-surface-container'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Rotation"
          message={`Delete "${deleteTarget.title || 'Untitled'}"? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmVariant="danger"
          onConfirm={() => void handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
