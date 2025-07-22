import { useState, useRef } from 'react';
import type { Player } from '../models/Player';
import Court from './Court';
import { v4 as uuid } from 'uuid';
import type { Stroke } from './CanvasOverlay';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

function CourtEditor() {
  const [rotationTitle, setRotationTitle] = useState("Untitled Rotation");

  const initialPlayers: Player[] = [
    { id: uuid(), label: 'S', name: 'Alex', x: 650, y: 525, zone: 1 },
  ];

  const [rotations, setRotations] = useState<Player[][]>(
    Array.from({ length: 6 }, (_, i) => (i === 0 ? initialPlayers : []))
  );

  const [currentRotation, setCurrentRotation] = useState(0);
  const players = rotations[currentRotation];

  const setPlayers: React.Dispatch<React.SetStateAction<Player[]>> = (valueOrUpdater) => {
    setRotations(prev => {
      const updated = [...prev];
      const current = prev[currentRotation];
      const next =
        typeof valueOrUpdater === 'function'
          ? (valueOrUpdater as (prev: Player[]) => Player[])(current)
          : valueOrUpdater;
      updated[currentRotation] = next;
      return updated;
    });
  };

  const [rotationCheckEnabled, setRotationCheckEnabled] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [violatingIds, setViolatingIds] = useState<string[]>([]);

  const [annotationStrokes, setAnnotationStrokes] = useState<Stroke[][]>(
    Array.from({ length: 6 }, () => [])
  );
  const strokes = annotationStrokes[currentRotation];
  const setStrokes = (newStrokes: Stroke[]) => {
    setAnnotationStrokes(prev => {
      const updated = [...prev];
      updated[currentRotation] = newStrokes;
      return updated;
    });
  };

  const [currentTool, setCurrentTool] = useState<'pen' | 'highlight' | 'eraser'>('pen');

  const updatePlayer = <K extends keyof Player>(id: string, field: K, value: Player[K]) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addPlayer = () => {
    setPlayers([
      ...players,
      {
        id: uuid(),
        label: 'New',
        name: '',
        x: 100,
        y: 100,
        zone: undefined,
      },
    ]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const rotateFromPrevious = () => {
    const locations = [[650, 525], [625, 100], [400, 100], [150, 100], [150, 525], [400, 525]];
    const sourceIndex = (currentRotation + 5) % 6;
    const prevPlayers = rotations[sourceIndex];

    const rotated = prevPlayers.map(p => {
      const oldZone = p.zone;
      const newZone = typeof oldZone === 'number' ? ((oldZone + 4) % 6) + 1 : undefined;
      let x = p.x;
      let y = p.y;

      if (typeof newZone === 'number') {
        x = locations[newZone - 1][0];
        y = locations[newZone - 1][1];
      }

      return {
        ...p,
        id: uuid(),
        zone: newZone,
        x,
        y,
      };
    });

    setRotations(prev => {
      const updated = [...prev];
      updated[currentRotation] = rotated;
      return updated;
    });
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

    if (z(1).y < z(2).y) violations.push(`${name(1)} must be behind ${name(2)}`), violators.add(z(1).id).add(z(2).id);
    if (z(6).y < z(3).y) violations.push(`${name(6)} must be behind ${name(3)}`), violators.add(z(6).id).add(z(3).id);
    if (z(5).y < z(4).y) violations.push(`${name(5)} must be behind ${name(4)}`), violators.add(z(5).id).add(z(4).id);

    if (z(2).x < z(3).x) violations.push(`${name(2)} must be to the right of ${name(3)}`), violators.add(z(2).id).add(z(3).id);
    if (z(3).x < z(4).x) violations.push(`${name(3)} must be to the right of ${name(4)}`), violators.add(z(3).id).add(z(4).id);
    if (z(1).x < z(6).x) violations.push(`${name(1)} must be to the right of ${name(6)}`), violators.add(z(1).id).add(z(6).id);
    if (z(6).x < z(5).x) violations.push(`${name(6)} must be to the right of ${name(5)}`), violators.add(z(6).id).add(z(5).id);

    setViolatingIds(Array.from(violators));
    setCheckResult(
      violations.length === 0
        ? "✅ Rotation is legal!"
        : "❌ Illegal rotation:\n" + violations.join(";\n")
    );
  };

  //PDF download
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  const exportAllToPdf = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [900, 900] });

    for (let i = 0; i < 6; i++) {
      const node = exportRefs.current[i];
      if (!node) continue;

      try {
        const dataUrl = await toPng(node);
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, 900, 900);
      } catch (err) {
        console.error(`Failed to export rotation ${i + 1}:`, err);
      }
    }

    pdf.save('volleyball-rotations.pdf');
  };

  //export to JSON
  const exportToJson = () => {
    const data = {
      title: rotationTitle,
      rotations,
      annotations: annotationStrokes,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rotation-set.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const parsed = JSON.parse(result);

          if (!Array.isArray(parsed.rotations) || !Array.isArray(parsed.annotations)) {
            alert("Invalid file format.");
            return;
          }

          setRotations(parsed.rotations);
          setAnnotationStrokes(parsed.annotations);
          setCurrentRotation(0); // reset to R1

          alert("✅ Rotation set loaded!");
        }
      } catch (err) {
        alert("❌ Failed to load rotation set.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-green-700 flex justify-center items-start p-6 flex-col">
      {/* Rotation Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center w-full max-w-screen-xl mb-4 px-6">
        {/* Left: Title or future controls */}
        <input
          type="text"
          value={rotationTitle}
          onChange={(e) => setRotationTitle(e.target.value)}
          placeholder="Untitled Rotation"
          className="inline-flex bg-transparent text-white font-semibold text-lg outline-none border-b border-white focus:border-yellow-400 px-1 w-fit max-w-[180px]"
        />

        {/* Center: Arrows + Tabs */}
        <div className="flex gap-2 items-center">
          <button
            className="bg-white text-black px-3 py-1 rounded shadow disabled:opacity-50 mr-16"
            onClick={() => setCurrentRotation(Math.max(currentRotation - 1, 0))}
            disabled={currentRotation === 0}
          >
            ← Prev
          </button>

          {[...Array(6)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded font-medium transition ${
                i === currentRotation ? 'bg-yellow-400 text-black' : 'bg-white text-black hover:bg-gray-100'
              }`}
              onClick={() => setCurrentRotation(i)}
            >
              R{i + 1}
            </button>
          ))}

          <button
            className="bg-white text-black px-3 py-1 rounded shadow disabled:opacity-50 ml-16"
            onClick={() => setCurrentRotation(Math.min(currentRotation + 1, 5))}
            disabled={currentRotation === 5}
          >
            Next →
          </button>
        </div>

        {/* Right: reserved for future actions */}
        <div className="flex gap-2">
          <input
            id="import-json"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importFromJson}
          />
          <label htmlFor="import-json">
            <span className="bg-green-600 hover:bg-green-700 text-black px-3 py-1 rounded cursor-pointer">
              📥 Import JSON
            </span>
          </label>

          <button
            onClick={exportToJson}
            className="bg-blue-600 hover:bg-blue-700 text-black px-3 py-1 rounded"
          >
            💾 Export JSON
          </button>
        </div>
      </div>

      {/* Player Section */}
      <div className="flex gap-6 w-full max-w-screen-xl px-6 items-start">
        <div className="w-72 space-y-4 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold">Players (R{currentRotation + 1})</h2>
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
        
        {/* Court */}
        <div style={{ width: '900px', height: '900px' }} className="shrink-0">
          <Court
            players={players}
            setPlayers={setPlayers}
            violatingIds={violatingIds}
            strokes={strokes}
            setStrokes={setStrokes}
            currentTool={currentTool}
          />
        </div>
        
        {/* Right Panel */}
        <div className="w-64 space-y-4">
          <div className="bg-white p-4 rounded shadow space-y-4 h-fit">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rotationCheckEnabled}
                onChange={(e) => setRotationCheckEnabled(e.target.checked)}
              />
              <span className="text-sm">6-player rotation rules</span>
            </label>
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded w-full font-semibold"
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

          <div className="bg-white p-4 rounded shadow">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-black font-semibold px-3 py-2 rounded w-full transition-colors duration-200"
              onClick={rotateFromPrevious}
            >
              🔁 Rotate From Previous Row
            </button>
          </div>

          <div className="bg-white p-4 rounded shadow space-y-2">
            <p className="font-semibold text-sm">Annotation Tool</p>
            <div className="flex gap-2 flex-wrap">
              {(['pen', 'highlight', 'eraser'] as const).map(tool => {
                const label =
                  tool === 'pen' ? '✏️ Pen' :
                  tool === 'highlight' ? '🖌️ Highlight' :
                  tool === 'eraser' ? '🧽 Erase' : tool;
                return (
                  <button
                    key={tool}
                    onClick={() => setCurrentTool(tool)}
                    className={`px-2 py-1 rounded text-sm border ${
                      currentTool === tool ? 'bg-blue-500 text-black' : 'bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStrokes([])}
              className="mt-2 text-sm text-red-600"
            >
              🗑️ Clear
            </button>
          </div>

          <div className="bg-white p-4 rounded shadow space-y-2">
            <button
              onClick={exportAllToPdf}
              className="bg-purple-600 hover:bg-purple-700 text-black px-3 py-2 rounded w-full"
            >
              📄 Export All Rotations as PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {rotations.map((players, i) => (
          <div
            key={i}
            ref={(el) => { exportRefs.current[i] = el; }}
            style={{ width: 900, height: 900 }}
          >
            <div style={{ width: '900px', height: '900px' }} className="shrink-0">
              <Court
                players={players}
                setPlayers={setPlayers}
                violatingIds={[]}
                strokes={annotationStrokes[i]}
                setStrokes={() => {}}
                currentTool="pen"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourtEditor;
