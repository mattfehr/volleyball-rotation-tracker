export type Player = {
  id: string;
  label: string; // e.g., "OH1"
  name: string;  // e.g., "Taylor"
  x: number;
  y: number;
  zone?: number; // optional zone number 1 through 6
};