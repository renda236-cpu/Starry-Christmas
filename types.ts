import { Vector3 } from 'three';

export enum AppStage {
  ENTRY = 'ENTRY',
  IMMERSION = 'IMMERSION',
}

export interface Particle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  color: string;
  alpha: number;
  life: number; // 0 to 1
  decay: number;
  size: number;
}

export interface FireworkInstance {
  id: string;
  particles: Particle[];
  active: boolean;
  color: string;
}

export interface TextItem {
  id: string;
  content: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}