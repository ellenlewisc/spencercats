export interface CatImage {
  key: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface CatPage {
  cats: CatImage[];
  nextCursor: string | null;
}

export interface ApiError {
  error: string;
}

type CatImageRow = {
  id: number;
  key: string;
  storage_path: string;
  caption: string | null;
  uploaded_at: string;
};

export type Database = {
  public: {
    Tables: {
      CatImages: {
        Row: CatImageRow;
        Insert: Pick<CatImageRow, "key" | "storage_path"> & Partial<Pick<CatImageRow, "caption" | "uploaded_at">>;
        Update: Partial<Pick<CatImageRow, "caption">>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
