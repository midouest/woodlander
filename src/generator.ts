import {
  nameTable,
  communities,
  defaultPaths,
  buildingTable,
  inhabitantTable,
  problemTable,
  totalBuildings,
  totalClearings,
  totalCommunityClearings,
  totalInhabitants,
  totalProblems,
  defaultCorners,
  defaultOppositeCorners,
} from "./constants";
import { roll2D6Total } from "./roll";
import { findShortestPath } from "./search";
import { Clearing, Community, Woodland } from "./types";

type CommunityCounts = Map<Community, number>;

function generateCommunity(counts: CommunityCounts): Community {
  const freeCommunities = communities.filter(
    (community) => (counts.get(community) ?? 0) < totalCommunityClearings
  );
  const index = Math.floor(Math.random() * freeCommunities.length);
  return freeCommunities[index];
}

function generateName(usedNames: Set<string>): string {
  const freeNames = nameTable.filter((name) => !usedNames.has(name));
  const index = Math.floor(Math.random() * freeNames.length);
  return freeNames[index];
}

function generateFromTable(table: string[], usedValues: Set<string>): string {
  const freeValues = table.filter((value) => !usedValues.has(value));
  const index = Math.floor(Math.random() * freeValues.length);
  return freeValues[index];
}

function generateInhabitants(usedInhabitants: Set<string>): string[] {
  return Array.from({ length: totalInhabitants }).map(() => {
    const inhabitant = generateFromTable(inhabitantTable, usedInhabitants);
    usedInhabitants.add(inhabitant);
    return inhabitant;
  });
}

function generateBuildings(usedBuildings: Set<string>): string[] {
  return Array.from({ length: totalBuildings }).map(() => {
    const building = generateFromTable(buildingTable, usedBuildings);
    usedBuildings.add(building);
    return building;
  });
}

function generateProblems(usedProblems: Set<string>): string[] {
  return Array.from({ length: totalProblems }).map(() => {
    const problem = generateFromTable(problemTable, usedProblems);
    usedProblems.add(problem);
    return problem;
  });
}

function generateInitialClearings(): Woodland {
  const communityCounts = new Map<Community, number>();
  const usedClearingNames = new Set<string>();
  const usedInhabitants = new Set<string>();
  const usedBuildings = new Set<string>();
  const usedProblems = new Set<string>();

  const ids = [];
  const clearings: { [id: number]: Clearing } = {};
  for (let id = 0; id < totalClearings; id++) {
    const community = generateCommunity(communityCounts);
    const prevCount = communityCounts.get(community) ?? 0;
    communityCounts.set(community, prevCount + 1);

    const paths = defaultPaths[id].slice();
    const totalPaths = paths.length;

    const name = generateName(usedClearingNames);
    usedClearingNames.add(name);

    const inhabitants = generateInhabitants(usedInhabitants);
    const buildings = generateBuildings(usedBuildings);
    const problems = generateProblems(usedProblems);

    ids.push(id);
    const clearing: Clearing = {
      id,
      name,
      paths,
      totalPaths,
      community,
      inhabitants,
      buildings,
      problems,
      presence: [],
    };
    clearings[id] = clearing;
  }
  return { ids, clearings };
}

function generateStrongholdClearing(): number {
  const index = Math.floor(Math.random() * 4);
  return defaultCorners[index];
}

function generateMarquisateControl(distance: number): boolean {
  const roll = roll2D6Total();
  if (distance === 1) {
    return roll >= 5;
  } else if (distance === 2) {
    return roll >= 7;
  } else if (distance === 3) {
    return roll >= 10;
  } else if (distance === 4) {
    return roll === 12;
  }
  return false;
}

function generateMarquisate(woodland: Woodland): void {
  const strongholdID = generateStrongholdClearing();
  woodland.strongholdID = strongholdID;
  const strongholdClearing = woodland.clearings[strongholdID];
  strongholdClearing.presence.push({
    faction: "marquisate",
    stronghold: true,
  });

  const visited = new Set<number>([strongholdID]);
  let frontier = [...strongholdClearing.paths];

  while (frontier.length > 0) {
    const id = frontier.splice(0, 1)[0];
    if (visited.has(id)) {
      continue;
    }

    visited.add(id);
    const clearing = woodland.clearings[id];
    frontier = frontier.concat(...clearing.paths);
    const path = findShortestPath(woodland, strongholdID, id);
    const inControl = generateMarquisateControl(path.length - 1);
    if (inControl) {
      clearing.presence.push({
        faction: "marquisate",
        stronghold: false,
      });
    }
  }
}

