export interface SoatPrice {
  vehicleType: string;
  cylinderRange?: string;
  basePrice: number;
  code?: string;
}

export const vehicleTypes = [
  '100 - Ciclomotores',
  '110 - Menos de 100 c.c.',
  '120 - De 100 a 200 c.c.',
  '130 - Más de 200 c.c.',
  '140 - Motocarros, tricimoto, cuadriciclos',
  '211 - Camperos y Camionetas (0-9 años) menos 1.500 c.c.',
  '221 - Camperos y Camionetas (0-9 años) 1.500-2.500 c.c.',
  '231 - Camperos y Camionetas (0-9 años) más 2.500 c.c.',
  '212 - Camperos y Camionetas (10+ años) menos 1.500 c.c.',
  '222 - Camperos y Camionetas (10+ años) 1.500-2.500 c.c.',
  '232 - Camperos y Camionetas (10+ años) más 2.500 c.c.',
  '310 - Carga menos de 5 ton',
  '320 - Carga 5 a 15 ton',
  '330 - Carga más de 15 ton',
  '410 - Oficiales Especiales menos 1.500 c.c.',
  '420 - Oficiales Especiales 1.500-2.500 c.c.',
  '430 - Oficiales Especiales más 2.500 c.c.',
  '511 - Autos Familiares (0-9 años) menos 1.500 c.c.',
  '521 - Autos Familiares (0-9 años) 1.500-2.500 c.c.',
  '531 - Autos Familiares (0-9 años) más 2.500 c.c.',
  '512 - Autos Familiares (10+ años) menos 1.500 c.c.',
  '522 - Autos Familiares (10+ años) 1.500-2.500 c.c.',
  '532 - Autos Familiares (10+ años) más 2.500 c.c.',
  '611 - 6+ Pasajeros (0-9 años) menos 2.500 c.c.',
  '621 - 6+ Pasajeros (0-9 años) 2.500 c.c. o más',
  '612 - 6+ Pasajeros (10+ años) menos 2.500 c.c.',
  '622 - 6+ Pasajeros (10+ años) 2.500 c.c. o más',
  '711 - Autos Negocios (0-9 años) menos 1.500 c.c.',
  '721 - Autos Negocios (0-9 años) 1.500-2.500 c.c.',
  '731 - Autos Negocios (0-9 años) más 2.500 c.c.',
  '712 - Autos Negocios (10+ años) menos 1.500 c.c.',
  '722 - Autos Negocios (10+ años) 1.500-2.500 c.c.',
  '732 - Autos Negocios (10+ años) más 2.500 c.c.',
  '810 - Bus buseta urbano',
  '910 - Buses menos de 10 pasajeros',
  '920 - Buses 10 o más pasajeros',
] as const;

export type VehicleType = (typeof vehicleTypes)[number];

