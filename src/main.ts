import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { clock } from './lib/clock.svelte'
import { noteSeeds } from './lib/mock/data'
import { initNotes, seedsToRecordFormat } from './lib/notes.svelte'
import { LocalStorageStore } from './lib/persistence/local-storage-store'
import type { NoteRecord } from './lib/persistence/store'

const store = new LocalStorageStore()

async function loadNotes(): Promise<NoteRecord[]> {
  try {
    const { notes, hasAnyRecord } = await store.loadAll()
    // 읽을 수 없는 레코드만 있어도 seed를 쓰지 않는다. 손상된 레코드를 덮어쓰지 않기 위해서다
    if (hasAnyRecord) return notes
  } catch {
    // 저장소를 쓸 수 없는 환경: seed로 화면을 띄우고, 편집하면 쓰기 실패로 드러난다
    return seedsToRecordFormat(noteSeeds, new Date())
  }
  const seeded = seedsToRecordFormat(noteSeeds, new Date())
  // 첫 실행 기록이 실패해도 화면은 띄운다. 그 노트를 편집하면 다시 쓰기를 시도한다
  await Promise.allSettled(seeded.map((note) => store.put(note)))
  return seeded
}

initNotes(await loadNotes(), store)
// 시계는 모듈 로드 때 시각을 잡아 seed 시각보다 이르다. 그대로 두면 "3분 전"이 "2분 전"으로 보인다
clock.now = Date.now()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
