// 폴더 데이터 상태. 부팅 때 저장소에서 불러온 폴더로 initFolders()가 채운다.
// 폴더 삭제는 안의 노트를 옮기는 일이 먼저라 notes.svelte.ts의 deleteFolder()가 맡는다.

import { SvelteMap } from 'svelte/reactivity'
import { SCHEMA_VERSION, type FolderRecord, type FolderStore } from './persistence/store'

export class Folder {
  readonly id: string
  name = $state('')

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
  }
}

// 사이드바의 고정 항목 이름과 겹치면 구분할 수 없어 받지 않는다
const RESERVED_NAMES = ['전체 노트', '폴더 없음']

export type FolderNameError = 'empty' | 'duplicate' | 'reserved'

// folderById에는 addFolder/removeFolderFromMemory로만 넣고 뺀다
export const folderById = new SvelteMap<string, Folder>()
let store: FolderStore | undefined

const collator = new Intl.Collator('ko')
const sorted = $derived([...folderById.values()].sort((a, b) => collator.compare(a.name, b.name)))

// 가나다순
export function sortedFolders(): Folder[] {
  return sorted
}

// 화면을 마운트하기 전에 한 번 부른다
export function initFolders(records: FolderRecord[], folderStore: FolderStore) {
  for (const record of records) addFolder(new Folder(record.id, record.name))
  store = folderStore
}

function addFolder(folder: Folder) {
  folderById.set(folder.id, folder)
}

export function removeFolderFromMemory(id: string) {
  folderById.delete(id)
}

function normalize(name: string) {
  return name.trim().toLocaleLowerCase('ko')
}

// exceptId는 이름 바꾸기에서 자기 자신을 중복으로 보지 않게 한다
export function validateFolderName(name: string, exceptId?: string): FolderNameError | null {
  const trimmed = name.trim()
  if (trimmed === '') return 'empty'
  if (RESERVED_NAMES.includes(trimmed)) return 'reserved'
  const key = normalize(trimmed)
  for (const folder of folderById.values()) {
    if (folder.id !== exceptId && normalize(folder.name) === key) return 'duplicate'
  }
  return null
}

function toRecord(id: string, name: string): FolderRecord {
  return { schema: SCHEMA_VERSION, id, name }
}

// 한 브라우저 안에서만 쓰는 id라 randomUUID가 없으면 대체값으로 충분하다
function newFolderId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// 이름은 validateFolderName을 통과했다고 본다. 저장에 실패하면 메모리를 바꾸지 않고 throw한다
export async function createFolder(name: string): Promise<string> {
  if (!store) throw new Error('folder store not ready')
  const folder = new Folder(newFolderId(), name.trim())
  await store.putFolder(toRecord(folder.id, folder.name))
  addFolder(folder)
  return folder.id
}

export async function renameFolder(id: string, name: string) {
  const folder = folderById.get(id)
  if (!folder || !store) return
  const trimmed = name.trim()
  await store.putFolder(toRecord(id, trimmed))
  folder.name = trimmed
}

export async function removeFolderRecord(id: string) {
  if (!store) throw new Error('folder store not ready')
  await store.removeFolder(id)
}
