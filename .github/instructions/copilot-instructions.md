<!-- Project-specific Copilot instructions for AI coding agents -->

# Copilot / AI Agent Quick Guide — gonzaapp

Purpose: help an AI coding agent get productive quickly in this repository. Keep answers short and make minimal, well-tested edits.

Core facts (big picture)

- Next.js (App Router), TypeScript, React + SWR on the frontend. Server code lives under `src/app/api` (Route handlers) and `src/server` (db/actions). Drizzle ORM + Postgres for persistence (`src/server/db/schema.ts`).
- UI is componentized under `src/components` (notably `transacciones/` for transactions UI). Totals and Boleta flows are in `TransactionTable.tsx` and `TransactionBoletaTotals.tsx`.
- State & hooks: custom hooks under `src/hooks` and SWR is used for remote caching and polling.

Important files & where to look first

- `src/components/transacciones/TransactionTable.tsx` — main transactions UI, zoom, selection, payment modal.
- `src/components/transacciones/TransactionTableLogic.tsx` — business logic for pagination, edits, selection and debounced save.
- `src/components/transacciones/TransactionBoletaTotals.tsx` — boleta paid totals, grouping/pagination by date.
- `src/app/api/boleta-payments/route.ts` — API that writes boleta payments (important: sets `fecha` and `banco`).
- `src/server/db/schema.ts` — Drizzle schema; changing columns requires a DB migration in `drizzle/migrations`.
- `src/types` — shared types (e.g. `BoletaPaymentRecord`, `TransactionRecord`).

Conventions and patterns to followscm-history-item:c%3A%5CUsers%5CUsuario%5CDocuments%5CDOC%20JOSE%5CDEV%5Cgonzaapp?%7B%22repositoryId%22%3A%22scm0%22%2C%22historyItemId%22%3A%226e38e25adc602a246609123d13672c5b004bd037%22%2C%22historyItemParentId%22%3A%2238e3f9f278359e7ba886ef22f02185c9a4a848d4%22%2C%22historyItemDisplayId%22%3A%226e38e25%22%7D

- Client/server separation: route handlers (Next.js route.ts) are server-only and may use `currentUser()` (Clerk) and `db` imports. Do not import client-only modules in server files.
- Timezone handling: canonical timezone is `America/Bogota`. Backend should persist timestamps so UI can format with `timeZone: 'America/Bogota'`. Avoid brittle manual +5/-5 arithmetic — use Intl/date-fns-tz formatting.
- SWR usage: prefer `useSWR(url, fetcher)` with `refreshInterval: 60000` for lists; use `useSWRConfig().mutate()` for invalidation.
- Edits flow: the UI frequently uses optimistic edits and debounced saves (`useDebouncedSave`). When changing save flows, keep existing debouncing and pending-edit semantics.

Editing rules

- Make the smallest change that makes tests/lint pass — prefer tight diffs. Preserve existing indentation and style.
- When editing a server route or schema: add a SQL migration under `drizzle/migrations/` and update `src/server/db/schema.ts`. Do not modify schema without a migration.
- When changing UI behavior around selection/zoom/pagination, update logic in `TransactionTableLogic.tsx`, then the consuming `TransactionTable.tsx` — this keeps UI <-> logic separation intact.

Testing / quick local checks

- Install with legacy peers if needed (repo currently uses Next 16 and some deps may not yet support it): `npm install --legacy-peer-deps` (temporary).
- Run dev: `npm run dev` or `next dev`. If using db studio: `npm run db:studio`.
- Lint/typecheck: `npm run lint` / `npm run typecheck` if present; otherwise `npx tsc --noEmit`.

Integration points & gotchas

- Clerk auth: server code uses `currentUser()` from `@clerk/nextjs/server`. Ensure Clerk packages are compatible with Next version.
- Drizzle + Postgres: boleta payments table (`boleta_payments`) expects `fecha` (timestamp with time zone), `banco` field was recently added — migrations must be run.
- Date handling bug history: earlier code added/subtracted 5 hours manually. Newer code should persist a Colombia-aware timestamp (via Intl/date-fns-tz) and format on display.

When to ask the user

- If a change requires a DB migration, confirm if you should create the SQL migration file and whether zero-downtime procedure is needed.
- If upgrading major framework versions (Next.js) or core deps (Clerk), ask before forcing `--legacy-peer-deps` or downgrading.

