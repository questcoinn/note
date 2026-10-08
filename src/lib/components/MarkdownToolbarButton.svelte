<script lang="ts">
  import type { FormatVariant } from '../markdown/format'
  import Icon, { type IconName } from './Icon.svelte'

  let {
    variant,
    tabindex,
    onclick,
    onfocus,
  }: { variant: FormatVariant; tabindex: 0 | -1; onclick: () => void; onfocus: () => void } = $props()

  const meta: Record<FormatVariant, { icon: IconName; label: string }> = {
    bold: { icon: 'bold', label: '굵게' },
    italic: { icon: 'italic', label: '기울임' },
    heading: { icon: 'heading', label: '제목' },
    link: { icon: 'link', label: '링크' },
    list: { icon: 'list', label: '목록' },
    code: { icon: 'code', label: '코드' },
  }
</script>

<!-- 마우스로 누를 때 포커스를 가져가지 않아 원문의 선택 영역과 스크롤이 그대로다 (add-markdown-formatting design.md D3) -->
<button
  type="button"
  class="toolbar-button"
  aria-label={meta[variant].label}
  title={meta[variant].label}
  {tabindex}
  onmousedown={(event) => event.preventDefault()}
  {onclick}
  {onfocus}
>
  <Icon name={meta[variant].icon} size={18} />
</button>

<style>
  .toolbar-button {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-body);
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .toolbar-button:hover {
    background: var(--color-surface);
  }

  .toolbar-button:active {
    background: var(--color-weak-background);
    color: var(--color-weak-foreground);
  }
</style>
