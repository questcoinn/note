<script lang="ts">
  import { tick } from 'svelte'
  import { deleteNote, flushNotes, markEdited, noteById, notes, saveStatusOf } from '../notes.svelte'
  import type { SavePhase } from '../persistence/autosave.svelte'
  import {
    listEmptyShowsNewNote,
    selectNote,
    startNewNote,
    ui,
    type EditorTab,
    type SaveStatus,
  } from '../ui-state.svelte'
  import ConfirmDialog from '../components/ConfirmDialog.svelte'
  import EmptyState from '../components/EmptyState.svelte'
  import FolderSelect from '../components/FolderSelect.svelte'
  import Icon from '../components/Icon.svelte'
  import MarkdownToolbarButton from '../components/MarkdownToolbarButton.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SaveStatusIndicator from '../components/SaveStatusIndicator.svelte'

  // 저장 대기와 쓰기 진행은 둘 다 "저장 중"으로 보인다 (design.md D8)
  const statusByPhase: Record<SavePhase, SaveStatus> = {
    saved: 'saved',
    pending: 'saving',
    writing: 'saving',
    failed: 'unsaved',
  }

  const note = $derived(ui.selectedNoteId ? noteById.get(ui.selectedNoteId) : undefined)
  const saveStatus = $derived(note ? statusByPhase[saveStatusOf(note.id)] : 'saved')
  const tabId = $props.id()

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'edit', label: '편집' },
    { id: 'preview', label: '미리보기' },
  ]
  const toolbar = ['bold', 'italic', 'heading', 'link', 'list', 'code'] as const

  let source: HTMLTextAreaElement | undefined = $state()

  // "새 노트"를 누를 때마다 원문으로 포커스한다. 좁은 화면에서 목록이 사라지고 원문이 그려진 뒤에 옮긴다
  $effect(() => {
    if (ui.focusSourceRequest === 0) return
    void tick().then(() => source?.focus())
  })

  function openDeleteDialog() {
    ui.deleteError = false
    ui.deleteDialogOpen = true
  }

  // 성공하면 선택을 풀고 목록으로 포커스를 옮긴다. 실패하면 다이얼로그를 연 채 문구를 보인다 (design.md D5)
  async function confirmDelete() {
    if (!note) return
    try {
      await deleteNote(note.id)
    } catch {
      ui.deleteError = true
      return
    }
    ui.deleteDialogOpen = false
    selectNote(null)
    await tick()
    document.getElementById('note-list-title')?.focus()
  }

  // Cmd/Ctrl+S는 노트 선택 여부와 관계없이 브라우저의 페이지 저장 대신 바로 저장한다
  function onkeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault()
      flushNotes()
    }
  }

  // 탭이 가려지거나 페이지를 떠날 때 기다리지 않고 저장한다
  function onvisibilitychange() {
    if (document.visibilityState === 'hidden') flushNotes()
  }
</script>

<svelte:window {onkeydown} onpagehide={() => flushNotes()} />
<svelte:document {onvisibilitychange} />