export const soatPrices2025: SoatPrice[] = [
  { vehicleType: '100 - Ciclomotores', code: '100', basePrice: 118200 },
  { vehicleType: '110 - Menos de 100 c.c.', code: '110', basePrice: 243700 },
  { vehicleType: '120 - De 100 a 200 c.c.', code: '120', basePrice: 326600 },
  { vehicleType: '130 - Más de 200 c.c.', code: '130', basePrice: 758600 },
  {
    vehicleType: '140 - Motocarros, tricimoto, cuadriciclos',
    code: '140',
    basePrice: 368100,
  },

  // Camperos y Camionetas
  {
    vehicleType: '211 - Camperos y Camionetas (0-9 años) menos 1.500 c.c.',
    code: '211',
    basePrice: 789900,
  },
  {
    vehicleType: '221 - Camperos y Camionetas (0-9 años) 1.500-2.500 c.c.',
    code: '221',
    basePrice: 943100,
  },
  {
    vehicleType: '231 - Camperos y Camionetas (0-9 años) más 2.500 c.c.',
    code: '231',
    basePrice: 1106200,
  },
  {
    vehicleType: '212 - Camperos y Camionetas (10+ años) menos 1.500 c.c.',
    code: '212',
    basePrice: 949500,
  },
  {
    vehicleType: '222 - Camperos y Camionetas (10+ años) 1.500-2.500 c.c.',
    code: '222',
    basePrice: 1117100,
  },
  {
    vehicleType: '232 - Camperos y Camionetas (10+ años) más 2.500 c.c.',
    code: '232',
    basePrice: 1269300,
  },

  // Carga
  { vehicleType: '310 - Carga menos de 5 ton', code: '310', basePrice: 885000 },
  { vehicleType: '320 - Carga 5 a 15 ton', code: '320', basePrice: 1277900 },
  { vehicleType: '330 - Carga más de 15 ton', code: '330', basePrice: 1615800 },

  // Oficiales Especiales
  {
    vehicleType: '410 - Oficiales Especiales menos 1.500 c.c.',
    code: '410',
    basePrice: 995800,
  },
  {
    vehicleType: '420 - Oficiales Especiales 1.500-2.500 c.c.',
    code: '420',
    basePrice: 1255400,
  },
  {
    vehicleType: '430 - Oficiales Especiales más 2.500 c.c.',
    code: '430',
    basePrice: 1505000,
  },

  // Autos Familiares
  {
    vehicleType: '511 - Autos Familiares (0-9 años) menos 1.500 c.c.',
    code: '511',
    basePrice: 445600,
  },
  {
    vehicleType: '521 - Autos Familiares (0-9 años) 1.500-2.500 c.c.',
    code: '521',
    basePrice: 542700,
  },
  {
    vehicleType: '531 - Autos Familiares (0-9 años) más 2.500 c.c.',
    code: '531',
    basePrice: 633800,
  },
  {
    vehicleType: '512 - Autos Familiares (10+ años) menos 1.500 c.c.',
    code: '512',
    basePrice: 590700,
  },
  {
    vehicleType: '522 - Autos Familiares (10+ años) 1.500-2.500 c.c.',
    code: '522',
    basePrice: 675000,
  },
  {
    vehicleType: '532 - Autos Familiares (10+ años) más 2.500 c.c.',
    code: '532',
    basePrice: 751600,
  },

  // 6+ Pasajeros
  {
    vehicleType: '611 - 6+ Pasajeros (0-9 años) menos 2.500 c.c.',
    code: '611',
    basePrice: 794400,
  },
  {
    vehicleType: '621 - 6+ Pasajeros (0-9 años) 2.500 c.c. o más',
    code: '621',
    basePrice: 1063300,
  },
  {
    vehicleType: '612 - 6+ Pasajeros (10+ años) menos 2.500 c.c.',
    code: '612',
    basePrice: 1013900,
  },
  {
    vehicleType: '622 - 6+ Pasajeros (10+ años) 2.500 c.c. o más',
    code: '622',
    basePrice: 1276700,
  },

  // Autos Negocios
  {
    vehicleType: '711 - Autos Negocios (0-9 años) menos 1.500 c.c.',
    code: '711',
    basePrice: 268200,
  },
  {
    vehicleType: '721 - Autos Negocios (0-9 años) 1.500-2.500 c.c.',
    code: '721',
    basePrice: 333000,
  },
  {
    vehicleType: '731 - Autos Negocios (0-9 años) más 2.500 c.c.',
    code: '731',
    basePrice: 429300,
  },
  {
    vehicleType: '712 - Autos Negocios (10+ años) menos 1.500 c.c.',
    code: '712',
    basePrice: 334800,
  },
  {
    vehicleType: '722 - Autos Negocios (10+ años) 1.500-2.500 c.c.',
    code: '722',
    basePrice: 411200,
  },
  {
    vehicleType: '732 - Autos Negocios (10+ años) más 2.500 c.c.',
    code: '732',
    basePrice: 503500,
  },

  // Buses
  { vehicleType: '810 - Bus buseta urbano', code: '810', basePrice: 640300 },
  {
    vehicleType: '910 - Buses menos de 10 pasajeros',
    code: '910',
    basePrice: 633000,
  },
  {
    vehicleType: '920 - Buses 10 o más pasajeros',
    code: '920',
    basePrice: 918000,
  },
];

export function calculateSoatPrice(
  vehicleType: string,
  cylinderCapacity: number | null
): number {
  const prices = soatPrices2025.filter(
    (price) => price.vehicleType === vehicleType
  );

  if (prices.length === 0) return 0;

  // Si no hay rangos de cilindraje, devolver el precio base
  if (!prices[0]?.cylinderRange) {
    return prices[0]?.basePrice ?? 0;
  }

  // Si hay rangos de cilindraje pero no se proporciona cilindraje
  if (!cylinderCapacity) return 0;

  // Encontrar el rango correcto según el cilindraje
  const price = prices.find((p) => {
    switch (p.cylinderRange) {
      case 'Menos de 1.500 c.c.':
        return cylinderCapacity < 1500;
      case 'De 1.500 a 2.500 c.c.':
        return cylinderCapacity >= 1500 && cylinderCapacity <= 2500;
      case 'Más de 2.500 c.c.':
        return cylinderCapacity > 2500;
      default:
        return false;
    }
  });

  return price?.basePrice ?? 0;
}

export function getAvailableVehicleTypes(): readonly string[] {
  return vehicleTypes;
}
