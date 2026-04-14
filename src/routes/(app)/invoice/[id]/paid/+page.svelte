<script>
  import Amount from "$comp/Amount.svelte";
  import Success from "$comp/Success.svelte";
  import { t } from "$lib/translations";
  import { loc } from "$lib/utils";

  let { data } = $props();
  let { currency, rate, received, pending, tip, user, assetType, assetAmount } =
    $derived(data.invoice);
  let locale = $derived(loc(user));

  // toast.pop(0);
</script>

<div class="container px-4 text-center mx-auto">
  {#if pending}
    <iconify-icon
      noobserver
      icon="ph:clock-bold"
      class="text-warning"
      width="160"
    ></iconify-icon>

    <h1 class="text-3xl md:text-4xl font-bold mb-6">Payment detected</h1>

    {#if assetType === "USDT"}
      <div
        class="text-4xl font-semibold flex items-center justify-center gap-2"
      >
        <iconify-icon noobserver icon="cryptocurrency-color:usdt" width="36"
        ></iconify-icon>
        {assetAmount?.toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDT
      </div>
    {:else}
      <Amount amount={pending - tip} {tip} {rate} {currency} {locale} />
    {/if}
  {:else}
    <Success
      amount={received - tip}
      {rate}
      {tip}
      {currency}
      {locale}
      {assetType}
      {assetAmount}
      title={$t("invoice.paymentSuccessful")}
    />
  {/if}
</div>

<a href={`/${user.username}`} aria-label="Continue">
  <div class="opacity-0 w-screen h-screen fixed top-24 left-0 z-50"></div>
</a>

<div class="flex justify-center mt-4">
  {$t("payments.tapAnywhere")}
</div>
