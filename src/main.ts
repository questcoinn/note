import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initNotes } from './lib/notes.svelte'
import { LocalStorageStore } from './lib/persistence/local-storage-store'
import type { NoteRecord } from './lib/persistence/store'

const store = new LocalStorageStore()

async function loadNotes(): Promise<NoteRecord[]> {
  try {
    return await store.loadAll()
  } catch {
    // 저장소를 쓸 수 없는 환경: 빈 목록으로 띄우고, 새 노트를 쓰면 쓰기 실패로 드러난다
    return []
  }
}

initNotes(await loadNotes(), store)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
