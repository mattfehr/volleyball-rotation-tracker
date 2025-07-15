import { useState } from 'react';
import type { Player } from './models/Player';
import Court from './components/Court';
import { v4 as uuid } from 'uuid';

function App() {
  const [players, setPlayers] = useState<Player[]>([
    { id: uuid(), label: 'S', name: 'Alex', x: 200, y: 200 },
  ]);

  const [rotationCheckEnabled, setRotationCheckEnabled] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [violatingIds, setViolatingIds] = useState<string[]>([]);

  const updatePlayer = <K extends keyof Player>(id: string, field: K, value: Player[K]) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayer = () => {
    setPlayers([...players, {
      id: uuid(),
      label: 'New',
      name: '',
      x: 100,
      y: 100,
      zone: undefined,
    }]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const checkLegality = () => {
    if (players.length !== 6) {
      setCheckResult("❌ Must have exactly 6 players assigned to zones 1–6.");
      setViolatingIds([]);
      return;
    }

    const zoneMap = new Map(players.map(p => [p.zone, p]));
    const requiredZones = [1, 2, 3, 4, 5, 6];
    if (!requiredZones.every(z => zoneMap.has(z))) {
      setCheckResult("❌ All zones 1–6 must be assigned.");
      setViolatingIds([]);
      return;
    }

    const z = (n: number) => zoneMap.get(n)!;
    const name = (n: number) => `${z(n).name || "Unnamed"}`;

    const violations: string[] = [];
    const violators = new Set<string>();

    // Vertical legality
    if (z(1).y < z(2).y) {
      violations.push(`${name(1)} must be behind ${name(2)}`);
      violators.add(z(1).id).add(z(2).id);
    }
    if (z(6).y < z(3).y) {
      violations.push(`${name(6)} must be behind ${name(3)}`);
      violators.add(z(6).id).add(z(3).id);
    }
    if (z(5).y < z(4).y) {
      violations.push(`${name(5)} must be behind ${name(4)}`);
      violators.add(z(5).id).add(z(4).id);
    }

    // Horizontal legality
    if (z(2).x < z(3).x) {
      violations.push(`${name(2)} must be to the right of ${name(3)}`);
      violators.add(z(2).id).add(z(3).id);
    }
    if (z(3).x < z(4).x) {
      violations.push(`${name(3)} must be to the right of ${name(4)}`);
      violators.add(z(3).id).add(z(4).id);
    }
    if (z(1).x < z(6).x) {
      violations.push(`${name(1)} must be to the right of ${name(6)}`);
      violators.add(z(1).id).add(z(6).id);
    }
    if (z(6).x < z(5).x) {
      violations.push(`${name(6)} must be to the right of ${name(5)}`);
      violators.add(z(6).id).add(z(5).id);
    }

    setViolatingIds(Array.from(violators));
    setCheckResult(
      violations.length === 0
        ? "✅ Rotation is legal!"
        : "❌ Illegal rotation:\n" + violations.join("; ")
    );
  };

  return (
    <div className="min-h-screen bg-green-700 flex p-6 gap-6">
      {/* Sidebar */}
      <div className="w-72 space-y-4 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold">Players</h2>
        <button
          className="bg-blue-200 hover:bg-blue-300 text-black px-3 py-1 rounded w-full"
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
            <select
              className="w-full border p-1"
              value={player.zone ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                updatePlayer(player.id, 'zone', value === '' ? undefined : parseInt(value));
              }}
            >
              <option value="">Zone (1–6)</option>
              {[1, 2, 3, 4, 5, 6].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <button
              className="text-red-600 text-sm"
              onClick={() => removePlayer(player.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Court and Rule Panel */}
      <div className="flex gap-6 justify-center w-full pr-6">
        <Court players={players} setPlayers={setPlayers} violatingIds={violatingIds} />

        <div className="w-64 bg-white p-4 rounded shadow space-y-4 h-fit mr-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rotationCheckEnabled}
              onChange={() => setRotationCheckEnabled(!rotationCheckEnabled)}
            />
            <span className="text-sm">6-player rotation rules</span>
          </label>

          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded w-full"
            onClick={checkLegality}
            disabled={!rotationCheckEnabled}
          >
            Check Rotation Legality
          </button>

          {checkResult && (
            <p
              className={`text-sm whitespace-pre-wrap ${
                checkResult.includes('Illegal') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {checkResult}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
