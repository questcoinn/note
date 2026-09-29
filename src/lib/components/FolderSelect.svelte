<script lang="ts">
  import { sortedFolders } from '../folders.svelte'
  import { moveNote, type NoteDoc } from '../notes.svelte'

  let { note }: { note: NoteDoc } = $props()

  const id = $props.id()
</script>

<!-- 바꾸면 노트를 바로 옮긴다. 보던 범위 밖으로 옮겨도 에디터와 포커스는 그대로다 (design.md D4) -->
<div class="folder-select">
  <label for={id} class="label">폴더</label>
  <select
    {id}
    class="control"
    value={note.effectiveFolderId}
    onchange={(event) => moveNote(note, event.currentTarget.value)}
  >
    <option value="">폴더 없음</option>
    {#each sortedFolders() as folder (folder.id)}
      <option value={folder.id}>{folder.name}</option>
    {/each}
  </select>
</div>

<style>
  .folder-select {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
  }

  .label {
    flex-shrink: 0;
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .control {
    min-width: 0;
    max-width: 200px;
    min-height: 40px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-canvas);
    color: var(--color-foreground);
    text-overflow: ellipsis;
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .control:hover {
    border-color: var(--color-muted);
  }
</style>
