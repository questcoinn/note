<script lang="ts">
  import { addTag, removeTag, tagSuggestions, type NoteDoc } from '../notes.svelte'
  import TagChip from './TagChip.svelte'

  let { note }: { note: NoteDoc } = $props()

  const id = $props.id()
  let value = $state('')
  let input: HTMLInputElement | undefined = $state()

  const suggestions = $derived(tagSuggestions(note))

  // Enter로만 붙인다. 입력기 조합을 확정하는 Enter는 무시하고, Backspace로는 떼지 않는다 (design.md D6).
  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.isComposing) return
    event.preventDefault()
    addTag(note, value)
    value = ''
  }

  // 누른 x 버튼이 사라지므로 입력창으로 포커스를 옮긴다
  function remove(tag: string) {
    removeTag(note, tag)
    input?.focus()
  }
</script>

<!-- 노트가 바뀌면 EditorPane이 {#key}로 다시 만들어 붙이지 않은 입력이 남지 않는다 -->
<div class="tag-input">
  <label for={id} class="label">태그</label>
  <input
    bind:this={input}
    bind:value
    {id}
    class="control"
    type="text"
    placeholder="태그 추가"
    autocomplete="off"
    list="{id}-suggestions"
    {onkeydown}
  />
  {#if note.tags.length > 0}
    <ul class="chips" aria-label="붙은 태그">
      {#each note.tags as tag (tag)}
        <li><TagChip label={tag} variant="removable" onremove={() => remove(tag)} /></li>
      {/each}
    </ul>
  {/if}
  <datalist id="{id}-suggestions">
    {#each suggestions as tag (tag)}
      <option value={tag}></option>
    {/each}
  </datalist>
</div>

<style>
  .tag-input {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
    padding: 0 var(--spacing-lg) var(--spacing-md);
  }

  .label {
    flex-shrink: 0;
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    min-width: 0;
    max-width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .chips li {
    min-width: 0;
    max-width: 100%;
  }

  .control {
    flex: 1 1 120px;
    min-width: 0;
    max-width: 240px;
    min-height: 32px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-canvas);
    color: var(--color-foreground);
    font-size: var(--type-body-small-size);
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .control::placeholder {
    color: var(--color-muted);
  }

  .control:hover {
    border-color: var(--color-muted);
  }
</style>
