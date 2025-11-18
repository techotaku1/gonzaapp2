import { unstable_noStore as noStore } from 'next/cache';

import CuadreClientTable from '~/components/cuadre/CuadreClientTable';
import { SWRProvider } from '~/components/swr/SWRProvider';
import { getCuadreRecords } from '~/server/actions/cuadreActions';

export default async function Page() {
  noStore();

  const initialData = await getCuadreRecords();

  return (
    <SWRProvider>
      <main className="mx-auto w-full max-w-7xl px-0 py-4">
        <div>
          {/* Wrapper responsive solo para móviles */}
          <div className="cuadre-responsive -mx-0 sm:mx-0">
            {/* Scroll horizontal solo en pantallas pequeñas */}
            <div
              className="overflow-x-auto"
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Evita que la tabla se aplaste en móviles y da más ancho de columna */}
              <div className="inline-block min-w-[1600px] align-middle sm:min-w-full">
                <CuadreClientTable initialData={initialData ?? []} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reglas mobile-only: columnas más anchas y sin solapamiento */}
      <style>{`
        @media (max-width: 767px) {
          /* Deja que el contenido defina el ancho de las columnas */
          .cuadre-responsive table {
            table-layout: auto !important;
            border-collapse: separate !important;
            width: 100%;
          }
          /* Aumenta el ancho mínimo y el padding para que el contenido quepa mejor */
          .cuadre-responsive th,
          .cuadre-responsive td {
            min-width: 120px;
            padding-left: 10px;
            padding-right: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          /* Columna muy compacta (ej. checkbox/acciones) si existiera como primera columna */
          .cuadre-responsive tr > *:first-child {
            min-width: 56px;
          }
          /* Da un poco más de ancho a columnas que suelen ser largas si coinciden con el orden común */
          .cuadre-responsive tr > *:nth-child(2),
          .cuadre-responsive tr > *:nth-child(3),
          .cuadre-responsive tr > *:nth-child(4) {
            min-width: 140px;
          }
          /* Permite celdas con clase .wrap hacer varias líneas si lo necesitas en el componente interno */
          .cuadre-responsive .wrap {
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
          }
        }
      `}</style>
    </SWRProvider>
  );
}
