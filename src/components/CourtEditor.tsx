import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../models/Player';
import Court from './Court';
import type { Stroke } from './CanvasOverlay';
import { useAuth } from '../contexts/AuthContext';
import { getRotationSetById } from '../lib/firestore';
import { db } from '../firebase';
import {
  RECEIVE_VIEW_KEYS,
  ROTATION_VIEW_KEYS,
  SERVE_VIEW_KEYS,
  createRotationViewRecord,
  getPreviousRotationViewKey,
  getRotationNumber,
  type RotationViewKey,
} from '../lib/rotationViews';

const ZONE_LOCATIONS: [number, number][] = [
  [650, 525],
  [625, 100],
  [400, 100],
  [150, 100],
  [150, 525],
  [400, 525],
];

const createSamplePlayer = (): Player => ({
  id: uuid(),
  label: 'S',
  name: 'Alex',
  x: 650,
  y: 525,
  zone: 1,
});

const createInitialRotations = () =>
  createRotationViewRecord<Player[]>((viewKey) => (viewKey === 'R1' ? [createSamplePlayer()] : []));

const createInitialAnnotations = () => createRotationViewRecord<Stroke[]>(() => []);

const normalizeViewData = <T,>(stored?: Partial<Record<RotationViewKey, T[]>>) =>
  createRotationViewRecord<T[]>((viewKey) => stored?.[viewKey] ?? []);

function CourtEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rotationId, setRotationId] = useState<string | null>(null);
  const [rotationTitle, setRotationTitle] = useState('Untitled Rotation');
  const [rotations, setRotations] = useState<Record<RotationViewKey, Player[]>>(createInitialRotations);
  const [annotationStrokes, setAnnotationStrokes] =
    useState<Record<RotationViewKey, Stroke[]>>(createInitialAnnotations);
  const [currentView, setCurrentView] = useState<RotationViewKey>('R1');
  const [rotationCheckEnabled, setRotationCheckEnabled] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [violatingIds, setViolatingIds] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<'none' | 'pen' | 'highlight' | 'eraser'>('none');

  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentViewIndex = ROTATION_VIEW_KEYS.indexOf(currentView);
  const players = rotations[currentView];
  const strokes = annotationStrokes[currentView];

  const setPlayers: React.Dispatch<React.SetStateAction<Player[]>> = (valueOrUpdater) => {
    setRotations((prev) => {
      const currentPlayers = prev[currentView];
      const nextPlayers =
        typeof valueOrUpdater === 'function'
          ? (valueOrUpdater as (currentPlayers: Player[]) => Player[])(currentPlayers)
          : valueOrUpdater;

      return {
        ...prev,
        [currentView]: nextPlayers,
      };
    });
  };

  const setStrokes = (newStrokes: Stroke[]) => {
    setAnnotationStrokes((prev) => ({
      ...prev,
      [currentView]: newStrokes,
    }));
  };

  useEffect(() => {
    const loadFromCloud = async () => {
      const id = localStorage.getItem('rotation-id');

      if (!user) return;

      if (!id) {
        setRotationTitle('Untitled Rotation');
        setRotations(createInitialRotations());
        setAnnotationStrokes(createInitialAnnotations());
        setCurrentView('R1');
        setRotationId(null);
        return;
      }

      try {
        const set = await getRotationSetById(user.uid, id);
        if (!set) {
          alert('Failed to load rotation set.');
          return;
        }

        setRotationTitle(set.title || 'Untitled');
        setRotations(normalizeViewData(set.players));
        setAnnotationStrokes(normalizeViewData(set.annotations));
        setCurrentView('R1');
        setRotationId(id);
        localStorage.removeItem('rotation-id');
      } catch (error) {
        console.error('Failed to load from cloud:', error);
        alert('Error loading rotation set.');
      }
    };

    loadFromCloud();
  }, [user]);

  useEffect(() => {
    setCheckResult(null);
    setViolatingIds([]);
  }, [currentView]);

  const updatePlayer = <K extends keyof Player>(id: string, field: K, value: Player[K]) => {
    setPlayers(players.map((player) => (player.id === id ? { ...player, [field]: value } : player)));
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
    setPlayers(players.filter((player) => player.id !== id));
  };

  const rotateFromPrevious = () => {
    const sourceView = getPreviousRotationViewKey(currentView);
    const previousPlayers = rotations[sourceView];

    const rotatedPlayers = previousPlayers.map((player) => {
      const oldZone = player.zone;
      const newZone = typeof oldZone === 'number' ? ((oldZone + 4) % 6) + 1 : undefined;
      let x = player.x;
      let y = player.y;

      if (typeof newZone === 'number') {
        x = ZONE_LOCATIONS[newZone - 1][0];
        y = ZONE_LOCATIONS[newZone - 1][1];
      }

      return {
        ...player,
        id: uuid(),
        zone: newZone,
        x,
        y,
      };
    });

    setRotations((prev) => ({
      ...prev,
      [currentView]: rotatedPlayers,
    }));
  };

  const checkLegality = () => {
    if (players.length !== 6) {
      setCheckResult('Must have exactly 6 players assigned to zones 1-6.');
      setViolatingIds([]);
      return;
    }

    const zoneMap = new Map(players.map((player) => [player.zone, player]));
    const requiredZones = [1, 2, 3, 4, 5, 6];
    if (!requiredZones.every((zone) => zoneMap.has(zone))) {
      setCheckResult('All zones 1-6 must be assigned.');
      setViolatingIds([]);
      return;
    }

    const zonePlayer = (zone: number) => zoneMap.get(zone)!;
    const name = (zone: number) => zonePlayer(zone).name || 'Unnamed';

    const violations: string[] = [];
    const violators = new Set<string>();

    if (zonePlayer(1).y < zonePlayer(2).y) {
      violations.push(`${name(1)} must be behind ${name(2)}`);
      violators.add(zonePlayer(1).id);
      violators.add(zonePlayer(2).id);
    }
    if (zonePlayer(6).y < zonePlayer(3).y) {
      violations.push(`${name(6)} must be behind ${name(3)}`);
      violators.add(zonePlayer(6).id);
      violators.add(zonePlayer(3).id);
    }
    if (zonePlayer(5).y < zonePlayer(4).y) {
      violations.push(`${name(5)} must be behind ${name(4)}`);
      violators.add(zonePlayer(5).id);
      violators.add(zonePlayer(4).id);
    }

    if (zonePlayer(2).x < zonePlayer(3).x) {
      violations.push(`${name(2)} must be to the right of ${name(3)}`);
      violators.add(zonePlayer(2).id);
      violators.add(zonePlayer(3).id);
    }
    if (zonePlayer(3).x < zonePlayer(4).x) {
      violations.push(`${name(3)} must be to the right of ${name(4)}`);
      violators.add(zonePlayer(3).id);
      violators.add(zonePlayer(4).id);
    }
    if (zonePlayer(1).x < zonePlayer(6).x) {
      violations.push(`${name(1)} must be to the right of ${name(6)}`);
      violators.add(zonePlayer(1).id);
      violators.add(zonePlayer(6).id);
    }
    if (zonePlayer(6).x < zonePlayer(5).x) {
      violations.push(`${name(6)} must be to the right of ${name(5)}`);
      violators.add(zonePlayer(6).id);
      violators.add(zonePlayer(5).id);
    }

    setViolatingIds(Array.from(violators));
    setCheckResult(
      violations.length === 0 ? 'Rotation is legal!' : `Illegal rotation:\n${violations.join(';\n')}`
    );
  };

  const exportAllToPdf = async () => {
    const pageWidth = 940;
    const pageHeight = 1920;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pageWidth, pageHeight] });

    for (let i = 0; i < RECEIVE_VIEW_KEYS.length; i += 1) {
      const node = exportRefs.current[i];
      if (!node) continue;

      try {
        const dataUrl = await toPng(node);
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
      } catch (error) {
        console.error(`Failed to export rotation ${i + 1}:`, error);
      }
    }

    pdf.save(`${rotationTitle || 'Untitled Rotation'}(vbrt).pdf`);
  };

  const saveToCloud = async () => {
    if (!user) {
      alert('You must be logged in to save.');
      return;
    }

    const sanitizePlayers = (viewPlayers: Player[]): Player[] =>
      viewPlayers.map((player) => ({
        id: player.id,
        label: player.label ?? '',
        name: player.name ?? '',
        x: player.x,
        y: player.y,
        zone: player.zone ?? null,
      }));

    const sanitizedRotations = createRotationViewRecord<Player[]>((viewKey) =>
      sanitizePlayers(rotations[viewKey])
    );
    const sanitizedAnnotations = createRotationViewRecord<Stroke[]>((viewKey) => annotationStrokes[viewKey]);
    const title = rotationTitle.trim() || 'Untitled';
    const data = {
      title,
      players: sanitizedRotations,
      annotations: sanitizedAnnotations,
      updatedAt: Timestamp.now(),
    };

    try {
      if (rotationId) {
        await setDoc(doc(db, 'users', user.uid, 'rotations', rotationId), data, { merge: true });
        alert(`Updated "${title}"`);
      } else {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'rotations'), {
          ...data,
          createdAt: Timestamp.now(),
        });
        setRotationId(docRef.id);
        alert(`Saved new rotation! ID: ${docRef.id}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save to cloud.');
    }
  };

  const exportNoopSetPlayers: React.Dispatch<React.SetStateAction<Player[]>> = () => {};
  const renderViewButton = (viewKey: RotationViewKey) => (
    <button
      key={viewKey}
      className={`min-w-12 px-3 py-1 rounded font-medium transition ${
        viewKey === currentView ? 'bg-yellow-400 text-black' : 'bg-gray-100 hover:bg-gray-200 text-black'
      }`}
      onClick={() => setCurrentView(viewKey)}
    >
      {viewKey}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-green-700 flex flex-col items-center p-6 overflow-x-auto">
      <div className="w-full max-w-screen-xl mb-4 px-6">
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_220px] xl:items-start">
          <div className="flex justify-start">
            <input
              type="text"
              value={rotationTitle}
              onChange={(event) => setRotationTitle(event.target.value)}
              placeholder="Untitled Rotation"
              className="inline-flex bg-transparent text-white font-semibold text-lg outline-none border-b border-white focus:border-yellow-400 px-1 w-fit max-w-[180px]"
            />
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-3 max-w-full overflow-x-auto py-1">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded shadow disabled:opacity-50 shrink-0"
                onClick={() => setCurrentView(ROTATION_VIEW_KEYS[Math.max(currentViewIndex - 1, 0)])}
                disabled={currentViewIndex === 0}
              >
                ← Prev
              </button>

              <div className="flex flex-col gap-2 min-w-max items-center">
                <div className="flex gap-2">
                  {SERVE_VIEW_KEYS.map(renderViewButton)}
                </div>
                <div className="flex gap-2 pl-6">
                  {RECEIVE_VIEW_KEYS.map(renderViewButton)}
                </div>
              </div>

              <button
                className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded shadow disabled:opacity-50 shrink-0"
                onClick={() =>
                  setCurrentView(ROTATION_VIEW_KEYS[Math.min(currentViewIndex + 1, ROTATION_VIEW_KEYS.length - 1)])
                }
                disabled={currentViewIndex === ROTATION_VIEW_KEYS.length - 1}
              >
                Next →
              </button>
            </div>
          </div>

          <div className="flex justify-start gap-2 xl:justify-end">
            <button
              onClick={saveToCloud}
              className="bg-white hover:bg-gray-100 text-black px-3 py-1 rounded flex items-center gap-1"
            >
              💾 Save
            </button>

            <button
              onClick={() => navigate('/library')}
              className="bg-white hover:bg-gray-100 text-black px-3 py-1 rounded flex items-center gap-1"
            >
              🔙 Exit
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 w-full max-w-screen-xl px-6 items-start">
        <div className="w-72 space-y-4 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold">Players ({currentView})</h2>
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
                onChange={(event) => updatePlayer(player.id, 'label', event.target.value)}
              />
              <input
                type="text"
                className="w-full border p-1"
                placeholder="Name"
                value={player.name}
                onChange={(event) => updatePlayer(player.id, 'name', event.target.value)}
              />
              <select
                className="w-full border p-1"
                value={player.zone ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  updatePlayer(player.id, 'zone', value === '' ? undefined : parseInt(value, 10));
                }}
              >
                <option value="">Zone (1-6)</option>
                {[1, 2, 3, 4, 5, 6].map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <button
                className="text-red-600 text-sm hover:underline"
                onClick={() => removePlayer(player.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

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

        <div className="w-64 space-y-4">
          <div className="bg-white p-4 rounded shadow space-y-4 h-fit">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rotationCheckEnabled}
                onChange={(event) => setRotationCheckEnabled(event.target.checked)}
              />
              <span className="text-sm">6-player rotation rules</span>
            </label>
            <button
              className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded w-full font-semibold"
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
              className="bg-gray-100 hover:bg-gray-200 text-black font-semibold px-3 py-2 rounded w-full transition-colors duration-200"
              onClick={rotateFromPrevious}
            >
              🔁 Rotate From Previous Row
            </button>
          </div>

          <div className="bg-white p-4 rounded shadow space-y-2">
            <p className="font-semibold text-sm">Annotation Tool</p>
            <div className="flex gap-2 flex-wrap">
              {(['none', 'pen', 'highlight', 'eraser'] as const).map((tool) => {
                const label =
                  tool === 'none'
                    ? '🚫 None'
                    : tool === 'pen'
                      ? '✏️ Pen'
                      : tool === 'highlight'
                        ? '🖍️ Highlight'
                        : '🧽 Erase';

                return (
                  <button
                    key={tool}
                    onClick={() => setCurrentTool(tool)}
                    className={`px-2 py-1 rounded text-sm border ${
                      currentTool === tool ? 'bg-blue-200 text-black' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStrokes([])} className="mt-2 text-sm text-red-600 hover:underline">
              🗑️ Clear
            </button>
          </div>

          <div className="bg-white p-4 rounded shadow space-y-2">
            <button
              onClick={exportAllToPdf}
              className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-2 rounded w-full"
            >
              📄 Export All Rotations as PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {RECEIVE_VIEW_KEYS.map((receiveView, index) => {
          const serveView = `S${getRotationNumber(receiveView)}` as RotationViewKey;

          return (
            <div
              key={receiveView}
              ref={(element) => {
                exportRefs.current[index] = element;
              }}
              style={{
                width: 940,
                height: 1920,
                backgroundColor: '#15803d',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>
                {rotationTitle || 'Untitled Rotation'} - {receiveView} / {serveView}
              </div>

              {[receiveView, serveView].map((viewKey) => (
                <div key={viewKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 600 }}>{viewKey}</div>
                  <div style={{ width: '900px', height: '900px' }} className="shrink-0">
                    <Court
                      players={rotations[viewKey]}
                      setPlayers={exportNoopSetPlayers}
                      violatingIds={[]}
                      strokes={annotationStrokes[viewKey]}
                      setStrokes={() => {}}
                      currentTool="none"
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourtEditor;
