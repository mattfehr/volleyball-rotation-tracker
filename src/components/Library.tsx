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
    <div className="min-h-screen w-screen bg-green-700 text-white p-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-center md:text-left">
          📁 {username ?? "My"}'s Rotations
        </h1>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => {
              localStorage.removeItem('rotation-id');
              navigate('/');
            }}
            className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded font-semibold shadow"
          >
            ➕ New
          </button>
          <button
            onClick={() => signOut(auth)}
            className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded font-semibold shadow flex items-center gap-1"
          >
            🔒 Log Out
          </button>
        </div>
      </div>

      {/* Saved Rotations */}
      {sets.length === 0 ? (
        <p className="text-lg mt-8">No saved rotations yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white text-black p-4 rounded-xl shadow hover:shadow-lg transition flex flex-col justify-between w-full"
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
                  className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 rounded text-sm w-full font-medium"
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
                  className="bg-red-200 hover:bg-red-300 text-black px-3 py-1 rounded text-sm"
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
