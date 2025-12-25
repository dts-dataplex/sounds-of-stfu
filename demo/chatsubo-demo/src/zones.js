// Chatsubo Bar Zone Definitions
// Based on CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md

export const ZONES = [
  {
    id: 'gaming',
    name: 'Gaming Zone',
    position: { x: -12, y: 0, z: 7 },
    size: { x: 16, y: 14 },
    capacity: 4,
    color: 0x4080ff, // Blue-white LED
    falloffDistance: 8,
    lightIntensity: 1.2,
    lightColor: 0x6080ff,
  },
  {
    id: 'bar',
    name: 'Central Bar',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 16, y: 12 },
    capacity: 5,
    color: 0xff8800, // Amber glow
    falloffDistance: 6,
    lightIntensity: 1.0,
    lightColor: 0xffaa00,
  },
  {
    id: 'cards',
    name: 'Card Tables',
    position: { x: 12, y: 0, z: -6 },
    size: { x: 14, y: 12 },
    capacity: 4,
    color: 0xff2200, // Red neon
    falloffDistance: 7,
    lightIntensity: 0.9,
    lightColor: 0xff4400,
  },
  {
    id: 'firepit',
    name: 'Firepit Debate',
    position: { x: -12, y: 0, z: -7 },
    size: { x: 14, y: 14 },
    capacity: 5,
    color: 0xff6600, // Orange firelight
    falloffDistance: 9,
    lightIntensity: 0.8,
    lightColor: 0xff8844,
  },
];

// Wave-based audio falloff function
export function calculateVolume(distance, falloffDistance) {
  return 1 / (1 + Math.pow(distance / falloffDistance, 2));
}

// Get zone at position
export function getZoneAt(position) {
  for (const zone of ZONES) {
    const dx = Math.abs(position.x - zone.position.x);
    const dz = Math.abs(position.z - zone.position.z);
    if (dx < zone.size.x / 2 && dz < zone.size.y / 2) {
      return zone;
    }
  }
  return null;
}
