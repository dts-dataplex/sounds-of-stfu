/**
 * Zone Configuration for Chatsubo Virtual Bar
 * Based on CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md
 */

export const ZONES = {
  gaming: {
    name: 'Gaming Zone',
    floor: 0,
    bounds: { x: 0, y: 0, width: 16, height: 14 },
    color: 0x88aaff, // Blue-white LED
    lightColor: 0x88aaff,
    lightIntensity: 1.5,
    capacity: 4,
    falloffDistance: 8.0,
    acousticType: 'bright',
  },
  central_bar: {
    name: 'Central Bar',
    floor: 0,
    bounds: { x: 16, y: 10, width: 16, height: 12 },
    color: 0xffaa44, // Amber backlit
    lightColor: 0xffaa44,
    lightIntensity: 1.2,
    capacity: 5,
    falloffDistance: 6.0,
    acousticType: 'balanced',
  },
  card_tables: {
    name: 'Card Tables',
    floor: 0,
    bounds: { x: 32, y: 22, width: 14, height: 12 },
    color: 0xff4444, // Red neon
    lightColor: 0xff4444,
    lightIntensity: 0.8,
    capacity: 4,
    falloffDistance: 7.0,
    acousticType: 'intimate',
  },
  firepit: {
    name: 'Firepit Debate Area',
    floor: 0,
    bounds: { x: 0, y: 22, width: 14, height: 14 },
    color: 0xff6622, // Orange firelight
    lightColor: 0xff6622,
    lightIntensity: 1.0,
    capacity: 5,
    falloffDistance: 9.0,
    acousticType: 'reflective',
  },
  booth1: {
    name: 'Private Booth 1',
    floor: 1,
    bounds: { x: 0, y: 0, width: 6, height: 6 },
    color: 0xff4422, // Red-orange
    lightColor: 0xff4422,
    lightIntensity: 0.4,
    capacity: 3,
    falloffDistance: 0.0,
    acousticType: 'deadened',
    private: true,
  },
  booth2: {
    name: 'Private Booth 2',
    floor: 1,
    bounds: { x: 8, y: 0, width: 6, height: 6 },
    color: 0xff4422,
    lightColor: 0xff4422,
    lightIntensity: 0.4,
    capacity: 3,
    falloffDistance: 0.0,
    acousticType: 'deadened',
    private: true,
  },
  booth3: {
    name: 'Private Booth 3',
    floor: 1,
    bounds: { x: 16, y: 0, width: 6, height: 6 },
    color: 0xff4422,
    lightColor: 0xff4422,
    lightIntensity: 0.4,
    capacity: 3,
    falloffDistance: 0.0,
    acousticType: 'deadened',
    private: true,
  },
  stage: {
    name: 'Small Stage',
    floor: 1,
    bounds: { x: 32, y: 26, width: 10, height: 8 },
    color: 0xaa44ff, // Purple/magenta
    lightColor: 0xffcc66, // Warm spotlight
    lightIntensity: 1.0,
    capacity: 3,
    falloffDistance: null, // Broadcast mode
    acousticType: 'projected',
  },
};

export const FLOOR_HEIGHT = {
  FIRST: 0,
  SECOND: 12, // 12ft above first floor
};
