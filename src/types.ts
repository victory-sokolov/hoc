export interface Hits {
  date: Date;
  total: number;
}

export interface Options {
  dir: string;
  exclude?: string[];
  author?: string;
  format: "text" | "xml" | "json" | "int";
  since: string;
  before: string;
}
