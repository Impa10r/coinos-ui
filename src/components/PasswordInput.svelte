<script lang="ts">
  let {
    name = $bindable("password"),
    show = $bindable(),
    value = $bindable(),
    focus = () => {},
    placeholder = undefined,
    autocomplete = "current-password" as AutoFill,
  } = $props();

  let toggle = (e?: Event) => {
    e?.preventDefault();
    show = !show;
  };

  let icon = $derived(show ? "ph:eye-bold" : "ph:eye-slash-bold");
</script>

<label
  for="password"
  class="input flex items-center justify-center gap-2 w-full"
>
  {#if show}
    <input
      {name}
      type="text"
      bind:value
      class="clean"
      {placeholder}
      {autocomplete}
    />
  {:else}
    <input
      {name}
      type="password"
      bind:value
      class="clean"
      use:focus
      {placeholder}
      {autocomplete}
    />
  {/if}
  <button type="button" aria-label="Toggle" onclick={toggle} class="contents">
    <iconify-icon noobserver {icon} width="32"></iconify-icon>
  </button>
</label>
