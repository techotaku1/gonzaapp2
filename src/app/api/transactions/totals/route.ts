import { NextRequest, NextResponse } from 'next/server';

import { sql } from 'drizzle-orm';

import { db } from '~/server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const searchTerm = searchParams.get('searchTerm')?.toLowerCase() ?? '';
  const page = Number(searchParams.get('page') ?? 1);
  const pageSize = Number(searchParams.get('pageSize') ?? 10);

  // Filtros dinámicos
  const filters: string[] = [];
  if (startDate) filters.push(`fecha >= '${startDate}'`);
  if (endDate) filters.push(`fecha <= '${endDate} 23:59:59'`);
  if (searchTerm) {
    filters.push(`
      (
        LOWER(placa) LIKE '%${searchTerm}%'
        OR LOWER(nombre) LIKE '%${searchTerm}%'
        OR LOWER(numero_documento) LIKE '%${searchTerm}%'
        OR LOWER(emitido_por) LIKE '%${searchTerm}%'
        OR LOWER(tipo_documento) LIKE '%${searchTerm}%'
        OR LOWER(ciudad) LIKE '%${searchTerm}%'
        OR LOWER(asesor) LIKE '%${searchTerm}%'
        OR LOWER(novedad) LIKE '%${searchTerm}%'
        OR LOWER(tramite) LIKE '%${searchTerm}%'
      )
    `);
  }
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  // Consulta agrupada por día
  const offset = (page - 1) * pageSize;
  const query = `
    SELECT
      DATE(fecha) as date,
      COUNT(*) as transactionCount,
      SUM(precio_neto::numeric + CASE WHEN comision_extra THEN 30000 ELSE 0 END) as precioNetoTotal,
      SUM(tarifa_servicio::numeric) as tarifaServicioTotal,
      SUM(impuesto_4x1000::numeric) as impuesto4x1000Total,
      SUM(ganancia_bruta::numeric) as gananciaBrutaTotal
    FROM transactions
    ${whereClause}
    GROUP BY DATE(fecha)
    ORDER BY DATE(fecha) DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;
  const totals = await db.execute(sql.raw(query));

  // Total de días para paginación
  const countQuery = `
    SELECT COUNT(*) as totalDays
    FROM (
      SELECT 1 FROM transactions
      ${whereClause}
      GROUP BY DATE(fecha)
    ) as days
  `;
  const [{ totalDays }] = await db.execute(sql.raw(countQuery));

  return NextResponse.json({
    totals,
    totalPages: Math.ceil(Number(totalDays) / pageSize),
  });
}