import { BLESSING_TEMPLATES } from '../constants';

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const randomColor = (colors: string[]) => colors[Math.floor(Math.random() * colors.length)];

export const generateBlessing = (name: string): string => {
  const template = BLESSING_TEMPLATES[Math.floor(Math.random() * BLESSING_TEMPLATES.length)];
  return template.replace(/{Name}/g, name);
};

export const getRandomPosition = () => {
  // Logic: Avoid center (35% - 65% X) to prevent overlapping main visual elements too much
  // Split into Left Zone (5-35%) and Right Zone (65-95%)
  const isLeft = Math.random() > 0.5;
  const x = isLeft ? randomRange(5, 35) : randomRange(65, 95);
  
  // Y Axis: 10% to 90%
  const y = randomRange(10, 90);
  
  return { x, y };
};