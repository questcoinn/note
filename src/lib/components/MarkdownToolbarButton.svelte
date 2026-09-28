<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte'

  type Variant = 'bold' | 'italic' | 'heading' | 'link' | 'list' | 'code'

  let { variant }: { variant: Variant } = $props()

  const meta: Record<Variant, { icon: IconName; label: string }> = {
    bold: { icon: 'bold', label: '굵게' },
    italic: { icon: 'italic', label: '기울임' },
    heading: { icon: 'heading', label: '제목' },
    link: { icon: 'link', label: '링크' },
    list: { icon: 'list', label: '목록' },
    code: { icon: 'code', label: '코드' },
  }
</script>

<!-- 뼈대 단계: 누르면 선택 영역에 서식을 토글할 자리. 지금은 원문을 바꾸지 않는다. -->
<button type="button" class="toolbar-button" aria-label={meta[variant].label} title={meta[variant].label}>
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
