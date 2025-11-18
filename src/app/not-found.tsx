import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-3xl font-bold text-gray-800">
          Página no encontrada
        </h2>
        <p className="mb-6 text-gray-600">
          Lo sentimos, no pudimos encontrar la página que buscas.
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-amber-500 px-6 py-2 text-white transition-colors hover:bg-amber-600"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/cuadre"
            prefetch={false}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Ir al Cuadre
          </Link>
        </div>
      </div>
    </div>
  );
}
