// 노트·폴더 저장소 인터페이스와 저장 레코드 형식. 저장소 구현은 이 인터페이스 뒤에서만 바꾼다.

export const SCHEMA_VERSION = 1

// 제목·미리보기 문장·HTML은 source에서 파생하므로 저장하지 않는다
export type NoteRecord = {
  schema: typeof SCHEMA_VERSION
  id: string
  folderId: string
  // 태그 이름. 붙인 순서다. 태그는 따로 저장하지 않고 노트에 붙어 있을 때만 존재한다
  tags: string[]
  source: string
  // ISO 8601 문자열. 문자열 비교로 시간순 정렬할 수 있다
  updatedAt: string
}

// 모든 메서드는 비동기다. 동기 저장소(localStorage)도 같은 모양을 지켜야 비동기 저장소로 바꿀 때 호출부가 그대로다.
// 주의: pagehide 안에서 시작한 비동기 작업은 끝난다는 보장이 없다. 지금 구현은 put을 호출하는 순간 동기로 쓰므로 괜찮지만,
// 비동기 저장소로 바꾸면 visibilitychange(hidden) 시점의 저장을 주 계기로 삼아야 한다.
export interface NoteStore {
  // 읽을 수 없거나 모르는 형식의 레코드는 건너뛰고, 지우거나 고치지 않는다
  loadAll(): Promise<NoteRecord[]>
  // 실패하면 reject한다 (용량 초과, 저장소 차단 등)
  put(note: NoteRecord): Promise<void>
  remove(id: string): Promise<void>
}

export function isNoteRecord(value: unknown): value is NoteRecord {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.schema === SCHEMA_VERSION &&
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.folderId === 'string' &&
    Array.isArray(v.tags) &&
    v.tags.every((tag) => typeof tag === 'string') &&
    typeof v.source === 'string' &&
    typeof v.updatedAt === 'string' &&
    !Number.isNaN(Date.parse(v.updatedAt))
  )
}

// 노트는 folderId로 폴더를 가리킨다. '' 또는 없는 폴더 id면 "폴더 없음"이다
export type FolderRecord = {
  schema: typeof SCHEMA_VERSION
  id: string
  name: string
}

// NoteStore와 같은 규칙을 따른다
export interface FolderStore {
  loadAllFolders(): Promise<FolderRecord[]>
  putFolder(folder: FolderRecord): Promise<void>
  removeFolder(id: string): Promise<void>
}

export function isFolderRecord(value: unknown): value is FolderRecord {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.schema === SCHEMA_VERSION &&
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.name === 'string' &&
    v.name.trim() !== ''
  )
}
