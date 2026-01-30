/**
 * Local-first storage using IndexedDB
 * Stores projects and files locally before user authentication
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// === Types ===
export interface LocalFile {
    id: string;
    name: string;
    content: string;
    fileType: 'md' | 'dfy' | 'unit';
    createdAt: Date;
    updatedAt: Date;
}

export interface LocalProject {
    id: string;
    name: string;
    description?: string;
    files: LocalFile[];
    createdAt: Date;
    updatedAt: Date;
    syncedAt: Date | null;
    cloudId: string | null;
}

export interface SyncQueueItem {
    id: string;
    projectId: string;
    action: 'create' | 'update' | 'delete';
    resource: 'project' | 'file';
    data: any;
    timestamp: Date;
}

// === IndexedDB Schema ===
interface GuardianDBSchema extends DBSchema {
    projects: {
        key: string;
        value: LocalProject;
        indexes: {
            'by-updated': Date;
            'by-name': string;
        };
    };
    syncQueue: {
        key: string;
        value: SyncQueueItem;
        indexes: {
            'by-timestamp': Date;
        };
    };
}

const DB_NAME = 'guardian-gateway';
const DB_VERSION = 1;

let db: IDBPDatabase<GuardianDBSchema> | null = null;

// === Database Initialization ===
async function getDB(): Promise<IDBPDatabase<GuardianDBSchema>> {
    if (db) return db;

    db = await openDB<GuardianDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Projects store
            const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
            projectStore.createIndex('by-updated', 'updatedAt');
            projectStore.createIndex('by-name', 'name');

            // Sync queue store
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('by-timestamp', 'timestamp');
        },
    });

    return db;
}

// === Project Operations ===

export async function createLocalProject(
    name: string,
    description?: string
): Promise<LocalProject> {
    const db = await getDB();
    const now = new Date();

    const project: LocalProject = {
        id: `local-${crypto.randomUUID()}`,
        name,
        description,
        files: [],
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
        cloudId: null,
    };

    await db.add('projects', project);
    return project;
}

export async function getLocalProject(id: string): Promise<LocalProject | undefined> {
    const db = await getDB();
    return await db.get('projects', id);
}

export async function listLocalProjects(): Promise<LocalProject[]> {
    const db = await getDB();
    return await db.getAllFromIndex('projects', 'by-updated');
}

export async function updateLocalProject(
    id: string,
    updates: Partial<Omit<LocalProject, 'id' | 'createdAt'>>
): Promise<LocalProject> {
    const db = await getDB();
    const project = await db.get('projects', id);

    if (!project) {
        throw new Error(`Project ${id} not found`);
    }

    const updated: LocalProject = {
        ...project,
        ...updates,
        updatedAt: new Date(),
    };

    await db.put('projects', updated);
    return updated;
}

export async function deleteLocalProject(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('projects', id);
}

// === File Operations ===

export async function addFileToProject(
    projectId: string,
    name: string,
    content: string,
    fileType: 'md' | 'dfy' | 'unit'
): Promise<LocalFile> {
    const db = await getDB();
    const project = await db.get('projects', projectId);

    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    const now = new Date();
    const file: LocalFile = {
        id: `file-${crypto.randomUUID()}`,
        name,
        content,
        fileType,
        createdAt: now,
        updatedAt: now,
    };

    project.files.push(file);
    project.updatedAt = now;

    await db.put('projects', project);
    return file;
}

export async function updateFileInProject(
    projectId: string,
    fileId: string,
    updates: Partial<Omit<LocalFile, 'id' | 'createdAt'>>
): Promise<LocalFile> {
    const db = await getDB();
    const project = await db.get('projects', projectId);

    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    const fileIndex = project.files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) {
        throw new Error(`File ${fileId} not found`);
    }

    project.files[fileIndex] = {
        ...project.files[fileIndex],
        ...updates,
        updatedAt: new Date(),
    };
    project.updatedAt = new Date();

    await db.put('projects', project);
    return project.files[fileIndex];
}

export async function deleteFileFromProject(
    projectId: string,
    fileId: string
): Promise<void> {
    const db = await getDB();
    const project = await db.get('projects', projectId);

    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    project.files = project.files.filter(f => f.id !== fileId);
    project.updatedAt = new Date();

    await db.put('projects', project);
}

// === Sync Queue Operations ===

export async function addToSyncQueue(
    projectId: string,
    action: 'create' | 'update' | 'delete',
    resource: 'project' | 'file',
    data: any
): Promise<void> {
    const db = await getDB();

    const item: SyncQueueItem = {
        id: `sync-${crypto.randomUUID()}`,
        projectId,
        action,
        resource,
        data,
        timestamp: new Date(),
    };

    await db.add('syncQueue', item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return await db.getAllFromIndex('syncQueue', 'by-timestamp');
}

export async function clearSyncQueue(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.store.clear();
    await tx.done;
}

export async function removeSyncQueueItem(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('syncQueue', id);
}

// === Migration to Cloud ===

export async function markProjectAsSynced(
    localProjectId: string,
    cloudProjectId: string
): Promise<void> {
    await updateLocalProject(localProjectId, {
        cloudId: cloudProjectId,
        syncedAt: new Date(),
    });
}

export async function getUnsyncedProjects(): Promise<LocalProject[]> {
    const projects = await listLocalProjects();
    return projects.filter(p => p.cloudId === null);
}

// === Conflict Resolution ===

export async function resolveConflict(
    projectId: string,
    strategy: 'local' | 'cloud' | 'merge'
): Promise<void> {
    // TODO: Implement conflict resolution logic
    // This will be used when local and cloud versions diverge
    console.log(`Resolving conflict for ${projectId} with strategy: ${strategy}`);
}

// === Export/Import ===

export async function exportProject(id: string): Promise<string> {
    const project = await getLocalProject(id);
    if (!project) {
        throw new Error(`Project ${id} not found`);
    }
    return JSON.stringify(project, null, 2);
}

export async function importProject(jsonData: string): Promise<LocalProject> {
    const data = JSON.parse(jsonData);
    const db = await getDB();

    // Generate new ID to avoid conflicts
    const project: LocalProject = {
        ...data,
        id: `local-${crypto.randomUUID()}`,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(),
        syncedAt: data.syncedAt ? new Date(data.syncedAt) : null,
    };

    await db.add('projects', project);
    return project;
}
