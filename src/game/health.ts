export const STARTING_HEALTH = 39;

export function getHealthRecoveryLimit(health: number): number {
  if (health < 10) return 9;
  if (health < 20) return 19;
  if (health < 30) return 29;
  return STARTING_HEALTH;
}

export function applyDamageToHealth(health: number, currentLimit: number, damage: number): { health: number; healthLimit: number } {
  const nextHealth = Math.max(0, health - damage);
  return {
    health: nextHealth,
    healthLimit: Math.min(currentLimit, getHealthRecoveryLimit(nextHealth))
  };
}

export function recoverHealth(health: number, healthLimit: number, amount: number): number {
  return Math.min(healthLimit, health + amount);
}