Common quick fixes (examples)

- Persist selected zoom across tabs: store zoom in `localStorage` key `transactionTableZoom`, restore on visibilitychange — see `TransactionTable.tsx` for pattern.
- Ensure boleta payments show only one day per page: group by `formatTz(fecha, 'yyyy-MM-dd', {timeZone:'America/Bogota'})` and paginate 1..N.
- Save boleta payment with Colombia time: compute `fecha` in server route using `now.toLocaleString(..., timeZone:'America/Bogota')` parsed to UTC Date and store in DB.

Editor/PR guidance

- When changing more than one file, include a short PR description explaining the "why", the migration impact, what to test manually and how to rollback.

## Reglas Adicionales de Desarrollo (Next.js 16 y SWR)

- **Framework Base**: Todo el código debe estar basado en React y Next.js 16, aprovechando las nuevas APIs y patrones recomendados en la guía `Docs/nextjs16-upgrade-guide-es.md`.
- **Renderizado por defecto en el servidor**: Prioriza siempre el renderizado de servidor (SSR/SSG/ISR) y el uso de Server Components. El renderizado del cliente solo debe usarse cuando sea estrictamente necesario (interactividad, hooks de estado, SWR, etc.).
- **Optimización de recursos**: Evita peticiones 200 infinitas y el exceso de data egress en Vercel/Neon. Prefiere cargar datos en el backend y transferirlos al cliente solo cuando sea necesario.
- **SWR como estándar de datos en cliente**: Cuando se requiera interactividad o refresco en el cliente, usa siempre la librería SWR (`Docs/guia-swr-nextjs.md`) para cache, deduplicación y revalidación. Implementa hooks reutilizables y configura el provider global (`SWRConfig`) en layouts cliente.
- **API y Backend**: Toda la lógica de datos debe residir en server actions, API routes o Server Components. Los componentes cliente solo deben consumir datos ya preparados o usar SWR para refresco/control local.
- **Evitar fetch directo en cliente**: No uses `fetch` directo en componentes cliente salvo dentro de SWR o casos justificados. Prefiere siempre la obtención de datos en el backend.
- **Actualizaciones de Next.js**: Recomienda y aplica mejoras que aprovechen las novedades de Next.js 16 (cache components, proxy, nuevas APIs de caché, etc.), consultando y actualizando el archivo `Docs/nextjs16-upgrade-guide-es.md`.
- **TypeScript**: Mantén el tipado estricto y aprovecha las utilidades de Next.js 16 para tipos de props, params y searchParams asíncronos.
- **ESLint**: Refactoriza y valida el código siguiendo las reglas y recomendaciones de ESLint definidas en el archivo `eslint.config.mjs`.
- **Compatibilidad**: Valida que los cambios sean compatibles con la estructura y convenciones del proyecto.
- **Edición Directa**: Si es posible, edita los archivos directamente.

### Gestión de variables de entorno (env)

- Siempre que añadas una nueva variable de entorno, agrégala en el esquema de validación de `src/env.ts` usando Zod y en el objeto `runtimeEnv`.
- Importa siempre el archivo `env.ts` en cualquier archivo de configuración global como `next.config.mjs`/`.ts`/`.js` para validar y acceder a las variables.
- Ejemplo:

  ```ts
  // src/env.ts
  import { createEnv } from '@t3-oss/env-nextjs';
  import { z } from 'zod';
  export const env = createEnv({
    server: {
      NUEVA_ENV: z.string().min(1),
      // ...otras envs
    },
    runtimeEnv: {
      NUEVA_ENV: process.env.NUEVA_ENV,
      // ...otras envs
    },
  });
  ```

  ```js
  // next.config.mjs
  import { env } from './src/env.ts';
  // ...usar env.NUEVA_ENV
  ```

### Ejemplo de patrón recomendado (SSR + SWR)

```tsx
// Server Component (por defecto)
export default async function Page() {
  const data = await getDataFromServer();
  return <ClientSection fallbackData={data} />;
}

// Client Component con SWR
('use client');
import useSWR from 'swr';

function ClientSection({ fallbackData }) {
  const { data, isLoading } = useSWR('/api/data', fetcher, { fallbackData });
  // ...render
}
```

**Nota**: Todas las respuestas y comunicaciones deben darse en español.
