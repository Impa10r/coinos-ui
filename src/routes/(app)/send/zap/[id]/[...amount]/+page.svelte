<script>
  import { goto } from "$app/navigation";
  import { untrack } from "svelte";
  import { t } from "$lib/translations";
  import { enhance } from "$app/forms";
  import Numpad from "$comp/Numpad.svelte";
  import { loc, fail, post } from "$lib/utils";
  import { sign } from "$lib/nostr";
  import { rate, pin } from "$lib/store";

  let { data, form } = $props();

  let { id, request, user } = $derived({
    .../** @type {any} */ (data),
    .../** @type {any} */ (form),
  });
  let a = $state(untrack(() => /** @type {any} */ (data).amount));
  let { currency } = $derived(user);
  let locale = $derived(loc(user));
  let event = $state();

  $effect(() => {
    $rate ||= /** @type {any} */ (data).rate;
  });
  $effect(() => {
    void (async () => {
      if (form || request) {
        try {
          event = await sign(request, user);
          let { pr: payreq } = await post("/post/zap", { event });
          await post("/post/payments", { amount, payreq, pin: $pin });
          goto(`/e/${id}`);
        } catch (e) {
          console.log(e);
          fail(e instanceof Error ? e.message : String(e));
        }
      }
    })();
  });

  let next = $state();
  let amount = $derived(form?.amount || data.amount);
</script>

<div class="container px-4 max-w-xl mx-auto text-center space-y-2">
  {#if form?.message}
    <div class="text-red-600 text-center">
      {$t(form.message)}
    </div>
  {/if}
  <form method="POST" action="?/setAmount" class="space-y-2" use:enhance>
    <input type="hidden" value={a} name="amount" />
    <input name="rate" value={$rate} type="hidden" />

    <Numpad
      bind:amount={a}
      {currency}
      {locale}
      bind:rate={$rate}
      submit={next}
    />
    <button type="submit" class="btn" bind:this={next}
      >{$t("payments.next")}</button
    >
  </form>
</div>
