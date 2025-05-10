// Gemeinsam genutzte Typen für das Rennspiel

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CarInterface {
  getPosition(): Position;
  getSize(): Size;
  getAngle(): number;
  getLapsCompleted(): number;
  getDistanceTraveled(): number;
  getName(): string;
  getColor(): string;
}