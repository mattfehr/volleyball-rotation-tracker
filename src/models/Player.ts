export type Player = {
  id: string;
  label: string;   // position abbreviation, e.g. "OH", "S", "MB"
  name: string;    // e.g. "Taylor"
  number?: number | null; // jersey number (optional)
  x: number;
  y: number;
  zone?: number | null; // 1-6
};
