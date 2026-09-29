<script lang="ts">
  import Icon from './Icon.svelte'
  import PrimaryButton from './PrimaryButton.svelte'

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel,
    error,
    onconfirm,
  }: {
    open?: boolean
    title: string
    description: string
    confirmLabel: string
    // 확인한 동작이 실패했을 때 다이얼로그 안에 보여줄 문구
    error?: string
    onconfirm: () => void
  } = $props()

  let dialog: HTMLDialogElement
  const titleId = $props.id()

  // showModal()이 포커스 가두기·Esc 닫기·배경 비활성화를 맡는다
  $effect(() => {
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })
</script>

<dialog bind:this={dialog} class="confirm-dialog" aria-labelledby={titleId} onclose={() => (open = false)}>
  <h2 id={titleId} class="title">{title}</h2>
  <p class="description">{description}</p>
  <!-- 영역은 늘 두고 내용만 바꿔야 스크린 리더가 새 문구를 알린다 -->
  <div class="error" class:shown={error} role="alert">
    {#if error}<Icon name="alert" /><span>{error}</span>{/if}
  </div>
  <div class="actions">
    <button type="button" class="cancel" onclick={() => (open = false)}>취소</button>
    <PrimaryButton variant="fill-danger" onclick={onconfirm}>{confirmLabel}</PrimaryButton>
  </div>
</dialog>

<style>
  .confirm-dialog {
    width: min(400px, calc(100vw - 2 * var(--spacing-lg)));
    padding: var(--spacing-xl);
    border: none;
    border-radius: var(--radius-card);
    background: var(--color-canvas);
    color: var(--color-body);
  }

  .confirm-dialog::backdrop {
    background: color-mix(in srgb, var(--color-foreground) 50%, transparent);
  }

  .title {
    color: var(--color-foreground);
    font-size: var(--type-h4-size);
    font-weight: var(--type-h4-weight);
    line-height: var(--type-h4-line);
    overflow-wrap: anywhere;
  }

  .description {
    margin-top: var(--spacing-md);
  }

  .error {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    color: var(--color-danger);
    font-size: var(--type-body-small-size);
    line-height: var(--type-body-small-line);
  }

  .error.shown {
    margin-top: var(--spacing-lg);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xl);
  }

  .actions > :global(*) {
    flex: 1 1 120px;
  }

  /* 2차 행동 — primary-button과 같은 지오메트리, 중립 배경 */
  .cancel {
    min-height: 56px;
    padding: 0 var(--spacing-xl);
    border: none;
    border-radius: var(--radius-button-xl);
    background: var(--color-surface);
    color: var(--color-foreground);
    font-size: 17px;
    font-weight: 600;
    transition: background-color var(--motion-duration-fast) var(--motion-easing-standard);
  }

  .cancel:hover {
    background: var(--color-border);
  }
</style>
