export { Base } from "./base.js";
export { Git } from "./git.js";
export type { Hits } from "./types.js";
import { Hits } from "./types.js";

export function createHits(date: Date, total: number): Hits {
  return { date, total };
}
