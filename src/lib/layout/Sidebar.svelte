<script lang="ts">
  import { tick } from 'svelte'
  import { createFolder, folderById, renameFolder, sortedFolders } from '../folders.svelte'
  import { deleteFolder, notes } from '../notes.svelte'
  import { inScope, isSameScope, selectScope, startNewNote, ui, type Scope } from '../ui-state.svelte'
  import ConfirmDialog from '../components/ConfirmDialog.svelte'
  import FolderMenu from '../components/FolderMenu.svelte'
  import FolderNameDialog from '../components/FolderNameDialog.svelte'
  import Icon from '../components/Icon.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SidebarNavItem from '../components/SidebarNavItem.svelte'

  let closeButton: HTMLButtonElement | undefined = $state()
  let createButton: HTMLButtonElement
  // 폴더를 만든 뒤·이름을 바꾼 뒤 포커스를 옮길 항목 버튼과 메뉴 버튼
  const folderButtons: Record<string, HTMLButtonElement | undefined> = $state({})
  const menuButtons: Record<string, HTMLButtonElement | undefined> = $state({})
  // 방금 만든 폴더. 만들기 다이얼로그가 닫히면 이 항목으로, 없으면(취소) 만들기 버튼으로 포커스한다
  let createdId: string | null = null

  const ALL: Scope = { kind: 'all' }
  const UNFILED: Scope = { kind: 'unfiled' }

  const countIn = (scope: Scope) => notes.filter((note) => inScope(note, scope)).length

  let createOpen = $state(false)
  let renameOpen = $state(false)
  let deleteOpen = $state(false)
  let deleteFailed = $state(false)
  // 이름 바꾸기·삭제 대상 폴더
  let targetId: string | null = $state(null)
  const target = $derived(targetId ? folderById.get(targetId) : undefined)
  const targetCount = $derived(targetId ? countIn({ kind: 'folder', id: targetId }) : 0)

  // 오버레이에서 범위를 고르면 닫고 목록 제목으로 포커스를 옮긴다
  async function pick(scope: Scope) {
    selectScope(scope)
    if (!ui.sidebarOpen) return
    ui.sidebarOpen = false
    await tick()
    document.getElementById('note-list-title')?.focus()
  }

  // 만들기는 보던 범위를 바꾸지 않는다
  async function saveNewFolder(name: string) {
    createdId = await createFolder(name)
    createOpen = false
  }

  async function onCreateClosed() {
    const id = createdId
    createdId = null
    await tick()
    ;(id ? folderButtons[id] : createButton)?.focus()
  }

  function openRename(id: string) {
    targetId = id
    renameOpen = true
  }

  async function saveRename(name: string) {
    if (!targetId) return
    await renameFolder(targetId, name)
    renameOpen = false
  }

  // 저장해도 취소해도 그 폴더의 메뉴 버튼으로 돌아간다
  function onRenameClosed() {
    if (targetId) menuButtons[targetId]?.focus()
  }

  function openDelete(id: string) {
    targetId = id
    deleteFailed = false
    deleteOpen = true
  }

  // 보던 폴더를 지우면 전체 노트로 가고 목록 제목에, 아니면 만들기 버튼에 포커스한다 (design.md D6)
  async function confirmDelete() {
    if (!targetId) return
    const id = targetId
    const wasViewing = isSameScope(ui.scope, { kind: 'folder', id })
    try {
      await deleteFolder(id)
    } catch {
      deleteFailed = true
      return
    }
    deleteOpen = false
    await tick()
    if (wasViewing) {
      selectScope(ALL)
      ui.sidebarOpen = false
      await tick()
      document.getElementById('note-list-title')?.focus()
    } else {
      createButton.focus()
    }
  }

  const deleteDescription = $derived(
    targetCount > 0
      ? `안에 있는 노트 ${targetCount}개는 지워지지 않고 '폴더 없음'으로 옮겨져요.`
      : '이 폴더에는 노트가 없어요.',
  )

  function close() {
    ui.sidebarOpen = false
    document.getElementById('sidebar-toggle')?.focus()
  }

  // 오버레이가 열리면 닫기 버튼으로 포커스를 옮긴다
  $effect(() => {
    if (ui.sidebarOpen) closeButton?.focus()
  })

  function onkeydown(event: KeyboardEvent) {
    if (ui.sidebarOpen && event.key === 'Escape') close()
  }
</script>

<svelte:window {onkeydown} />

