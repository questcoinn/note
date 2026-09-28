<script lang="ts">
  import { notes } from '../mock/data'
  import { forced, ui, type EditorTab } from '../ui-state.svelte'
  import ConfirmDialog from '../components/ConfirmDialog.svelte'
  import EmptyState from '../components/EmptyState.svelte'
  import Icon from '../components/Icon.svelte'
  import MarkdownToolbarButton from '../components/MarkdownToolbarButton.svelte'
  import PrimaryButton from '../components/PrimaryButton.svelte'
  import SaveStatusIndicator from '../components/SaveStatusIndicator.svelte'

  const note = $derived(notes.find((item) => item.id === ui.selectedNoteId))
  const tabId = $props.id()

  const tabs: { id: EditorTab; label: string }[] = [
    { id: 'edit', label: '편집' },
    { id: 'preview', label: '미리보기' },
  ]
  const toolbar = ['bold', 'italic', 'heading', 'link', 'list', 'code'] as const
</script>

<section class="editor-pane" aria-label="노트 편집">
  {#if !note}
    <div class="empty">
      <EmptyState icon="file-text" title="노트를 선택하거나 새로 만들어 보세요">
        {#snippet action()}
          <PrimaryButton icon="plus">새 노트</PrimaryButton>
        {/snippet}
      </EmptyState>
    </div>
  {:else}
    <header class="topbar">
      <button type="button" class="icon-button back" aria-label="목록으로" onclick={() => (ui.selectedNoteId = null)}>
        <Icon name="arrow-left" />
      </button>
      <SaveStatusIndicator status={forced.save} />
      <button type="button" class="icon-button delete" aria-label="노트 삭제" onclick={() => (ui.deleteDialogOpen = true)}>
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
        <!-- 뼈대 단계: 입력해도 미리보기·목록·저장 상태가 바뀌지 않는다. 노트가 바뀌면 원문을 다시 채운다 -->
        {#key note.id}
          <textarea id="{tabId}-source" class="source" spellcheck="false" value={note.source}></textarea>
        {/key}
      </div>
      <!-- previewHtml은 저장소에 고정된 목업 문자열이다. 사용자 입력을 렌더링할 때는 반드시 sanitize할 것 -->
      <div id="{tabId}-preview" class="pane preview" role="tabpanel" aria-labelledby="{tabId}-preview-tab">
        {@html note.previewHtml}
      </div>
    </div>

    <ConfirmDialog
      bind:open={ui.deleteDialogOpen}
      title="‘{note.title}’ 노트가 영구히 삭제돼요"
      description="삭제한 노트는 되돌릴 수 없어요."
      confirmLabel="삭제"
      onconfirm={() => (ui.deleteDialogOpen = false)}
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

  .topbar {
    display: flex;
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
