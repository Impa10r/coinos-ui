<script>
  import { loc, focus } from "$lib/utils";
  import { t } from "$lib/translations";
  import Success from "$comp/Success.svelte";
  import Spinner from "$comp/Spinner.svelte";

  let { data } = $props();
  let { rate, tip, user, assetType, assetAmount, p } = $derived(data);
  let { currency, username } = $derived(user);
  let amount = $derived(Math.abs(data.amount ?? 0));
  let locale = $derived(loc(user));

  // Capture the bolt11 on first render so the retry button still has it
  // after a reversal nulls out p.
  let hash = $state();
  $effect.pre(() => {
    if (p?.hash && !hash) hash = p.hash;
  });

  // Lightning payments are async: the record exists from `debit` but has no
  // `ref` (preimage) until xpay finalizes. p === null means it was reversed.
  let view = $derived(
    p === null
      ? "failed"
      : p?.type === "lightning" && (p?.amount ?? 0) < 0 && !p?.ref
        ? "sending"
        : "success",
  );
</script>

{#if view === "sending"}
  <div class="container px-4 max-w-xl mx-auto text-center space-y-4 mt-12">
    <Spinner />
    <h1 class="text-xl text-secondary">{$t("payments.sending")}</h1>
    <div class="text-secondary">{$t("payments.sendingDesc")}</div>
  </div>
{:else if view === "failed"}
  <div class="container px-4 max-w-xl mx-auto text-center space-y-4 mt-12">
    <h1 class="text-xl text-red-600">{$t("payments.sendFailed")}</h1>
    <div class="text-secondary">{$t("payments.sendFailedDesc")}</div>
    {#if hash}
      <a
        href={`/send/lightning/${hash}?advanced=1`}
        class="btn btn-primary"
        use:focus
      >
        {$t("payments.retry")}
      </a>
    {/if}
    <a href={`/${username}`} class="btn">{$t("payments.continue")}</a>
  </div>
{:else}
  <Success
    {amount}
    {rate}
    {tip}
    {currency}
    {locale}
    {assetType}
    {assetAmount}
    title={`${$t("payments.sent")}!`}
  />
  <a href={`/${username}`} use:focus aria-label="Continue">
    <div class="opacity-0 w-screen h-screen fixed top-0 left-0 z-50"></div>
  </a>

  <div class="flex justify-center mt-4">
    {$t("payments.tapAnywhere")}
  </div>
{/if}
