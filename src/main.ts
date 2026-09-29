import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initFolders } from './lib/folders.svelte'
import { initNotes } from './lib/notes.svelte'
import { LocalStorageStore } from './lib/persistence/local-storage-store'
import type { FolderRecord, NoteRecord } from './lib/persistence/store'

const store = new LocalStorageStore()

async function loadNotes(): Promise<NoteRecord[]> {
  try {
    return await store.loadAll()
  } catch {
    // 저장소를 쓸 수 없는 환경: 빈 목록으로 띄우고, 새 노트를 쓰면 쓰기 실패로 드러난다
    return []
  }
}

// 한쪽을 읽지 못해도 다른 쪽은 쓴다. 폴더를 못 읽으면 모든 노트가 폴더 없음으로 보인다
async function loadFolders(): Promise<FolderRecord[]> {
  try {
    return await store.loadAllFolders()
  } catch {
    return []
  }
}

const [noteRecords, folderRecords] = await Promise.all([loadNotes(), loadFolders()])
initFolders(folderRecords, store)
initNotes(noteRecords, store)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
