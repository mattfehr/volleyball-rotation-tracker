import { useState } from 'react';
import type { Player } from './models/Player';
import Court from './components/Court';
import { v4 as uuid } from 'uuid';

function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: uuid(), label: 'S', name: 'Alex', x: 200, y: 200 },
  ]);

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayer = () => {
    setPlayers([...players, {
      id: uuid(),
      label: 'New',
      name: '',
      x: 100,
      y: 100
    }]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  return (
    <div className="p-6 flex gap-6">
      {/* Sidebar Menu */}
      <div className="w-72 space-y-4">
        <h2 className="text-xl font-bold">Players</h2>
        <button
          className="!bg-blue-200 hover:!bg-blue-700 text-black px-3 py-1 rounded w-full"
          onClick={addPlayer}
        >
          + Add Player
        </button>
        {players.map((player) => (
          <div key={player.id} className="border p-2 rounded bg-white space-y-1">
            <input
              type="text"
              className="w-full border p-1"
              placeholder="Position"
              value={player.label}
              onChange={(e) => updatePlayer(player.id, 'label', e.target.value)}
            />
            <input
              type="text"
              className="w-full border p-1"
              placeholder="Name"
              value={player.name}
              onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
            />
            <button
              className="text-red-600 text-sm"
              onClick={() => removePlayer(player.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Court */}
      <Court players={players} setPlayers={setPlayers} />
    </div>
  );
}

export default App;
