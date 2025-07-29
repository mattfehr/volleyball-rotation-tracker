import { useState, useRef, useEffect } from 'react';
import type { Player } from '../models/Player';
import Court from './Court';
import { v4 as uuid } from 'uuid';
import type { Stroke } from './CanvasOverlay';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { getRotationSetById } from '../lib/firestore';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

//component for the court editor page
function CourtEditor() {

  //track current user and rotation id being edited
	const { user } = useAuth();
  const [rotationId, setRotationId] = useState<string | null>(null);

  //on load check if rotation was selected from library, yes -> firestore, no -> fresh start
  useEffect(() => {
    const loadFromCloud = async () => {
      const id = localStorage.getItem('rotation-id'); //check if rotation-id was saved in library in local storage

      if (!user) return;
      
      //if no saved id, set up fresh
      if (!id) {
        setRotationTitle("Untitled Rotation");
        setRotations([
          [
            { id: uuid(), label: 'S', name: 'Alex', x: 650, y: 525, zone: 1 }
          ],
          [], [], [], [], []
        ]);
        setAnnotationStrokes(Array.from({ length: 6 }, () => []));
        setCurrentRotation(0);
        setRotationId(null); // ✅ explicitly clear
        return;
      }

      //if there is a saved id, load it from firestore
      try {
        const set = await getRotationSetById(user.uid, id);
        if (!set) {
          alert('❌ Failed to load rotation set.');
          return;
        }
        
        //update states with retrieved data
        setRotationTitle(set.title || 'Untitled');
        setRotations(['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].map(key => set.players[key] || []));
        setAnnotationStrokes(['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].map(key => set.annotations[key] || []));
        setCurrentRotation(0);
        setRotationId(id); 
        localStorage.removeItem('rotation-id');
      } catch (err) {
        console.error('Failed to load from cloud:', err);
        alert('❌ Error loading rotation set.');
      }
    };

    loadFromCloud();
  }, [user]); //run when user changes

  const navigate = useNavigate();

  //use effect initial value fall backs
  const [rotationTitle, setRotationTitle] = useState("Untitled Rotation");

  const initialPlayers: Player[] = [
    { id: uuid(), label: 'S', name: 'Alex', x: 650, y: 525, zone: 1 },
  ];

  const [rotations, setRotations] = useState<Player[][]>(
    Array.from({ length: 6 }, (_, i) => (i === 0 ? initialPlayers : []))
  );

  const [currentRotation, setCurrentRotation] = useState(0);
  const players = rotations[currentRotation];

  //custom set players hook to target only current rotation instead of full 2D player array
  const setPlayers: React.Dispatch<React.SetStateAction<Player[]>> = (valueOrUpdater) => {
    setRotations(prev => {                        //takes a function that recieves previous state
      const updated = [...prev];                  //copy
      const current = prev[currentRotation];      //takes current rotation array
      const next =                                //transforms array or replaces it
        typeof valueOrUpdater === 'function'
          ? (valueOrUpdater as (prev: Player[]) => Player[])(current)     
          : valueOrUpdater;
      updated[currentRotation] = next;            //updates the 2d array with the new array
      return updated;
    });
  };

  //states for rotation legality checker
  const [rotationCheckEnabled, setRotationCheckEnabled] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [violatingIds, setViolatingIds] = useState<string[]>([]);

  //states for annotations
  const [annotationStrokes, setAnnotationStrokes] = useState<Stroke[][]>(
    Array.from({ length: 6 }, () => [])
  );
  const strokes = annotationStrokes[currentRotation];
  const setStrokes = (newStrokes: Stroke[]) => {  //custom setStrokes for targeting specific rotations like with players
    setAnnotationStrokes(prev => {
      const updated = [...prev];
      updated[currentRotation] = newStrokes;
      return updated;
    });
  };

  const [currentTool, setCurrentTool] = useState<'none' | 'pen' | 'highlight' | 'eraser'>('none');

  //managing players in rotation
  const updatePlayer = <K extends keyof Player>(id: string, field: K, value: Player[K]) => {  //targetted field must be a valid property
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));   //map to create new player array only updating targetted field
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
    setPlayers(players.filter(p => p.id !== id)); //filter to keep players whose idea does not match
  };

  //function to copy and rotate players based on their previous zone
  const rotateFromPrevious = () => {
    const locations = [[650, 525], [625, 100], [400, 100], [150, 100], [150, 525], [400, 525]]; //hard coded zone locations
    const sourceIndex = (currentRotation + 5) % 6;    //get previous row number and players info
    const prevPlayers = rotations[sourceIndex];

    //get the old zones and update them to their new ones
    const rotated = prevPlayers.map(p => {
      const oldZone = p.zone;
      const newZone = typeof oldZone === 'number' ? ((oldZone + 4) % 6) + 1 : undefined;
      let x = p.x;
      let y = p.y;

      //if a zone was assigned go to the location, else stay
      if (typeof newZone === 'number') {
        x = locations[newZone - 1][0];
        y = locations[newZone - 1][1];
      }

      return {  //return the player object to the map list
        ...p,
        id: uuid(),
        zone: newZone,
        x,
        y,
      };
    });

    setRotations(prev => {          //update the state
      const updated = [...prev];
      updated[currentRotation] = rotated;
      return updated;
    });
  };

  //function to check for illegal overlapping
  const checkLegality = () => {
    if (players.length !== 6) {
      setCheckResult("❌ Must have exactly 6 players assigned to zones 1–6.");
      setViolatingIds([]);
      return;
    }

    //check if every zone has a player with {zone : player}
    const zoneMap = new Map(players.map(p => [p.zone, p]));
    const requiredZones = [1, 2, 3, 4, 5, 6];
    if (!requiredZones.every(z => zoneMap.has(z))) {
      setCheckResult("❌ All zones 1–6 must be assigned.");
      setViolatingIds([]);
      return;
    }

    const z = (n: number) => zoneMap.get(n)!;     //! to show the get wont return undefined
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
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);   //store a reference to each rotation container DOM

  const exportAllToPdf = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [900, 900] }); //match court sizw

    for (let i = 0; i < 6; i++) {
      const node = exportRefs.current[i]; //get the DOM from each ref
      if (!node) continue;

      try {
        const dataUrl = await toPng(node);            //convert DOM to PNG
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, 900, 900);
      } catch (err) {
        console.error(`Failed to export rotation ${i + 1}:`, err);
      }
    }

    pdf.save(`${rotationTitle || 'Untitled Rotation'}(vbrt).pdf`);
  };

  //save to firestore
  const convertRotationArrayToObject = <T,>(arr: T[][]): Record<string, T[]> =>	//helper for array -> object for firestore
    Object.fromEntries(arr.map((item, i) => [`R${i + 1}`, item]));

  const saveToCloud = async () => {
    if (!user) {
      alert("❌ You must be logged in to save.");
      return;
    }

    //sanitize individual player fields
    const sanitizePlayers = (players: Player[]): Player[] =>
      players.map(p => ({
        id: p.id,
        label: p.label ?? '',
        name: p.name ?? '',
        x: p.x,
        y: p.y,
        zone: p.zone ?? null, //firestore allows null, not undefined
      }));

    const sanitizedRotations = convertRotationArrayToObject(
      rotations.map(sanitizePlayers)
    );

    const sanitizedAnnotations = convertRotationArrayToObject(annotationStrokes);

    const title = rotationTitle?.trim() || "Untitled";

    const data = {
      title,
      players: sanitizedRotations,
      annotations: sanitizedAnnotations,
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    try {
			//if rotation id exists, then update the existing document
      if (rotationId) {
        await setDoc(doc(db, 'users', user.uid, 'rotations', rotationId), data, { merge: true });
        alert(`✅ Updated "${title}"`);
      } else { //if not, then create and add the document
        const docRef = await addDoc(collection(db, 'users', user.uid, 'rotations'), data);
        setRotationId(docRef.id);
        alert(`✅ Saved new rotation! ID: ${docRef.id}`);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Failed to save to cloud.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-green-700 flex flex-col items-center p-6 overflow-x-auto">
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
            className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded shadow disabled:opacity-50 mr-16"
            onClick={() => setCurrentRotation(Math.max(currentRotation - 1, 0))}
            disabled={currentRotation === 0}
          >
            ← Prev
          </button>

          {[...Array(6)].map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded font-medium transition ${
                i === currentRotation ? 'bg-yellow-400 text-black' : 'bg-gray-100 hover:bg-gray-200 text-black'
              }`}
              onClick={() => setCurrentRotation(i)}
            >
              R{i + 1}
            </button>
          ))}

          <button
            className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1 rounded shadow disabled:opacity-50 ml-16"
            onClick={() => setCurrentRotation(Math.min(currentRotation + 1, 5))}
            disabled={currentRotation === 5}
          >
            Next →
          </button>
        </div>

        {/* Right: reserved for future actions */}
        <div className="flex gap-2">
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
                className="text-red-600 text-sm hover:underline"
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
              {(['none', 'pen', 'highlight', 'eraser'] as const).map(tool => {
                const label =
                  tool === 'none' ? '🚫 None' :
                  tool === 'pen' ? '✏️ Pen' :
                  tool === 'highlight' ? '🖌️ Highlight' :
                  tool === 'eraser' ? '🧽 Erase' : tool;
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
            <button
              onClick={() => setStrokes([])}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
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
