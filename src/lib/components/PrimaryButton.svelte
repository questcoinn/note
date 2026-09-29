<script lang="ts">
  import type { Snippet } from 'svelte'
  import Icon, { type IconName } from './Icon.svelte'

  let {
    variant = 'fill-primary',
    type = 'button',
    icon,
    block = false,
    disabled = false,
    onclick,
    children,
  }: {
    variant?: 'fill-primary' | 'fill-danger'
    type?: 'button' | 'submit'
    icon?: IconName
    block?: boolean
    disabled?: boolean
    onclick?: (event: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

<button
  {type}
  class="primary-button {variant}"
  class:block
  {disabled}
  {onclick}
>
  {#if icon}<Icon name={icon} />{/if}
  <span>{@render children()}</span>
</button>

<style>
  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    min-height: 56px;
    padding: 0 var(--spacing-xl);
    border: none;
    border-radius: var(--radius-button-xl);
    color: var(--color-on-primary);
    /* 17px 굵은 레이블 — DESIGN.md 큰 텍스트 대비 3:1 기준 */
    font-size: 17px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    transition:
      background-color var(--motion-duration-fast) var(--motion-easing-standard),
      transform var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .block {
    width: 100%;
  }

  .fill-primary {
    background: var(--color-primary);
  }

  .fill-primary:hover:not(:disabled),
  .fill-primary:active:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .fill-danger {
    background: var(--color-danger);
  }

  .fill-danger:hover:not(:disabled),
  .fill-danger:active:not(:disabled) {
    background: color-mix(in srgb, var(--color-danger) 88%, var(--color-foreground));
  }

  .primary-button:active:not(:disabled) {
    transform: scale(0.98);
  }

  .primary-button:disabled {
    background: var(--color-surface);
    color: var(--color-muted);
    cursor: not-allowed;
  }
</style>
