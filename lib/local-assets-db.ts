"use client";

import type { LocalAssetRecord } from "@/lib/types";

const DB_NAME = "rblxuploads-local-assets";
const DB_VERSION = 1;
const ASSETS_STORE = "assets";
const FOLDERS_STORE = "folders";

const ROOT_FOLDER = "Library";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        const assetStore = db.createObjectStore(ASSETS_STORE, { keyPath: "id" });
        assetStore.createIndex("byAssetId", "assetId", { unique: false });
        assetStore.createIndex("byType", "type", { unique: false });
        assetStore.createIndex("byFolderPath", "folderPath", { unique: false });
        assetStore.createIndex("byCreatedAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
        const folderStore = db.createObjectStore(FOLDERS_STORE, { keyPath: "path" });
        folderStore.add({ path: ROOT_FOLDER, createdAt: Date.now() });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed opening IndexedDB."));
  });
}

export function normalizeFolderPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return ROOT_FOLDER;
  }
  return trimmed
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

export async function listLocalAssets(): Promise<LocalAssetRecord[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readonly");
    const store = transaction.objectStore(ASSETS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve((request.result ?? []) as LocalAssetRecord[]);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed loading local assets."));
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Failed reading local assets."));
    };
  });
}

export async function listLocalFolders(): Promise<string[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FOLDERS_STORE, "readonly");
    const store = transaction.objectStore(FOLDERS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const folders = (request.result ?? []) as Array<{ path: string }>;
      const unique = new Set<string>([ROOT_FOLDER]);
      folders.forEach((entry) => unique.add(normalizeFolderPath(entry.path)));
      resolve(Array.from(unique).sort((a, b) => a.localeCompare(b)));
    };
    request.onerror = () => {
      reject(request.error ?? new Error("Failed loading local folders."));
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Failed reading local folders."));
    };
  });
}

export async function upsertLocalFolder(folderPath: string): Promise<void> {
  const normalized = normalizeFolderPath(folderPath);
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(FOLDERS_STORE, "readwrite");
    const store = transaction.objectStore(FOLDERS_STORE);
    store.put({
      path: normalized,
      createdAt: Date.now(),
    });

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Failed writing folder."));
    };
  });
}

export async function upsertLocalAsset(asset: LocalAssetRecord): Promise<void> {
  const normalizedFolder = normalizeFolderPath(asset.folderPath);
  await upsertLocalFolder(normalizedFolder);

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readwrite");
    const store = transaction.objectStore(ASSETS_STORE);
    store.put({
      ...asset,
      folderPath: normalizedFolder,
      tags: Array.from(new Set(asset.tags.map((tag) => tag.trim()).filter(Boolean))),
      updatedAt: Date.now(),
    });

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Failed writing asset."));
    };
  });
}

export async function bulkUpsertLocalAssets(assets: LocalAssetRecord[]): Promise<void> {
  const folders = new Set<string>();
  for (const asset of assets) {
    folders.add(normalizeFolderPath(asset.folderPath));
  }

  for (const folder of folders) {
    await upsertLocalFolder(folder);
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readwrite");
    const store = transaction.objectStore(ASSETS_STORE);
    for (const asset of assets) {
      store.put({
        ...asset,
        folderPath: normalizeFolderPath(asset.folderPath),
        tags: Array.from(
          new Set(asset.tags.map((tag) => tag.trim()).filter(Boolean)),
        ),
        updatedAt: Date.now(),
      });
    }

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Failed writing imported assets."));
    };
  });
}

export async function removeLocalAssets(assetIds: string[]): Promise<void> {
  if (!assetIds.length) {
    return;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readwrite");
    const store = transaction.objectStore(ASSETS_STORE);
    for (const id of assetIds) {
      store.delete(id);
    }

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Failed deleting assets."));
    };
  });
}

export function getRootFolderPath(): string {
  return ROOT_FOLDER;
}
