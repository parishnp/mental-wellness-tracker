import type { Dataset, DatasetId } from "@/types/domain";
import before from "@/data/seed-before.json";
import after from "@/data/seed-after.json";

const MAP: Record<DatasetId, Dataset> = {
  before: before as unknown as Dataset,
  after: after as unknown as Dataset,
};

export function isDatasetId(value: unknown): value is DatasetId {
  return value === "before" || value === "after";
}

export function loadDataset(id: DatasetId): Dataset {
  return MAP[id] ?? MAP.before;
}
