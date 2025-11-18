'use server';

import { revalidatePath } from 'next/cache';

export interface AsesorSelectionResult {
  success: boolean;
  error?: string;
}

export async function toggleAsesorSelectionAction(): Promise<AsesorSelectionResult> {
  try {
    // Simular una operación asíncrona
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Revalidar la ruta para asegurar que los cambios se reflejen
    revalidatePath('/');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error toggling asesor selection:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error al cambiar modo de selección',
    };
  }
}
