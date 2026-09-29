// localStorage 구현. 노트 하나를 키 하나에 저장한다 ("note:v1:<id>").

import { isNoteRecord, type NoteRecord, type NoteStore } from './store'

const KEY_PREFIX = 'note:v1:'

export class LocalStorageStore implements NoteStore {
  // localStorage 접근 자체가 예외를 던질 수 있어(사이트 데이터 차단 등) 호출 시점마다 가져온다
  #storage(): Storage {
    return window.localStorage
  }

  async loadAll(): Promise<NoteRecord[]> {
    const storage = this.#storage()
    const notes: NoteRecord[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key?.startsWith(KEY_PREFIX)) continue
      const note = parseRecord(storage.getItem(key))
      // 키와 레코드의 id가 어긋난 것도 손상으로 보고 건너뛴다
      if (note && KEY_PREFIX + note.id === key) notes.push(note)
    }
    return notes
  }

  async put(note: NoteRecord): Promise<void> {
    this.#storage().setItem(KEY_PREFIX + note.id, JSON.stringify(note))
  }

  async remove(id: string): Promise<void> {
    this.#storage().removeItem(KEY_PREFIX + id)
  }
}

function parseRecord(raw: string | null): NoteRecord | null {
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    return isNoteRecord(value) ? value : null
  } catch {
    return null
  }
}
