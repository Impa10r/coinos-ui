<script>
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { t } from "$lib/translations";
  import Numpad from "$comp/Numpad.svelte";
  import { page } from "$app/stores";
  import { rate } from "$lib/store";
  import { loc, s, focus, isLiquid } from "$lib/utils";

  let { data } = $props();

  let { balance, usdtHotBalance, user } = $derived(data);
  let { address } = $page.params;
  let { currency } = $derived(user);
  let locale = $derived(loc(user));
  let liquid = $derived(address ? isLiquid(address) : false);

  let useUsdt = $state(false);
  let liveUsdtRate = $state(0);

  let amount = $state(0);
  let a = $state(0);
  let amountFiat = $state(0);
  let submit = $state(),
    fiat = $state();

  $effect(() => {
    $rate = data.rate;
  });
  $effect(() => {
    amount = a;
  });

  onMount(() => {
    liveUsdtRate = data.usdtRate || 0;

    let bfxWs = null;
    let pollInterval = null;

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch("/api/rates");
          const rates = await res.json();
          liveUsdtRate = rates["USDT"] || rates["USD"];
        } catch {}
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
    };

    const connectBitfinex = () => {
      bfxWs = new WebSocket("wss://api-pub.bitfinex.com/ws/2");
      let chanId = null;
      let bid = 0, ask = 0;

      bfxWs.onopen = () => {
        stopPolling();
        bfxWs.send(JSON.stringify({ event: "subscribe", channel: "book", symbol: "tBTCUST", prec: "P0", freq: "F0", len: "1" }));
      };

      bfxWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === "subscribed") { chanId = msg.chanId; return; }
          if (!Array.isArray(msg) || msg[0] !== chanId || msg[1] === "hb") return;
          const data = msg[1];
          if (Array.isArray(data[0])) {
            for (const [price, , amount] of data) { if (amount > 0) bid = price; else ask = price; }
          } else {
            const [price, count, amount] = data;
            if (count === 0) { if (amount === 1) bid = 0; else ask = 0; }
            else { if (amount > 0) bid = price; else ask = price; }
          }
          if (bid && ask) {
            const mid = (bid + ask) / 2;
            if (Math.abs(mid - liveUsdtRate) / (liveUsdtRate || mid) > 0.0001) liveUsdtRate = mid;
          }
        } catch {}
      };

      bfxWs.onclose = startPolling;
      bfxWs.onerror = startPolling;
    };

    connectBitfinex();

    return () => {
      bfxWs?.close();
      stopPolling();
    };
  });

  const LIQUID_NETWORK_FEE = 50; // sats estimate for Liquid tx fee

  // Total sats the user's account will be debited (amount + network fee + platform fee)
  let totalSatsCost = $derived.by(() => {
    if (!a) return 0;
    if (useUsdt && liveUsdtRate > 0) {
      const btcSats = Math.round((amountFiat / (liveUsdtRate / 1.0015)) * 100_000_000);
      return Math.round(btcSats * 1.001); // btcSats + liquid platform fee (network fee = 0)
    }
    return Math.round(a * 1.001) + LIQUID_NETWORK_FEE; // a + liquid platform fee + network fee
  });

  let exceedsSats = $derived(totalSatsCost > 0 && totalSatsCost > balance);
  let exceedsUsdt = $derived(useUsdt && amountFiat > 0 && amountFiat > usdtHotBalance);
  let canProceed = $derived(!exceedsSats && !exceedsUsdt);

  let maxSendable = $derived(
    balance > LIQUID_NETWORK_FEE ? Math.floor((balance - LIQUID_NETWORK_FEE) / 1.001) : 0,
  );

  let setMax = async (e) => {
    e.preventDefault();
    fiat = false;
    amount = maxSendable;
    await tick();
    submit.click();
  };

  let nextUsdt = () => {
    if (!canProceed) return;
    if (fiat) {
      const n = parseFloat(amountFiat.toFixed(2));
      if (!n || n <= 0) return;
      goto(`/send/liquid/${address}/usdt/${n}`);
    } else {
      if (!a || a <= 0) return;
      const usdtEquiv = parseFloat(((a / 100_000_000) * liveUsdtRate / 1.0015).toFixed(2));
      goto(`/send/liquid/${address}/usdt/${usdtEquiv}?sats=${a}`);
    }
  };
</script>

<div class="container px-4 max-w-xl mx-auto space-y-5 text-center">
  <h1 class="text-3xl md:text-4xl font-semibold mb-2">{$t("payments.send")}</h1>

  <div class="text-xl text-secondary break-all">{address}</div>

  {#if liquid}
    <div class="flex gap-2 justify-center">
      <button
        type="button"
        class="btn !w-auto grow"
        class:btn-accent={!useUsdt}
        onclick={() => { a = 0; amountFiat = 0; fiat = false; useUsdt = false; }}
      >
        <img src="/images/liquid.svg" class="w-6" alt="Liquid" />
        L-BTC
      </button>
      <button
        type="button"
        class="btn !w-auto grow"
        class:btn-accent={useUsdt}
        onclick={() => { a = 0; amountFiat = 0; fiat = true; useUsdt = true; }}
      >
        <iconify-icon noobserver icon="cryptocurrency-color:usdt" width="24"></iconify-icon>
        USDT
      </button>
    </div>
  {/if}

  {#key useUsdt}
    <Numpad
      bind:amount={a}
      bind:fiat
      bind:amountFiat
      currency={useUsdt ? "USD" : currency}
      symbolOverride={useUsdt ? "₮" : undefined}
      {submit}
      rate={useUsdt ? liveUsdtRate : $rate}
      {locale}
    />
  {/key}

  {#if exceedsSats}
    <div class="text-error">{$t("payments.exceedsBalance")}</div>
  {:else if exceedsUsdt}
    <div class="text-error">{$t("payments.exceedsHotWallet")}</div>
  {/if}

  <div class="flex justify-center gap-2">
    {#if !useUsdt}
      <button
        type="button"
        class="btn !w-auto grow"
        onclick={setMax}
        onkeydown={setMax}>Max ⚡️{s(maxSendable)}</button
      >
    {/if}

    {#if useUsdt}
      <div class="btn !w-auto grow font-bold">1 <span style="color:#F7931A">₿</span> = <span style="color:#26A17B">₮</span> <span style="font-variant-numeric:tabular-nums">{Math.round(liveUsdtRate / 1.0015).toLocaleString(locale)}</span></div>
      <button type="button" class="btn !w-auto grow btn-accent" onclick={nextUsdt} disabled={!canProceed}>
        {$t("payments.next")}
      </button>
    {:else}
      <form action={`/send/bitcoin/${address}/${amount}`} class="contents">
        <button
          use:focus
          bind:this={submit}
          type="submit"
          class="btn !w-auto grow btn-accent"
          disabled={exceedsSats}
        >
          {$t("payments.next")}
        </button>
      </form>
    {/if}
  </div>
</div>
