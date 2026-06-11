import type { Player } from '../models/Player';
import type { Team } from '../models/Team';
import { COURT_LOCAL_H, COURT_LOCAL_W } from '../lib/courtZones';
import { HALF_RENDER_BASE, FULL_RENDER_H } from './Court';
import { RECEIVE_VIEW_KEYS, ROTATION_VIEW_KEYS, type RotationViewKey } from '../lib/rotationViews';

const ATTACK_LINE_FROM_NET = '33.333%';
const TOKEN_RATIO = 0.12;
const THUMB_HEIGHT = 160;

function mapLocalToRender(
  x: number,
  y: number,
  flipX: boolean,
  flipY: boolean,
  halfSize: number
) {
  const rx = flipX
    ? ((COURT_LOCAL_W - x) / COURT_LOCAL_W) * halfSize
    : (x / COURT_LOCAL_W) * halfSize;
  const ry = flipY
    ? ((COURT_LOCAL_H - y) / COURT_LOCAL_H) * halfSize
    : (y / COURT_LOCAL_H) * halfSize;
  return { rx, ry };
}

function pickPreviewView(team: Team): RotationViewKey {
  if (team.rotations.R1.length > 0) return 'R1';
  return ROTATION_VIEW_KEYS.find((key) => team.rotations[key].length > 0) ?? 'R1';
}

function countReceiveRotations(home: Team): number {
  return RECEIVE_VIEW_KEYS.filter((key) => home.rotations[key].length > 0).length;
}

function PlayerToken({
  player,
  teamColor,
  flipX,
  flipY,
  halfSize,
}: {
  player: Player;
  teamColor: string;
  flipX: boolean;
  flipY: boolean;
  halfSize: number;
}) {
  const coordScale = halfSize / COURT_LOCAL_W;
  const tokenSize = COURT_LOCAL_W * TOKEN_RATIO * coordScale;
  const { rx, ry } = mapLocalToRender(player.x, player.y, flipX, flipY, halfSize);
  const label = player.number != null ? String(player.number) : player.label;

  return (
    <div
      className="absolute rounded-full border border-white shadow-sm flex items-center justify-center pointer-events-none"
      style={{
        left: rx,
        top: ry,
        transform: 'translate(-50%, -50%)',
        width: tokenSize,
        height: tokenSize,
        backgroundColor: teamColor,
        fontSize: Math.max(6, tokenSize * 0.35),
        zIndex: 10,
      }}
    >
      <span className="text-white font-bold leading-none truncate px-0.5">
        {label}
      </span>
    </div>
  );
}

function CourtHalf({
  players,
  teamColor,
  flipX,
  flipY,
  halfSize,
  attackLineSide,
}: {
  players: Player[];
  teamColor: string;
  flipX: boolean;
  flipY: boolean;
  halfSize: number;
  attackLineSide: 'top' | 'bottom';
}) {
  return (
    <div
      className="court-gradient relative overflow-hidden shrink-0"
      style={{ width: halfSize, height: halfSize }}
    >
      <div
        className="absolute left-0 w-full h-[2px] bg-white/40"
        style={attackLineSide === 'bottom' ? { bottom: ATTACK_LINE_FROM_NET } : { top: ATTACK_LINE_FROM_NET }}
      />
      {players.map((player) => (
        <PlayerToken
          key={player.id}
          player={player}
          teamColor={teamColor}
          flipX={flipX}
          flipY={flipY}
          halfSize={halfSize}
        />
      ))}
    </div>
  );
}

type Props = {
  home: Team;
  away: Team;
};

export default function CourtThumbnail({ home, away }: Props) {
  const halfSize = HALF_RENDER_BASE;
  const courtWidth = halfSize;
  const courtHeight = FULL_RENDER_H;
  const scale = THUMB_HEIGHT / courtHeight;

  const homeView = pickPreviewView(home);
  const awayView = pickPreviewView(away);
  const homePlayers = home.rotations[homeView];
  const awayPlayers = away.rotations[awayView];
  const rotationCount = countReceiveRotations(home);

  return (
    <div
      className="h-40 relative overflow-hidden bg-surface-container-low pointer-events-none"
      style={{ height: THUMB_HEIGHT }}
    >
      <div
        className="absolute left-1/2 top-1/2 flex flex-col rounded-lg border-2 border-white overflow-hidden shadow-sm"
        style={{
          width: courtWidth,
          height: courtHeight,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <CourtHalf
          players={awayPlayers}
          teamColor={away.color}
          flipX={true}
          flipY={true}
          halfSize={halfSize}
          attackLineSide="bottom"
        />
        <div
          className="absolute left-0 w-full h-1 bg-white z-20 pointer-events-none"
          style={{ top: halfSize, transform: 'translateY(-50%)' }}
        />
        <CourtHalf
          players={homePlayers}
          teamColor={home.color}
          flipX={false}
          flipY={false}
          halfSize={halfSize}
          attackLineSide="top"
        />
      </div>
      <div className="absolute top-2 right-2 bg-court-green/80 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider z-10">
        {rotationCount} Rotation{rotationCount === 1 ? '' : 's'}
      </div>
    </div>
  );
}