{#if ui.sidebarOpen}
  <!-- 키보드 사용자는 닫기 버튼과 Esc로 닫는다. 배경 클릭은 포인터 보조 수단 -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" aria-hidden="true" onclick={close}></div>
{/if}

<nav id="sidebar" class="sidebar" class:open={ui.sidebarOpen} aria-label="노트 탐색">
  <div class="top">
    <p class="app-name">노트</p>
    <button bind:this={closeButton} type="button" class="close" aria-label="메뉴 닫기" onclick={close}>
      <Icon name="x" />
    </button>
  </div>

  <PrimaryButton icon="plus" block onclick={startNewNote}>새 노트</PrimaryButton>

  <ul class="group">
    <li>
      <SidebarNavItem
        variant="all-notes"
        label="전체 노트"
        count={notes.length}
        active={isSameScope(ui.scope, ALL)}
        onclick={() => pick(ALL)}
      />
    </li>
    <li>
      <SidebarNavItem
        variant="unfiled"
        label="폴더 없음"
        count={countIn(UNFILED)}
        active={isSameScope(ui.scope, UNFILED)}
        onclick={() => pick(UNFILED)}
      />
    </li>
  </ul>

  <section aria-labelledby="folder-group-title">
    <div class="group-header">
      <h2 id="folder-group-title" class="group-title">폴더</h2>
      <button bind:this={createButton} type="button" class="icon-button" aria-label="새 폴더" onclick={() => (createOpen = true)}>
        <Icon name="plus" />
      </button>
    </div>
    <ul class="group">
      {#each sortedFolders() as folder (folder.id)}
        {@const scope: Scope = { kind: 'folder', id: folder.id }}
        <li>
          <SidebarNavItem
            bind:button={folderButtons[folder.id]}
            variant="folder"
            label={folder.name}
            count={countIn(scope)}
            active={isSameScope(ui.scope, scope)}
            onclick={() => pick(scope)}
          >
            {#snippet menu()}
              <FolderMenu
                bind:trigger={menuButtons[folder.id]}
                folderName={folder.name}
                onrename={() => openRename(folder.id)}
                ondelete={() => openDelete(folder.id)}
              />
            {/snippet}
          </SidebarNavItem>
        </li>
      {/each}
    </ul>
  </section>
</nav>

<FolderNameDialog
  bind:open={createOpen}
  title="새 폴더"
  confirmLabel="만들기"
  onsave={saveNewFolder}
  onclosed={onCreateClosed}
/>
<FolderNameDialog
  bind:open={renameOpen}
  title="폴더 이름 바꾸기"
  confirmLabel="저장"
  initialName={target?.name ?? ''}
  exceptId={targetId ?? undefined}
  onsave={saveRename}
  onclosed={onRenameClosed}
/>
<ConfirmDialog
  bind:open={deleteOpen}
  title="'{target?.name ?? ''}' 폴더를 삭제할까요?"
  description={deleteDescription}
  confirmLabel={deleteFailed ? '다시 삭제' : '삭제'}
  error={deleteFailed ? '폴더를 삭제하지 못했어요. 다시 시도해 주세요.' : undefined}
  onconfirm={confirmDelete}
/>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    height: 100%;
    padding: var(--spacing-xl) var(--spacing-lg);
    overflow-y: auto;
    background: var(--color-surface);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
  }

  .app-name {
    color: var(--color-foreground);
    font-size: 17px;
    font-weight: 700;
  }

  .close {
    display: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-body);
  }

  .close:hover {
    background: var(--color-border);
  }

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-md);
    padding-left: var(--spacing-md);
  }

  /* 폴더 그룹 제목은 h3 역할(24px) — .omd/preferences.md pref_mukrkreu_40ea79df */
  .group-title {
    color: var(--color-foreground);
    font-size: var(--type-h3-size);
    font-weight: var(--type-h3-weight);
    line-height: var(--type-h3-line);
  }

  .icon-button {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-body);
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .icon-button:hover {
    background: var(--color-border);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .scrim {
    display: none;
  }

  /* 1024px 미만: 그림자 없는 불투명 오버레이 (design.md D7·D8) */
  @media (max-width: 1023px) {
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 20;
      display: none;
      width: min(300px, 85vw);
      background: var(--color-canvas);
    }

    .sidebar.open {
      display: flex;
    }

    .close {
      display: grid;
    }

    .scrim {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: block;
      background: color-mix(in srgb, var(--color-foreground) 50%, transparent);
    }
  }
</style>
