export type AnimationSpeed = 'slow' | 'medium' | 'fast';

export const animationSpeeds: Array<{ value: AnimationSpeed; label: string }> = [
  { value: 'slow', label: 'Lent' },
  { value: 'medium', label: 'Moyen' },
  { value: 'fast', label: 'Rapide' }
];

export const animationDurations: Record<AnimationSpeed, { damage: number; defeat: number; combatEnd: number; playerFeedback: number; movementStep: number; trapIntro: number; trapFeedback: number }> = {
  slow: { damage: 1100, defeat: 1600, combatEnd: 1800, playerFeedback: 4000, movementStep: 400, trapIntro: 2400, trapFeedback: 3200 },
  medium: { damage: 750, defeat: 1100, combatEnd: 1200, playerFeedback: 2400, movementStep: 280, trapIntro: 1800, trapFeedback: 2400 },
  fast: { damage: 450, defeat: 700, combatEnd: 800, playerFeedback: 1200, movementStep: 160, trapIntro: 1100, trapFeedback: 1400 }
};

export const defaultAnimationSpeed: AnimationSpeed = 'medium';

export function isAnimationSpeed(value: string | null): value is AnimationSpeed {
  return value === 'slow' || value === 'medium' || value === 'fast';
}
