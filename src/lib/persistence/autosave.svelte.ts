// 자동 저장 정책(대기, 최대 대기, 즉시 저장, 상태, 재시도). 저장소 구현과 무관하게 NoteStore 인터페이스만 쓴다.

import { SvelteMap } from 'svelte/reactivity'
import type { NoteRecord, NoteStore } from './store'

// 입력이 이만큼 멈추면 저장한다
const DEBOUNCE_MS = 500
// 계속 입력해도 첫 입력 뒤 이만큼 지나면 한 번은 저장한다
const MAX_WAIT_MS = 2000

// pending: 저장 대기, writing: 저장소에 쓰는 중, failed: 마지막 쓰기 실패
export type SavePhase = 'saved' | 'pending' | 'writing' | 'failed'

type Entry = {
  debounceTimer?: number
  maxWaitTimer?: number
  writing: boolean
  // 진행 중인 쓰기. cancel이 이것을 기다린다
  inFlight?: Promise<void>
  // 쓰는 도중 들어온 입력. 쓰기가 끝나면 한 번 더 저장한다
  dirtyDuringWrite: boolean
  // 쓰는 도중 flush 요청. 후속 저장을 기다리지 않고 바로 한다
  flushAfterWrite: boolean
  cancelled: boolean
}

export class AutosaveController {
  #store: NoteStore
  #snapshot: (id: string) => NoteRecord | undefined
  #entries = new Map<string, Entry>()
  // 화면이 읽는 상태. 항목이 없으면 saved다
  #phases = new SvelteMap<string, SavePhase>()

  constructor(store: NoteStore, snapshot: (id: string) => NoteRecord | undefined) {
    this.#store = store
    this.#snapshot = snapshot
  }

  statusOf(id: string): SavePhase {
    return this.#phases.get(id) ?? 'saved'
  }

  // 편집이 일어났음을 알린다
  schedule(id: string) {
    const entry = this.#entry(id)
    if (entry.writing) {
      entry.dirtyDuringWrite = true
      return
    }
    this.#phases.set(id, 'pending')
    this.#startTimers(id, entry)
  }

  // 대기 중이거나 실패한 저장을 바로 한다. id가 없으면 모든 노트
  flush(id?: string) {
    const ids = id === undefined ? [...this.#entries.keys()] : [id]
    for (const noteId of ids) {
      const entry = this.#entries.get(noteId)
      if (!entry) continue
      if (entry.writing) {
        if (entry.dirtyDuringWrite) entry.flushAfterWrite = true
        continue
      }
      const phase = this.statusOf(noteId)
      if (phase === 'pending' || phase === 'failed') void this.#write(noteId, entry)
    }
  }

  // 대기 중인 저장을 버린다. 진행 중인 쓰기가 끝날 때까지 기다리고, 그 뒤 후속 저장은 하지 않는다 (노트 삭제용).
  // 기다려야 비동기 저장소에서 늦게 끝난 쓰기가 지운 레코드를 되살리지 않는다
  async cancel(id: string): Promise<void> {
    const entry = this.#entries.get(id)
    if (!entry) return
    this.#clearTimers(entry)
    entry.cancelled = true
    this.#entries.delete(id)
    this.#phases.delete(id)
    await entry.inFlight
  }

  #entry(id: string): Entry {
    let entry = this.#entries.get(id)
    if (!entry) {
      entry = { writing: false, dirtyDuringWrite: false, flushAfterWrite: false, cancelled: false }
      this.#entries.set(id, entry)
    }
    return entry
  }

  #startTimers(id: string, entry: Entry) {
    window.clearTimeout(entry.debounceTimer)
    entry.debounceTimer = window.setTimeout(() => void this.#write(id, entry), DEBOUNCE_MS)
    entry.maxWaitTimer ??= window.setTimeout(() => void this.#write(id, entry), MAX_WAIT_MS)
  }

  #clearTimers(entry: Entry) {
    window.clearTimeout(entry.debounceTimer)
    window.clearTimeout(entry.maxWaitTimer)
    entry.debounceTimer = undefined
    entry.maxWaitTimer = undefined
  }

  // 노트당 쓰기는 한 번에 하나다. 늦게 끝난 옛 쓰기가 새 쓰기를 덮지 않게 한다
  async #write(id: string, entry: Entry) {
    if (entry.writing || entry.cancelled) return
    this.#clearTimers(entry)
    const snapshot = this.#snapshot(id)
    if (!snapshot) return

    entry.writing = true
    this.#phases.set(id, 'writing')
    let failed = false
    // put은 여기서 동기로 호출된다. pagehide 중 flush가 저장소 호출까지 마치는 근거다
    entry.inFlight = this.#store.put(snapshot).then(
      () => {},
      () => {
        failed = true
      },
    )
    await entry.inFlight
    entry.inFlight = undefined
    entry.writing = false
    if (entry.cancelled) return

    if (entry.dirtyDuringWrite) {
      entry.dirtyDuringWrite = false
      this.#phases.set(id, 'pending')
      if (entry.flushAfterWrite) {
        entry.flushAfterWrite = false
        void this.#write(id, entry)
      } else {
        this.#startTimers(id, entry)
      }
      return
    }
    this.#phases.set(id, failed ? 'failed' : 'saved')
  }
}
