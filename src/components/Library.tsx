import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRotationSets } from '../lib/firestore';
import type { RotationSet } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Library() {
  const { user } = useAuth();
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
          📂 My Saved Rotations
        </h1>
        <button
          onClick={() => signOut(auth)}
          className="bg-red-600 hover:bg-red-700 text-black px-4 py-1.5 rounded font-semibold shadow"
        >
          🔓 Log Out
        </button>
      </div>

      {sets.length === 0 ? (
        <p>No saved rotations yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white text-black p-4 rounded shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{set.title || "Untitled"}</h2>
              <p className="text-sm mb-2">🕓 Last saved: {set.updatedAt.toDate().toLocaleString()}</p>
              <button
                onClick={() => handleLoad(set)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Load into Editor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
