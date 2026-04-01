<script>
  import { copy, s, f, toFiat } from "$lib/utils";
  const {
    align,
    amount,
    locale,
    tip,
    rate,
    currency,
    locked = false,
  } = $props();

  const icon = $derived(locked ? "ph:lock-fill" : "ph:lightning-fill");
</script>

{#if typeof amount !== "undefined"}
  <div>
    <h2
      class="text-2xl md:text-3xl font-semibold flex items-end cursor-copy"
      class:justify-center={align !== "left"}
    >
      <div
        class="flex items-center"
        role="button"
        tabindex="0"
        onclick={() => copy(amount)}
        onkeydown={(e) => e.key === "Enter" && copy(amount)}
      >
        <iconify-icon noobserver {icon} class="text-yellow-300"
        ></iconify-icon>{s(amount, locale)}
      </div>

      {#if tip}
        <div class="flex items-center text-lg ml-2">
          <div>+</div>
          <iconify-icon noobserver {icon} class="text-yellow-300"
          ></iconify-icon>
          <div>{s(tip, locale)}</div>
        </div>
      {/if}
    </h2>
    <div
      class="flex text-secondary md:text-lg cursor-copy items-center gap-1"
      class:justify-center={align !== "left"}
      role="button"
      tabindex="0"
      onclick={() => copy(toFiat(amount, rate).toFixed(2))}
      onkeydown={(e) =>
        e.key === "Enter" && copy(toFiat(amount, rate).toFixed(2))}
    >
      {f(toFiat(amount, rate), currency, locale)}
      {#if tip}
        <span class="text-base">
          +{f(toFiat(tip, rate), currency, locale)}
        </span>
      {/if}
    </div>
  </div>
{/if}
