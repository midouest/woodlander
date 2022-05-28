export type Community = "rabbit" | "mouse" | "fox";

export type Marquisate = "marquisate";
export type Eyrie = "eyrie";
export type Alliance = "alliance";
export type Denizen = "denizen";
export type Faction = Marquisate | Eyrie | Alliance | Denizen;

export interface MarquisatePresence {
  faction: Marquisate;
  stronghold: boolean;
}

export interface EyriePresence {
  faction: Eyrie;
  roost: boolean;
}

export interface AlliancePresence {
  faction: Alliance;
  uprising: boolean;
}

export interface DenizenPresence {
  faction: Denizen;
  community: Community;
}

export type FactionPresence =
  | MarquisatePresence
  | EyriePresence
  | AlliancePresence
  | DenizenPresence;

export interface Clearing {
  id: number;
  name: string;
  paths: number[];
  totalPaths: number;
  community: Community;
  inhabitants: string[];
  buildings: string[];
  problems: string[];
  presence: FactionPresence[];
}

export interface Woodland {
  ids: number[];
  clearings: { [id: number]: Clearing };
  strongholdID?: number;
  uprisingID?: number;
}
