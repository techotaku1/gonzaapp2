export const availableColors = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'gray',
  'indigo',
  'teal',
  'cyan',
  'lime',
] as const;

export type TramiteColor = (typeof availableColors)[number];

export function getNextAvailableColor(usedColors: string[]): TramiteColor {
  const available = availableColors.filter(
    (color) => !usedColors.includes(color)
  );
  return available.length > 0 ? available[0] : 'gray';
}

export function suggestColorForTramite(tramiteName: string): string {
  const name = tramiteName.toLowerCase();

  // Sugerencias específicas para los trámites existentes - USANDO NOMBRES DE LA TABLA COLORES
  if (name.includes('licencia')) return 'azul';
  if (name.includes('renovacion')) return 'verde-lima';
  if (name.includes('streaming')) return 'purpura';
  if (name.includes('afiliacion') || name.includes('seguridad social'))
    return 'naranja';
  if (name.includes('certificado') || name.includes('tradicion'))
    return 'verde-azulado';

  // Sugerencias generales para otros trámites - USANDO NOMBRES DE LA TABLA COLORES
  if (name.includes('revision') || name.includes('tecnico')) return 'rojo';
  if (name.includes('conduccion')) return 'azul';
  if (name.includes('duplicado') || name.includes('tarjeta')) return 'verde';
  if (name.includes('matricula') || name.includes('registro'))
    return 'amarillo';
  if (name.includes('traspaso') || name.includes('cambio')) return 'purpura';
  if (name.includes('blindaje') || name.includes('seguridad')) return 'naranja';
  if (name.includes('permiso') || name.includes('temporal')) return 'rosa';
  if (name.includes('gravamen') || name.includes('prenda')) return 'indigo';
  if (name.includes('copia')) return 'verde-azulado';
  if (name.includes('multa') || name.includes('comparendo')) return 'cian';
  if (name.includes('vigencia')) return 'verde-lima';

  return 'gris'; // Color por defecto
}
