// localStorage 구현. 노트 하나, 폴더 하나를 각각 키 하나에 저장한다 ("note:v1:<id>", "folder:v1:<id>").

import {
  isFolderRecord,
  isNoteRecord,
  type FolderRecord,
  type FolderStore,
  type NoteRecord,
  type NoteStore,
} from './store'

const KEY_PREFIX = 'note:v1:'
const FOLDER_KEY_PREFIX = 'folder:v1:'

export class LocalStorageStore implements NoteStore, FolderStore {
  // localStorage 접근 자체가 예외를 던질 수 있어(사이트 데이터 차단 등) 호출 시점마다 가져온다
  #storage(): Storage {
    return window.localStorage
  }

  async loadAll(): Promise<NoteRecord[]> {
    return this.#loadPrefixed(KEY_PREFIX, isNoteRecord)
  }

  async put(note: NoteRecord): Promise<void> {
    this.#storage().setItem(KEY_PREFIX + note.id, JSON.stringify(note))
  }

  async remove(id: string): Promise<void> {
    this.#storage().removeItem(KEY_PREFIX + id)
  }

  async loadAllFolders(): Promise<FolderRecord[]> {
    return this.#loadPrefixed(FOLDER_KEY_PREFIX, isFolderRecord)
  }

  async putFolder(folder: FolderRecord): Promise<void> {
    this.#storage().setItem(FOLDER_KEY_PREFIX + folder.id, JSON.stringify(folder))
  }

  async removeFolder(id: string): Promise<void> {
    this.#storage().removeItem(FOLDER_KEY_PREFIX + id)
  }

  #loadPrefixed<T extends { id: string }>(prefix: string, isRecord: (value: unknown) => value is T): T[] {
    const storage = this.#storage()
    const records: T[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key?.startsWith(prefix)) continue
      const record = parseRecord(storage.getItem(key), isRecord)
      // 키와 레코드의 id가 어긋난 것도 손상으로 보고 건너뛴다
      if (record && prefix + record.id === key) records.push(record)
    }
    return records
  }
}

function parseRecord<T>(raw: string | null, isRecord: (value: unknown) => value is T): T | null {
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    return isRecord(value) ? value : null
  } catch {
    return null
  }
}
