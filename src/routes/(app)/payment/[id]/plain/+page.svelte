<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { f, toFiat } from "$lib/utils";
  import { format } from "date-fns";

  let { data } = $props();
  let { payment: p } = $derived(data);

  let { id, amount, created, rate, tip, currency, type } = $derived(p);
  let a = $derived(Math.abs(amount));

  onMount(() => {
    if (browser) {
      let main = document.querySelector("main");
      if (main) main.style.paddingBottom = "0";
      window.onfocus = () => goto(`/payment/${id}`);
      window.print();
    }
  });
</script>

<div class="space-y-5">
  <div>
    <span class="text-lg text-secondary">Amount</span>
    <div>
      {f(toFiat(a, rate), currency)}
    </div>
  </div>

  {#if tip}
    <div>
      <span class="text-lg text-secondary">Tip</span>
      <div>
        {f(toFiat(tip, rate), currency)}
        ({Math.round((tip * 100) / Math.abs(a))}%)
      </div>
    </div>

    <div>
      <span class="text-lg text-secondary">Total</span>
      <div>
        {f(toFiat(a + (tip || 0), rate), currency)}
      </div>
    </div>
  {/if}

  <div>
    <span class="text-lg text-secondary">Date</span>
    <div>
      {format(new Date(created), "MMMM d")},
      {format(new Date(created), "h:mm aaa")}
    </div>
  </div>

  {#if type === "bitcoin"}
    <div>
      <span class="text-lg text-secondary">Txid</span>
      <div class="flex">
        <div>
          {id}
        </div>
      </div>
    </div>
  {/if}
</div>

<a href={`/payment/${id}`} aria-label="Go back">
  <div class="opacity-0 w-screen h-screen fixed top-0 left-0 z-50"></div>
</a>
