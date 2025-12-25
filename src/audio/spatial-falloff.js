/**
 * Spatial Audio Distance Falloff Algorithm
 * Chatsubo Virtual Bar - Sounds of STFU
 *
 * Implements wave-based inverse square law for realistic spatial audio attenuation.
 * Based on specifications in docs/plans/CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md
 *
 * @module spatial-falloff
 */

/**
 * Zone acoustic configurations from Chatsubo floor plan specifications.
 * Each zone has specific acoustic characteristics that affect audio propagation.
 */
export const ZONE_CONFIGS = {
  gaming: {
    zone_id: 'gaming',
    falloff_function: 'wave_inverse_square',
    falloff_distance: 8.0, // feet
    max_volume: 1.0,
    min_volume: 0.05,
    acoustic_character: 'bright_reflective',
    boundary_type: 'hard',
    background_ambience: 'game_hum_10pct',
    color: '#88AAFF', // Blue-white LED
  },
  central_bar: {
    zone_id: 'central_bar',
    falloff_function: 'wave_inverse_square',
    falloff_distance: 6.0,
    max_volume: 1.0,
    min_volume: 0.1,
    acoustic_character: 'balanced_absorptive',
    boundary_type: 'soft',
    background_ambience: 'bar_ambient_5pct',
    color: '#FFAA44', // Amber backlit
  },
  card_tables: {
    zone_id: 'card_tables',
    falloff_function: 'wave_inverse_square',
    falloff_distance: 7.0,
    max_volume: 1.0,
    min_volume: 0.05,
    acoustic_character: 'intimate_damped',
    boundary_type: 'medium',
    background_ambience: 'cards_shuffle_8pct',
    color: '#FF4444', // Red neon
  },
  firepit: {
    zone_id: 'firepit',
    falloff_function: 'wave_inverse_square',
    falloff_distance: 9.0,
    max_volume: 1.0,
    min_volume: 0.1,
    acoustic_character: 'reflective_resonant',
    boundary_type: 'soft',
    background_ambience: 'fire_crackle_12pct',
    color: '#FF6622', // Orange firelight
  },
  booth: {
    zone_id: 'booth',
    falloff_function: 'hard_cutoff',
    falloff_distance: 0.0, // No leakage
    max_volume: 1.0,
    min_volume: 0.0,
    acoustic_character: 'deadened_insulated',
    boundary_type: 'encrypted_hard',
    background_ambience: 'none',
    privacy_mode: true,
    access_control: 'prompt_based',
    color: '#FF4422', // Red-orange
  },
  stage: {
    zone_id: 'stage',
    falloff_function: 'broadcast_spatial_enhanced',
    falloff_distance: null, // Broadcast to all
    base_volume: 0.4, // 40% to entire bar
    proximity_bonus: 0.4, // +40% if within 10ft
    max_volume: 0.8,
    min_volume: 0.4,
    acoustic_character: 'bright_projected',
    boundary_type: 'broadcast',
    user_control: 'mute_adjust_enabled',
    color: '#FFCC66', // Warm spotlight
  },
};

/**
 * Calculate volume attenuation based on distance using wave-based inverse square law.
 * Formula: volume = 1 / (1 + (distance / falloff_distance)^2)
 */
export function calculateWaveFalloff(distance, falloffDistance) {
  if (falloffDistance <= 0) {
    throw new Error('Falloff distance must be greater than 0');
  }
  if (distance < 0) {
    throw new Error('Distance cannot be negative');
  }

  const ratio = distance / falloffDistance;
  const volume = 1 / (1 + Math.pow(ratio, 2));
  return volume;
}

/**
 * Calculate Euclidean distance between two 2D points.
 */
export function calculateDistance(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate 3D distance between two points (includes floor elevation).
 */
export function calculateDistance3D(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate volume for a sound source based on listener position and zone configuration.
 */
export function calculateVolumeForSource(listenerPos, sourcePos, zoneId, options = {}) {
  const { use3D = false, manualVolume = 1.0 } = options;

  const zoneConfig = ZONE_CONFIGS[zoneId];
  if (!zoneConfig) {
    throw new Error(`Unknown zone: ${zoneId}`);
  }

  const distance = use3D
    ? calculateDistance3D(listenerPos, sourcePos)
    : calculateDistance(listenerPos, sourcePos);

  let spatialVolume;

  switch (zoneConfig.falloff_function) {
    case 'wave_inverse_square':
      spatialVolume = calculateWaveFalloff(distance, zoneConfig.falloff_distance);
      break;

    case 'hard_cutoff':
      spatialVolume = distance === 0 ? zoneConfig.max_volume : zoneConfig.min_volume;
      break;

    case 'broadcast_spatial_enhanced':
      spatialVolume = zoneConfig.base_volume;
      if (distance <= 10.0) {
        const proximityFactor = 1 - distance / 10.0;
        spatialVolume += zoneConfig.proximity_bonus * proximityFactor;
      }
      break;

    default:
      throw new Error(`Unknown falloff function: ${zoneConfig.falloff_function}`);
  }

  spatialVolume = Math.max(zoneConfig.min_volume, Math.min(zoneConfig.max_volume, spatialVolume));

  const finalVolume = spatialVolume * manualVolume;
  return Math.max(0.0, Math.min(1.0, finalVolume));
}

/**
 * Calculate audio crossfade duration based on movement distance.
 * Walking speed: 3 feet per second
 */
export function calculateCrossfadeDuration(distance) {
  const WALKING_SPEED = 3.0;
  return distance / WALKING_SPEED;
}

/**
 * Calculate volume at specific points along the falloff curve for a zone.
 */
export function sampleFalloffCurve(zoneId, distances) {
  const zoneConfig = ZONE_CONFIGS[zoneId];
  if (!zoneConfig) {
    throw new Error(`Unknown zone: ${zoneId}`);
  }

  return distances.map((distance) => {
    const volume = calculateWaveFalloff(distance, zoneConfig.falloff_distance);
    return {
      distance,
      volume: Math.max(zoneConfig.min_volume, Math.min(zoneConfig.max_volume, volume)),
      percentage: Math.round(volume * 100),
    };
  });
}

/**
 * Alias for calculateWaveFalloff - more intuitive name for spatial audio gain calculation.
 * @see calculateWaveFalloff
 */
export const calculateSpatialGain = calculateWaveFalloff;
