import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../models/Player';
import type { Team } from '../models/Team';
import Court from './Court';
import type { Stroke } from './CanvasOverlay';
import { useAuth } from '../contexts/AuthContext';
import { getRotationSetById } from '../lib/firestore';
import { makeComboKey, type ComboAnnotationKey } from '../lib/firestore';
import { db } from '../firebase';
import {
  RECEIVE_VIEW_KEYS,
  createRotationViewRecord,
  getPreviousRotationViewKey,
  getRotationNumber,
  type RotationViewKey,
} from '../lib/rotationViews';
import TopNavBar from './editor/TopNavBar';
import TeamSidebar from './editor/TeamSidebar';
import ToolPalette from './editor/ToolPalette';
import PlayerEditModal from './editor/PlayerEditModal';

// ─── Zone locations (unchanged from original) ─────────────────────────────────
const ZONE_LOCATIONS: [number, number][] = [
  [650, 525],
  [650, 100],
  [400, 100],
  [150, 100],
  [150, 525],
  [400, 525],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEmptyRotations() {
  return createRotationViewRecord<Player[]>(() => []);
}

function makeDefaultTeam(
  name: string,
  abbreviation: string,
  color: string
): Team {
  return {
    name,
    abbreviation,
    color,
    roster: [],
    rotations: makeEmptyRotations(),
  };
}

const DEFAULT_HOME_COLOR = '#2563eb';
const DEFAULT_AWAY_COLOR = '#64748b';

// ─── Per-team business logic ──────────────────────────────────────────────────

function checkLegalityForPlayers(players: Player[]): {
  result: string;
  violatingIds: string[];
} {
  if (players.length !== 6) {
    return {
      result: 'Must have exactly 6 players assigned to zones 1–6.',
      violatingIds: [],
    };
  }

  const zoneMap = new Map(players.map((p) => [p.zone, p]));
  if (![1, 2, 3, 4, 5, 6].every((z) => zoneMap.has(z))) {
    return { result: 'All zones 1–6 must be assigned.', violatingIds: [] };
  }

  const zp = (z: number) => zoneMap.get(z)!;
  const nm = (z: number) => zp(z).name || 'Unnamed';

  const violations: string[] = [];
  const violators = new Set<string>();

  const flag = (a: number, b: number, msg: string) => {
    violations.push(msg);
    violators.add(zp(a).id);
    violators.add(zp(b).id);
  };

  if (zp(1).y < zp(2).y) flag(1, 2, `${nm(1)} must be behind ${nm(2)}`);
  if (zp(6).y < zp(3).y) flag(6, 3, `${nm(6)} must be behind ${nm(3)}`);
  if (zp(5).y < zp(4).y) flag(5, 4, `${nm(5)} must be behind ${nm(4)}`);
  if (zp(2).x < zp(3).x) flag(2, 3, `${nm(2)} must be right of ${nm(3)}`);
  if (zp(3).x < zp(4).x) flag(3, 4, `${nm(3)} must be right of ${nm(4)}`);
  if (zp(1).x < zp(6).x) flag(1, 6, `${nm(1)} must be right of ${nm(6)}`);
  if (zp(6).x < zp(5).x) flag(6, 5, `${nm(6)} must be right of ${nm(5)}`);

  return {
    result:
      violations.length === 0
        ? 'Rotation is legal!'
        : `Illegal rotation:\n${violations.join(';\n')}`,
    violatingIds: Array.from(violators),
  };
}

function rotateFromPrevious(
  currentView: RotationViewKey,
  rotations: Record<RotationViewKey, Player[]>
): Player[] {
  const sourceView = getPreviousRotationViewKey(currentView);
  return rotations[sourceView].map((player) => {
    const oldZone = player.zone;
    const newZone =
      typeof oldZone === 'number' ? ((oldZone + 4) % 6) + 1 : undefined;
    const [x, y] =
      typeof newZone === 'number'
        ? ZONE_LOCATIONS[newZone - 1]
        : [player.x, player.y];
    return { ...player, zone: newZone, x, y };
  });
}

function copyFromOpposite(
  currentView: RotationViewKey,
  rotations: Record<RotationViewKey, Player[]>
): Player[] | null {
  const isReceive = currentView.startsWith('R');
  const oppositeView = `${isReceive ? 'S' : 'R'}${getRotationNumber(currentView)}` as RotationViewKey;
  const oppPlayers = rotations[oppositeView];
  if (!oppPlayers.length) return null;

  return oppPlayers.map((player) => {
    const zone = typeof player.zone === 'number' ? player.zone : undefined;
    const [x, y] = zone ? ZONE_LOCATIONS[zone - 1] : [player.x, player.y];
    return { ...player, x, y };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

type Phase = 'serve' | 'receive';

function CourtEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Metadata
  const [rotationId, setRotationId] = useState<string | null>(null);
  const [rotationTitle, setRotationTitle] = useState('Untitled Rotation');

  // ── Team state
  const [home, setHome] = useState<Team>(() =>
    makeDefaultTeam('Home Team', 'HT', DEFAULT_HOME_COLOR)
  );
  const [away, setAway] = useState<Team>(() =>
    makeDefaultTeam('Away Team', 'AT', DEFAULT_AWAY_COLOR)
  );

  // ── Per-team active view + phase
  const [homeView, setHomeView] = useState<RotationViewKey>('R1');
  const [awayView, setAwayView] = useState<RotationViewKey>('R1');
  const [homePhase, setHomePhase] = useState<Phase>('receive');
  const [awayPhase, setAwayPhase] = useState<Phase>('receive');

  // ── Visibility
  const [homeVisible, setHomeVisible] = useState(true);
  const [awayVisible, setAwayVisible] = useState(true);

  // ── Annotation strokes keyed by combo
  const [annotationStrokes, setAnnotationStrokes] = useState<
    Partial<Record<ComboAnnotationKey, Stroke[]>>
  >({});

  // ── Legality
  const [homeCheckResult, setHomeCheckResult] = useState<string | null>(null);
  const [homeViolatingIds, setHomeViolatingIds] = useState<string[]>([]);
  const [awayCheckResult, setAwayCheckResult] = useState<string | null>(null);
  const [awayViolatingIds, setAwayViolatingIds] = useState<string[]>([]);

  // ── Drawing tool
  const [currentTool, setCurrentTool] = useState<
    'none' | 'pen' | 'highlight' | 'eraser'
  >('none');

  // ── Player edit modal
  const [editTarget, setEditTarget] = useState<{
    player: Player;
    team: 'home' | 'away';
  } | null>(null);

  // ── Export refs
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const comboKey = makeComboKey(homeView, awayView);
  const strokes = annotationStrokes[comboKey] ?? [];
  const setStrokes = (newStrokes: Stroke[]) => {
    setAnnotationStrokes((prev) => ({ ...prev, [comboKey]: newStrokes }));
  };

  const homePlayers = home.rotations[homeView];
  const awayPlayers = away.rotations[awayView];

  const homeIsReceive = homeView.startsWith('R');
  const homeOppositeView = `${homeIsReceive ? 'S' : 'R'}${getRotationNumber(homeView)}` as RotationViewKey;
  const homeHasOpposite = home.rotations[homeOppositeView].length > 0;
  const homeCopyLabel = homeIsReceive ? 'Copy From Serve' : 'Copy From Receive';
  const homeHasPrevious = home.rotations[getPreviousRotationViewKey(homeView)].length > 0;

  const awayIsReceive = awayView.startsWith('R');
  const awayOppositeView = `${awayIsReceive ? 'S' : 'R'}${getRotationNumber(awayView)}` as RotationViewKey;
  const awayHasOpposite = away.rotations[awayOppositeView].length > 0;
  const awayCopyLabel = awayIsReceive ? 'Copy From Serve' : 'Copy From Receive';
  const awayHasPrevious = away.rotations[getPreviousRotationViewKey(awayView)].length > 0;

  // ─── Team mutators ─────────────────────────────────────────────────────────

  const updateTeam = (
    which: 'home' | 'away',
    updater: (prev: Team) => Team
  ) => {
    if (which === 'home') setHome(updater);
    else setAway(updater);
  };

  /** Update on-court players for the team's current view */
  const setTeamPlayers = (
    which: 'home' | 'away',
    valueOrUpdater:
      | Player[]
      | ((prev: Player[]) => Player[])
  ) => {
    const view = which === 'home' ? homeView : awayView;
    updateTeam(which, (prev) => {
      const current = prev.rotations[view];
      const next =
        typeof valueOrUpdater === 'function' ? valueOrUpdater(current) : valueOrUpdater;
      return { ...prev, rotations: { ...prev.rotations, [view]: next } };
    });
  };

  // React dispatch-compatible wrappers for Court component
  const setHomePlayers: React.Dispatch<React.SetStateAction<Player[]>> = (v) =>
    setTeamPlayers('home', v as Player[] | ((p: Player[]) => Player[]));
  const setAwayPlayers: React.Dispatch<React.SetStateAction<Player[]>> = (v) =>
    setTeamPlayers('away', v as Player[] | ((p: Player[]) => Player[]));

  // ─── Player CRUD ───────────────────────────────────────────────────────────

  const addNewPlayer = (which: 'home' | 'away') => {
    const newPlayer: Player = {
      id: uuid(),
      label: 'OH',
      name: '',
      number: null,
      x: 400,
      y: 300,
      zone: undefined,
    };
    updateTeam(which, (prev) => {
      const view = which === 'home' ? homeView : awayView;
      return {
        ...prev,
        roster: [...prev.roster, newPlayer],
        rotations: {
          ...prev.rotations,
          [view]: [...prev.rotations[view], newPlayer],
        },
      };
    });
  };

  const updatePlayer = (which: 'home' | 'away', updated: Player) => {
    updateTeam(which, (prev) => ({
      ...prev,
      roster: prev.roster.map((p) => (p.id === updated.id ? updated : p)),
      rotations: createRotationViewRecord<Player[]>((vk) =>
        prev.rotations[vk].map((p) => (p.id === updated.id ? updated : p))
      ),
    }));
  };

  const deletePlayer = (which: 'home' | 'away', playerId: string) => {
    updateTeam(which, (prev) => ({
      ...prev,
      roster: prev.roster.filter((p) => p.id !== playerId),
      rotations: createRotationViewRecord<Player[]>((vk) =>
        prev.rotations[vk].filter((p) => p.id !== playerId)
      ),
    }));
  };

  /** Move a bench player onto court for the current view */
  const addToCourt = (which: 'home' | 'away', player: Player) => {
    const view = which === 'home' ? homeView : awayView;
    const spawnX = 400 + Math.random() * 100 - 50;
    const spawnY = 300 + Math.random() * 100 - 50;
    const courtPlayer = { ...player, x: spawnX, y: spawnY };
    updateTeam(which, (prev) => ({
      ...prev,
      rotations: {
        ...prev.rotations,
        [view]: [...prev.rotations[view], courtPlayer],
      },
    }));
  };

  /** Remove a player from the court for the current view (returns to bench) */
  const removeFromCourt = (which: 'home' | 'away', playerId: string) => {
    const view = which === 'home' ? homeView : awayView;
    updateTeam(which, (prev) => ({
      ...prev,
      rotations: {
        ...prev.rotations,
        [view]: prev.rotations[view].filter((p) => p.id !== playerId),
      },
    }));
  };

  // ─── Legality ──────────────────────────────────────────────────────────────

  const checkHomeLegality = () => {
    const { result, violatingIds } = checkLegalityForPlayers(homePlayers);
    setHomeCheckResult(result);
    setHomeViolatingIds(violatingIds);
  };

  const checkAwayLegality = () => {
    const { result, violatingIds } = checkLegalityForPlayers(awayPlayers);
    setAwayCheckResult(result);
    setAwayViolatingIds(violatingIds);
  };

  // Clear legality when view changes
  useEffect(() => {
    setHomeCheckResult(null);
    setHomeViolatingIds([]);
  }, [homeView]);

  useEffect(() => {
    setAwayCheckResult(null);
    setAwayViolatingIds([]);
  }, [awayView]);

  // ─── Rotate / Copy ─────────────────────────────────────────────────────────

  const handleRotateFromPrevious = (which: 'home' | 'away') => {
    const team = which === 'home' ? home : away;
    const view = which === 'home' ? homeView : awayView;
    const previousView = getPreviousRotationViewKey(view);
    if (!team.rotations[previousView].length) return;
    const rotated = rotateFromPrevious(view, team.rotations);
    updateTeam(which, (prev) => ({
      ...prev,
      rotations: { ...prev.rotations, [view]: rotated },
    }));
  };

  const handleCopyFromOpposite = (which: 'home' | 'away') => {
    const team = which === 'home' ? home : away;
    const view = which === 'home' ? homeView : awayView;
    const copied = copyFromOpposite(view, team.rotations);
    if (!copied) return;
    updateTeam(which, (prev) => ({
      ...prev,
      rotations: { ...prev.rotations, [view]: copied },
    }));
  };

  // ─── Annotation undo ───────────────────────────────────────────────────────

  const handleUndo = () => {
    setAnnotationStrokes((prev) => {
      const current = prev[comboKey] ?? [];
      return { ...prev, [comboKey]: current.slice(0, -1) };
    });
  };

  // ─── Cloud load ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const id = localStorage.getItem('rotation-id');
      if (!user) return;

      if (!id) {
        setRotationTitle('Untitled Rotation');
        setHome(makeDefaultTeam('Home Team', 'HT', DEFAULT_HOME_COLOR));
        setAway(makeDefaultTeam('Away Team', 'AT', DEFAULT_AWAY_COLOR));
        setAnnotationStrokes({});
        setHomeView('R1');
        setAwayView('R1');
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
        setHome(set.home);
        setAway(set.away);
        setAnnotationStrokes(set.annotations ?? {});
        setHomeView('R1');
        setAwayView('R1');
        setRotationId(id);
        localStorage.removeItem('rotation-id');
      } catch (err) {
        console.error('Failed to load from cloud:', err);
        alert('Error loading rotation set.');
      }
    };
    load();
  }, [user]);

  // ─── Cloud save ────────────────────────────────────────────────────────────

  const saveToCloud = async () => {
    if (!user) {
      alert('You must be logged in to save.');
      return;
    }

    const sanitize = (team: Team): Team => ({
      ...team,
      roster: team.roster.map((p) => ({
        id: p.id,
        label: p.label ?? '',
        name: p.name ?? '',
        number: p.number ?? null,
        x: p.x,
        y: p.y,
        zone: p.zone ?? null,
      })),
      rotations: createRotationViewRecord<Player[]>((vk) =>
        team.rotations[vk].map((p) => ({
          id: p.id,
          label: p.label ?? '',
          name: p.name ?? '',
          number: p.number ?? null,
          x: p.x,
          y: p.y,
          zone: p.zone ?? null,
        }))
      ),
    });

    // Only save non-empty annotation entries
    const sparseAnnotations: Partial<Record<ComboAnnotationKey, Stroke[]>> = {};
    for (const [key, val] of Object.entries(annotationStrokes)) {
      if (val && val.length > 0) {
        sparseAnnotations[key as ComboAnnotationKey] = val;
      }
    }

    const title = rotationTitle.trim() || 'Untitled';
    const data = {
      title,
      home: sanitize(home),
      away: sanitize(away),
      annotations: sparseAnnotations,
      updatedAt: Timestamp.now(),
    };

    try {
      if (rotationId) {
        await setDoc(doc(db, 'users', user.uid, 'rotations', rotationId), data, {
          merge: true,
        });
        alert(`Updated "${title}"`);
      } else {
        const docRef = await addDoc(
          collection(db, 'users', user.uid, 'rotations'),
          { ...data, createdAt: Timestamp.now() }
        );
        setRotationId(docRef.id);
        alert(`Saved "${title}"`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save.');
    }
  };

  // ─── PDF export ────────────────────────────────────────────────────────────

  const exportAllToPdf = async () => {
    const pageWidth = 680;
    const pageHeight = 700;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [pageWidth, pageHeight * RECEIVE_VIEW_KEYS.length],
    });

    for (let i = 0; i < RECEIVE_VIEW_KEYS.length; i++) {
      const node = exportRefs.current[i];
      if (!node) continue;
      try {
        const dataUrl = await toPng(node);
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
      } catch (err) {
        console.error(`Export failed for rotation ${i + 1}:`, err);
      }
    }

    pdf.save(`${rotationTitle || 'Untitled Rotation'}(vbrt).pdf`);
  };

  // ─── Player edit modal ─────────────────────────────────────────────────────

  const openEditModal = (player: Player, team: 'home' | 'away') => {
    setEditTarget({ player, team });
  };

  const handleSaveEdit = (updated: Player) => {
    if (!editTarget) return;
    updatePlayer(editTarget.team, updated);
    setEditTarget(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f8f9ff] text-[#0b1c30]">
      <TopNavBar
        rotationTitle={rotationTitle}
        onTitleChange={setRotationTitle}
        homeVisible={homeVisible}
        awayVisible={awayVisible}
        onToggleHome={() => setHomeVisible((v) => !v || !awayVisible)}
        onToggleAway={() => setAwayVisible((v) => !v || !homeVisible)}
        onPdfExport={exportAllToPdf}
        onSave={saveToCloud}
        onExit={() => navigate('/library')}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Home sidebar */}
        <TeamSidebar
          side="home"
          teamName={home.name}
          teamAbbr={home.abbreviation}
          teamColor={home.color}
          isVisible={homeVisible}
          currentView={homeView}
          currentPhase={homePhase}
          onViewChange={setHomeView}
          onPhaseChange={setHomePhase}
          players={homePlayers}
          roster={home.roster}
          checkResult={homeCheckResult}
          editingPlayerId={
            editTarget?.team === 'home' ? editTarget.player.id : null
          }
          onCheckLegality={checkHomeLegality}
          onEditPlayer={(p) => openEditModal(p, 'home')}
          onAddToCourt={(p) => addToCourt('home', p)}
          onRemoveFromCourt={(id) => removeFromCourt('home', id)}
          onAddNewPlayer={() => addNewPlayer('home')}
          onRotateFromPrevious={() => handleRotateFromPrevious('home')}
          canRotateFromPrevious={homeHasPrevious}
          onCopyFromOpposite={() => handleCopyFromOpposite('home')}
          canCopyFromOpposite={homeHasOpposite}
          copyLabel={homeCopyLabel}
        />

        {/* Center canvas */}
        <main className="flex-1 bg-[#f8fafc] relative flex items-center justify-center p-4 overflow-hidden">
          <Court
            homePlayers={homePlayers}
            awayPlayers={awayPlayers}
            homeColor={home.color}
            awayColor={away.color}
            setHomePlayers={setHomePlayers}
            setAwayPlayers={setAwayPlayers}
            homeViolatingIds={homeViolatingIds}
            awayViolatingIds={awayViolatingIds}
            strokes={strokes}
            setStrokes={setStrokes}
            currentTool={currentTool}
            homeVisible={homeVisible}
            awayVisible={awayVisible}
          />

          {/* Floating tool palette */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <ToolPalette
              currentTool={currentTool}
              onToolChange={setCurrentTool}
              onClearStrokes={() => setStrokes([])}
              onUndo={handleUndo}
            />
          </div>
        </main>

        {/* Away sidebar */}
        <TeamSidebar
          side="away"
          teamName={away.name}
          teamAbbr={away.abbreviation}
          teamColor={away.color}
          isVisible={awayVisible}
          currentView={awayView}
          currentPhase={awayPhase}
          onViewChange={setAwayView}
          onPhaseChange={setAwayPhase}
          players={awayPlayers}
          roster={away.roster}
          checkResult={awayCheckResult}
          editingPlayerId={
            editTarget?.team === 'away' ? editTarget.player.id : null
          }
          onCheckLegality={checkAwayLegality}
          onEditPlayer={(p) => openEditModal(p, 'away')}
          onAddToCourt={(p) => addToCourt('away', p)}
          onRemoveFromCourt={(id) => removeFromCourt('away', id)}
          onAddNewPlayer={() => addNewPlayer('away')}
          onRotateFromPrevious={() => handleRotateFromPrevious('away')}
          canRotateFromPrevious={awayHasPrevious}
          onCopyFromOpposite={() => handleCopyFromOpposite('away')}
          canCopyFromOpposite={awayHasOpposite}
          copyLabel={awayCopyLabel}
        />
      </div>

      {/* Player edit modal */}
      <PlayerEditModal
        player={editTarget?.player ?? null}
        onSave={handleSaveEdit}
        onDelete={(id) => {
          if (editTarget) deletePlayer(editTarget.team, id);
          setEditTarget(null);
        }}
        onClose={() => setEditTarget(null)}
      />

      {/* Hidden export nodes for PDF */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, pointerEvents: 'none' }}>
        {RECEIVE_VIEW_KEYS.map((receiveView, index) => {
          const serveView = `S${getRotationNumber(receiveView)}` as RotationViewKey;
          return (
            <div
              key={receiveView}
              ref={(el) => {
                exportRefs.current[index] = el;
              }}
              style={{
                width: 680,
                backgroundColor: '#f8fafc',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ color: '#0b1c30', fontSize: 18, fontWeight: 700 }}>
                {rotationTitle || 'Untitled'} — {receiveView} / {serveView}
              </div>
              <Court
                homePlayers={home.rotations[receiveView]}
                awayPlayers={away.rotations[receiveView]}
                homeColor={home.color}
                awayColor={away.color}
                setHomePlayers={() => {}}
                setAwayPlayers={() => {}}
                homeViolatingIds={[]}
                awayViolatingIds={[]}
                strokes={annotationStrokes[makeComboKey(receiveView, 'R1')] ?? []}
                setStrokes={() => {}}
                currentTool="none"
                homeVisible={true}
                awayVisible={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourtEditor;
