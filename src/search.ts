import { Woodland } from "./types";

interface ClearingPriority {
  id: number;
  distance: number;
}

export function findShortestPath(
  woodland: Woodland,
  sourceID: number,
  destinationID: number
): number[] {
  const distance = new Map<number, number>();
  distance.set(sourceID, 0);
  const previous = new Map<number, number>();
  const queue: ClearingPriority[] = [{ id: sourceID, distance: 0 }];

  for (const id of woodland.ids) {
    if (id !== sourceID) {
      distance.set(id, Infinity);
    }
  }

  while (queue.length > 0) {
    const u = queue.splice(0, 1)[0];
    if (u.id === destinationID) {
      break;
    }

    const clearing = woodland.clearings[u.id];
    for (const id of clearing.paths) {
      const alt = distance.get(u.id)! + 1;
      if (alt < distance.get(id)!) {
        distance.set(id, alt);
        previous.set(id, u.id);
        const priority = queue.find((p) => p.id === id);
        if (!priority) {
          queue.push({ id, distance: alt });
        } else {
          priority.distance = alt;
        }
        queue.sort((a, b) => a.distance - b.distance);
      }
    }
  }

  const path: number[] = [];
  let u: number | undefined = destinationID;
  while (u !== undefined) {
    path.splice(0, 0, u);
    u = previous.get(u);
  }

  return path;
}
