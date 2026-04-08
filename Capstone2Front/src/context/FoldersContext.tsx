import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from "react";

import type { FolderRecord, TrashedFolderRecord } from "../data/folderTypes";

import {

  loadFoldersFromStorage,

  loadTrashFromStorage,

  newFolderId,

  saveFoldersToStorage,

  saveTrashToStorage,

} from "../data/folderStorage";



type FoldersContextValue = {

  folders: FolderRecord[];

  trashFolders: TrashedFolderRecord[];

  /** 이름 trim, 비어 있으면 false */

  createFolder: (name: string) => boolean;

  /** 활성 목록에서 제거 후 휴지통으로 이동 */

  removeFolder: (id: string) => void;

  /** 휴지통 → 문서 목록으로 복구 */

  restoreFolder: (id: string) => void;

  /** 휴지통에서 영구 삭제 (복구 불가) */

  purgeFolder: (id: string) => void;

};



const FoldersContext = createContext<FoldersContextValue | null>(null);



export function FoldersProvider({ children }: { children: ReactNode }) {

  const [folders, setFolders] = useState<FolderRecord[]>(() => loadFoldersFromStorage());

  const [trashFolders, setTrashFolders] = useState<TrashedFolderRecord[]>(() => loadTrashFromStorage());



  useEffect(() => {

    saveFoldersToStorage(folders);

  }, [folders]);



  useEffect(() => {

    saveTrashToStorage(trashFolders);

  }, [trashFolders]);



  const createFolder = useCallback((name: string) => {

    const trimmed = name.trim();

    if (!trimmed || trimmed.length > 40) return false;

    const rec: FolderRecord = {

      id: newFolderId(),

      name: trimmed,

      createdAt: new Date().toISOString(),

    };

    setFolders((prev) => [rec, ...prev]);

    return true;

  }, []);



  const removeFolder = useCallback((id: string) => {

    let removed: FolderRecord | undefined;

    setFolders((prev) => {

      removed = prev.find((f) => f.id === id);

      return removed ? prev.filter((f) => f.id !== id) : prev;

    });

    if (removed) {

      const tr: TrashedFolderRecord = {

        ...removed,

        deletedAt: new Date().toISOString(),

      };

      setTrashFolders((t) => [tr, ...t]);

    }

  }, []);



  const restoreFolder = useCallback((id: string) => {

    let item: TrashedFolderRecord | undefined;

    setTrashFolders((prev) => {

      item = prev.find((f) => f.id === id);

      return item ? prev.filter((f) => f.id !== id) : prev;

    });

    if (item) {

      const rest: FolderRecord = {

        id: item.id,

        name: item.name,

        createdAt: item.createdAt,

      };

      setFolders((prev) => {

        if (prev.some((f) => f.id === rest.id)) return prev;

        return [rest, ...prev];

      });

    }

  }, []);



  const purgeFolder = useCallback((id: string) => {

    setTrashFolders((prev) => prev.filter((f) => f.id !== id));

  }, []);



  const value = useMemo(

    () => ({

      folders,

      trashFolders,

      createFolder,

      removeFolder,

      restoreFolder,

      purgeFolder,

    }),

    [folders, trashFolders, createFolder, removeFolder, restoreFolder, purgeFolder]

  );



  return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>;

}



export function useFolders(): FoldersContextValue {

  const ctx = useContext(FoldersContext);

  if (!ctx) {

    throw new Error("useFolders must be used within FoldersProvider");

  }

  return ctx;

}