function generateEyrieControl(
  distance: number
): { roost: boolean } | undefined {
  const roll = roll2D6Total();
  if (distance === 1) {
    return roll <= 5 ? undefined : { roost: roll >= 9 };
  }
  if (distance === 2) {
    return roll <= 8 ? undefined : { roost: roll >= 11 };
  }
  if (distance === 3) {
    return roll <= 10 ? undefined : { roost: roll === 12 };
  }
  return undefined;
}

function generateEyrie(woodland: Woodland): void {
  const strongholdID = woodland.strongholdID!;
  const initialRoostID = defaultOppositeCorners[strongholdID]!;

  const clearing = woodland.clearings[initialRoostID];
  clearing.presence.push({ faction: "eyrie", roost: true });

  const roostIDs = [initialRoostID];
  let numControl = 1;

  const visited = new Set<number>([initialRoostID]);
  let frontier = [...clearing.paths];

  while (numControl < 6 && frontier.length > 0) {
    const id = frontier.splice(0, 1)[0];
    if (visited.has(id) || id === woodland.strongholdID) {
      continue;
    }

    visited.add(id);
    const clearing = woodland.clearings[id];
    frontier = frontier.concat(...clearing.paths);
    const distance = roostIDs
      .map((roostID) => findShortestPath(woodland, roostID, id))
      .reduce(
        (distance, path) => Math.min(distance, path.length - 1),
        Infinity
      );
    const inControl = generateEyrieControl(distance);
    if (inControl) {
      numControl += 1;
      let roost = roostIDs.length < 4 && inControl.roost;
      if (roost) {
        roostIDs.push(id);
      }
      clearing.presence.push({ faction: "eyrie", roost });
    }
  }
}

function generateAllianceSympathy(clearing: Clearing): boolean {
  const roll = roll2D6Total();
  if (clearing.presence.length === 0) {
    return roll >= 9;
  }

  if (clearing.presence.length === 1) {
    return roll >= 11;
  }

  if (clearing.presence.length === 2) {
    return roll >= 8;
  }

  throw new Error("Unexpected presence when generating alliance sympathy");
}

function generateUprising(): { spread: boolean } | undefined {
  const roll = roll2D6Total();
  if (roll < 10) {
    return undefined;
  }

  return { spread: roll === 12 };
}

function generateAlliance(woodland: Woodland): void {
  const sympathyIDs = new Set<number>();

  for (const clearing of Object.values(woodland.clearings)) {
    const sympathy = generateAllianceSympathy(clearing);
    if (sympathy) {
      sympathyIDs.add(clearing.id);
    }
  }

  let uprisingID: number | undefined;

  for (const id of sympathyIDs) {
    const uprising = generateUprising();
    if (!uprising) {
      continue;
    }

    if (uprising.spread) {
      const clearing = woodland.clearings[id];
      for (const neighbor of clearing.paths) {
        sympathyIDs.add(neighbor);
      }
    }

    uprisingID = id;
    break;
  }

  for (const id of sympathyIDs) {
    const clearing = woodland.clearings[id];
    const uprising = id === uprisingID;
    clearing.presence.push({ faction: "alliance", uprising });
  }

  woodland.uprisingID = uprisingID;
}

function generateDenizenControl(): boolean {
  const roll = roll2D6Total();
  return roll >= 11;
}

function generateDenizens(woodland: Woodland): void {
  for (const clearing of Object.values(woodland.clearings)) {
    if (clearing.presence.length === 1) {
      continue;
    }
    const inControl = generateDenizenControl();
    if (inControl) {
      clearing.presence.push({
        faction: "denizen",
        community: clearing.community,
      });
    }
  }
}

export function generateWoodland(): Woodland {
  const woodland = generateInitialClearings();
  generateMarquisate(woodland);
  generateEyrie(woodland);
  generateAlliance(woodland);
  generateDenizens(woodland);
  return woodland;
}
