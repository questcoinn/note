<script lang="ts">
  import Icon from './Icon.svelte'

  let { value = $bindable('') }: { value?: string } = $props()

  let input: HTMLInputElement
  const inputId = $props.id()

  function clear() {
    value = ''
    input.focus()
  }
</script>

<!-- 뼈대 단계: 입력값은 보이지만 목록을 필터링하지 않는다 -->
<div class="search-input" role="search">
  <label class="visually-hidden" for={inputId}>노트 검색</label>
  <span class="leading"><Icon name="search" /></span>
  <input bind:this={input} bind:value id={inputId} type="search" placeholder="노트 검색" autocomplete="off" />
  {#if value}
    <button type="button" class="clear" aria-label="검색어 지우기" onclick={clear}>
      <Icon name="x" size={18} />
    </button>
  {/if}
</div>

<style>
  .search-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .leading {
    position: absolute;
    left: var(--spacing-md);
    color: var(--color-muted);
    pointer-events: none;
  }

  input {
    width: 100%;
    min-height: 44px;
    padding: 0 44px 0 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-canvas);
    color: var(--color-foreground);
    transition: border-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  input::placeholder {
    color: var(--color-muted);
  }

  input:hover {
    border-color: var(--color-muted);
  }

  input:focus-visible {
    border-color: var(--color-primary);
  }

  /* 브라우저 기본 지우기 버튼 대신 컴포넌트의 지우기 버튼만 쓴다 */
  input::-webkit-search-cancel-button {
    appearance: none;
  }

  .clear {
    position: absolute;
    right: var(--spacing-xs);
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-muted);
  }

  .clear:hover {
    background: var(--color-surface);
    color: var(--color-body);
  }
</style>
