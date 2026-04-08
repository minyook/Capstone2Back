import type { FolderRecord, TrashedFolderRecord } from "./folderTypes";



const STORAGE_KEY = "overnight-folders-v1";

const TRASH_KEY = "overnight-folders-trash-v1";



/** 최초 방문 시에만 시드(키가 없을 때) */

export const FOLDERS_SEED: FolderRecord[] = [

  { id: "seed-capstone", name: "캡스톤 디자인1", createdAt: "2024-04-06T05:12:00.000Z" },

  { id: "seed-mid", name: "중간 발표", createdAt: "2024-03-15T01:30:00.000Z" },

];



function isFolderRecord(x: unknown): x is FolderRecord {

  if (!x || typeof x !== "object") return false;

  const o = x as Record<string, unknown>;

  return (

    typeof o.id === "string" &&

    typeof o.name === "string" &&

    typeof o.createdAt === "string" &&

    o.id.length > 0 &&

    o.name.trim().length > 0

  );

}



function isTrashedFolderRecord(x: unknown): x is TrashedFolderRecord {

  if (!isFolderRecord(x)) return false;

  const o = x as Record<string, unknown>;

  return typeof o.deletedAt === "string" && o.deletedAt.length > 0;

}



export function loadFoldersFromStorage(): FolderRecord[] {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) return [...FOLDERS_SEED];

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [...FOLDERS_SEED];

    return parsed.filter(isFolderRecord);

  } catch {

    return [...FOLDERS_SEED];

  }

}



export function saveFoldersToStorage(folders: FolderRecord[]): void {

  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));

}



export function loadTrashFromStorage(): TrashedFolderRecord[] {

  try {

    const raw = localStorage.getItem(TRASH_KEY);

    if (raw === null) return [];

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTrashedFolderRecord);

  } catch {

    return [];

  }

}



export function saveTrashToStorage(trash: TrashedFolderRecord[]): void {

  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));

}



export function newFolderId(): string {

  if (typeof crypto !== "undefined" && crypto.randomUUID) {

    return crypto.randomUUID();

  }

  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

}



export function formatFolderDate(iso: string): string {

  try {

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) return "—";

    const y = d.getFullYear();

    const m = String(d.getMonth() + 1).padStart(2, "0");

    const day = String(d.getDate()).padStart(2, "0");

    const h = String(d.getHours()).padStart(2, "0");

    const min = String(d.getMinutes()).padStart(2, "0");

    return `${y}-${m}-${day} ${h}:${min}`;

  } catch {

    return "—";

  }

}