{#snippet newNoteAction()}
  <PrimaryButton icon="plus" onclick={startNewNote}>새 노트</PrimaryButton>
{/snippet}

<section class="editor-pane" aria-label="노트 편집">
  {#if !note}
    <div class="empty">
      <!-- 목록 빈 상태(노트 없음, 빈 폴더)가 "새 노트"를 보여주면 여기서는 버튼을 빼 중복을 줄인다 -->
      <EmptyState
        icon="file-text"
        title="노트를 선택하거나 새로 만들어 보세요"
        action={listEmptyShowsNewNote() ? undefined : newNoteAction}
      />
    </div>
  {:else}
    <header class="topbar">
      <button type="button" class="icon-button back" aria-label="목록으로" onclick={() => selectNote(null)}>
        <Icon name="arrow-left" />
      </button>
      <FolderSelect {note} />
      <SaveStatusIndicator status={saveStatus} />
      <button type="button" class="icon-button delete" aria-label="노트 삭제" onclick={openDeleteDialog}>
        <Icon name="trash" />
      </button>
    </header>

    <div class="toolbar" role="toolbar" aria-label="서식">
      {#each toolbar as variant (variant)}
        <MarkdownToolbarButton {variant} />
      {/each}
    </div>

    <div class="tabs" role="tablist" aria-label="보기 전환">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          role="tab"
          id="{tabId}-{tab.id}-tab"
          class="tab"
          aria-selected={ui.editorTab === tab.id}
          aria-controls="{tabId}-{tab.id}"
          onclick={() => (ui.editorTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="panes" data-tab={ui.editorTab}>
      <div id="{tabId}-edit" class="pane source-pane" role="tabpanel" aria-labelledby="{tabId}-edit-tab">
        <label class="visually-hidden" for="{tabId}-source">마크다운 원문</label>
        <textarea
          id="{tabId}-source"
          bind:this={source}
          class="source"
          spellcheck="false"
          bind:value={note.source}
          oninput={() => note && markEdited(note)}
        ></textarea>
      </div>
      <!-- note.html은 사용자 입력에서 만들어지지만 markdown/render.ts에서 DOMPurify로 정화된 값이다. 정화를 거치지 않은 HTML을 여기에 넣지 말 것 -->
      <div id="{tabId}-preview" class="pane preview" role="tabpanel" aria-labelledby="{tabId}-preview-tab">
        {@html note.html}
      </div>
    </div>

    <ConfirmDialog
      bind:open={ui.deleteDialogOpen}
      title="‘{note.title}’ 노트가 영구히 삭제돼요"
      description="삭제한 노트는 되돌릴 수 없어요."
      confirmLabel={ui.deleteError ? '다시 삭제' : '삭제'}
      error={ui.deleteError ? '노트를 삭제하지 못했어요. 다시 시도해 주세요.' : undefined}
      onconfirm={confirmDelete}
    />
  {/if}
</section>

<style>
  .editor-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--color-canvas);
  }

  .empty {
    display: grid;
    place-items: center;
    flex: 1;
  }

  /* 좁은 폭에서는 폴더 선택 때문에 줄이 넘치면 다음 줄로 내린다 */
  .topbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .topbar :global(.save-status) {
    flex: 1;
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
    background: var(--color-surface);
  }

  /* 헤더가 줄바꿈되어도 삭제 버튼은 오른쪽 끝에 둔다 */
  .delete {
    margin-left: auto;
  }

  .delete:hover {
    color: var(--color-danger);
  }

  .back {
    display: none;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-lg) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .tabs {
    display: none;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) var(--spacing-lg) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .tab {
    min-height: 44px;
    padding: 0 var(--spacing-lg);
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--color-body);
    font-weight: 600;
  }

  .tab:hover {
    color: var(--color-foreground);
  }

  .tab[aria-selected='true'] {
    border-bottom-color: var(--color-primary);
    color: var(--color-weak-foreground);
  }

  .panes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    flex: 1;
    min-height: 0;
  }

  .pane {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
  }

  .source-pane {
    display: flex;
    border-right: 1px solid var(--color-border);
  }

  .source {
    flex: 1;
    width: 100%;
    padding: var(--spacing-xl);
    border: none;
    background: var(--color-canvas);
    color: var(--color-foreground);
    font-family: var(--font-mono);
    font-size: var(--type-code-size);
    line-height: var(--type-code-line);
    resize: none;
  }

  .source:focus-visible {
    box-shadow: inset 0 0 0 2px var(--color-primary);
  }

  /* 미리보기 — DESIGN.md 타입 역할 */
  .preview {
    padding: var(--spacing-xl);
    color: var(--color-body);
    overflow-wrap: anywhere;
  }

  .preview :global(* + *) {
    margin-top: var(--spacing-lg);
  }

  .preview :global(li + li) {
    margin-top: var(--spacing-xs);
  }

  .preview :global(h1) {
    color: var(--color-foreground);
    font-size: var(--type-h1-size);
    font-weight: var(--type-h1-weight);
    line-height: var(--type-h1-line);
  }

  .preview :global(h2) {
    margin-top: var(--spacing-xxl);
    color: var(--color-foreground);
    font-size: var(--type-h2-size);
    font-weight: var(--type-h2-weight);
    line-height: var(--type-h2-line);
  }

  .preview :global(h3) {
    color: var(--color-foreground);
    font-size: var(--type-h3-size);
    font-weight: var(--type-h3-weight);
    line-height: var(--type-h3-line);
  }

  .preview :global(h4) {
    color: var(--color-foreground);
    font-size: var(--type-h4-size);
    font-weight: var(--type-h4-weight);
    line-height: var(--type-h4-line);
  }

  .preview :global(ul),
  .preview :global(ol) {
    padding-left: var(--spacing-xl);
  }

  /* 본문 속 링크는 4.5:1 대비를 위해 primary 대신 weak-foreground + 밑줄 */
  .preview :global(a) {
    color: var(--color-weak-foreground);
    text-underline-offset: 3px;
  }

  .preview :global(a:hover) {
    color: var(--color-primary-hover);
  }

  .preview :global(code) {
    padding: 2px var(--spacing-xs);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-foreground);
    font-family: var(--font-mono);
    font-size: var(--type-code-size);
  }

  .preview :global(pre) {
    padding: var(--spacing-lg);
    overflow-x: auto;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    line-height: var(--type-code-line);
  }

  .preview :global(pre code) {
    padding: 0;
    background: none;
  }

  .preview :global(blockquote) {
    padding-left: var(--spacing-lg);
    border-left: 3px solid var(--color-border);
  }

  .preview :global(strong) {
    color: var(--color-foreground);
    font-weight: 700;
  }

  /* 취소선도 본문이므로 muted로 흐리게 하지 않고 4.5:1을 유지한다 */
  .preview :global(s),
  .preview :global(del) {
    color: var(--color-body);
  }

  /* DESIGN.md에 h5/h6 역할이 없어 body / body-small 역할을 굵게 재사용한다 */
  .preview :global(h5) {
    color: var(--color-foreground);
    font-size: var(--type-body-size);
    font-weight: 600;
    line-height: var(--type-body-line);
  }

  .preview :global(h6) {
    color: var(--color-foreground);
    font-size: var(--type-body-small-size);
    font-weight: 600;
    line-height: var(--type-body-small-line);
  }

  .preview :global(hr) {
    border: 0;
    border-top: 1px solid var(--color-border);
  }

  .preview :global(.table-scroll) {
    max-width: 100%;
    overflow-x: auto;
  }

  .preview :global(table) {
    border-collapse: collapse;
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .preview :global(th),
  .preview :global(td) {
    padding: var(--spacing-md) var(--spacing-lg);
    border: 1px solid var(--color-border);
    text-align: left;
    /* .preview의 overflow-wrap: anywhere가 열을 한 글자 폭까지 줄이므로, 표에서는 어절 단위로만 줄바꿈하고 넘치면 가로 스크롤한다 */
    overflow-wrap: normal;
    word-break: keep-all;
  }

  .preview :global(th) {
    background: var(--color-surface);
    color: var(--color-foreground);
    font-weight: 600;
  }

  .preview :global(li.task) {
    list-style: none;
  }

  .preview :global(li.task input) {
    margin: 0 var(--spacing-md) 0 0;
    accent-color: var(--color-primary);
    vertical-align: -2px;
  }

  /* inline-block이라 위의 * + * 문단 간격이 걸리지 않게 여백을 지운다 */
  .preview :global(.image-alt) {
    display: inline-block;
    margin: 0;
    padding: 0 var(--spacing-sm);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-body);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  /* 1024px 미만: 편집/미리보기 탭 (design.md D7) */
  @media (max-width: 1023px) {
    .tabs {
      display: flex;
    }

    .panes {
      grid-template-columns: 1fr;
    }

    .source-pane {
      border-right: none;
    }

    .panes[data-tab='edit'] .preview,
    .panes[data-tab='preview'] .source-pane {
      display: none;
    }
  }

  @media (max-width: 767px) {
    .back {
      display: grid;
    }

    .preview,
    .source {
      padding: var(--spacing-lg);
    }
  }
</style>
