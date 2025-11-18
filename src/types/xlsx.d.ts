declare module 'xlsx' {
  export interface WorkSheet {
    '!cols'?: { wch: number }[];
  }

  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: WorkSheet };
  }

  export const utils: {
    json_to_sheet: <T>(data: T[]) => WorkSheet;
    book_new: () => WorkBook;
    book_append_sheet: (wb: WorkBook, ws: WorkSheet, name: string) => void;
  };

  export function writeFile(wb: WorkBook, filename: string): void;
}
