import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRotationSets, deleteRotationSet } from '../lib/firestore';
import type { RotationSet } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Library() {
  const { user, username } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState<(RotationSet & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    getUserRotationSets(user.uid).then(setSets);
  }, [user]);

  const handleLoad = (set: RotationSet & { id: string }) => {
    localStorage.setItem('rotation-id', set.id);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-green-800 text-white p-8">
      {/* Header + Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          📂 {username ?? "My"}'s Rotations
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('rotation-id'); // ⬅️ clear stale ID
              navigate('/');
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-1.5 rounded font-semibold shadow ml-4"
          >
            ➕ New
          </button>
          <button
            onClick={() => signOut(auth)}
            className="bg-white hover:bg-gray-100 text-black px-4 py-1.5 rounded font-semibold shadow flex items-center gap-1"
          >
            🔒 Log Out
          </button>
        </div>
      </div>

      {sets.length === 0 ? (
        <p>No saved rotations yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white text-black p-4 rounded shadow hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold mb-2">{set.title || "Untitled"}</h2>
                <p className="text-sm mb-4">
                  🕓 Last saved: {set.updatedAt.toDate().toLocaleString()}
                </p>
              </div>

              <div className="flex justify-between items-center gap-2">
                <button
                  onClick={() => handleLoad(set)}
                  className="bg-blue-500 hover:bg-blue-600 text-black px-2 py-1 rounded text-sm w-full"
                >
                  Load into Editor
                </button>
                <button
                  onClick={async () => {
                    const confirmDelete = confirm('Delete this rotation?');
                    if (!confirmDelete) return;
                    await deleteRotationSet(user!.uid, set.id);
                    setSets(prev => prev.filter(r => r.id !== set.id));
                  }}
                  className="bg-red-500 hover:bg-red-600 text-black px-2 py-1 rounded text-sm"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
