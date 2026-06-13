import type { Dataset, DatasetId } from "@/types/domain";
import { parseDataset } from "@/lib/data/schema";
import before from "@/data/seed-before.json";
import after from "@/data/seed-after.json";

// Validate once at module load — drift in the seed files fails fast here.
const MAP: Record<DatasetId, Dataset> = {
  before: parseDataset(before),
  after: parseDataset(after),
};

export function isDatasetId(value: unknown): value is DatasetId {
  return value === "before" || value === "after";
}

export function loadDataset(id: DatasetId): Dataset {
  return MAP[id] ?? MAP.before;
}
