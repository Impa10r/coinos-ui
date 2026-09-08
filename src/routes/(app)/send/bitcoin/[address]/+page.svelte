<script>
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { t } from "$lib/translations";
  import Numpad from "$comp/Numpad.svelte";
  import { page } from "$app/stores";
  import { rate } from "$lib/store";
  import { loc, s, focus, isLiquid } from "$lib/utils";

  let { data } = $props();

  let { balance, usdtHotBalance, btcHotBalance, lbtcHotBalance, user } =
    $derived(data);
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
          liveUsdtRate = rates["USD"];
        } catch {}
      }, 5000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connectBitfinex = () => {
      bfxWs = new WebSocket("wss://api-pub.bitfinex.com/ws/2");
      let chanId = null;
      let bid = 0,
        ask = 0;

      bfxWs.onopen = () => {
        stopPolling();
        bfxWs.send(
          JSON.stringify({
            event: "subscribe",
            channel: "book",
            symbol: "tBTCUST",
            prec: "P0",
            freq: "F0",
            len: "1",
          }),
        );
      };

      bfxWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === "subscribed") {
            chanId = msg.chanId;
            return;
          }
          if (!Array.isArray(msg) || msg[0] !== chanId || msg[1] === "hb")
            return;
          const data = msg[1];
          if (Array.isArray(data[0])) {
            for (const [price, , amount] of data) {
              if (amount > 0) bid = price;
              else ask = price;
            }
          } else {
            const [price, count, amount] = data;
            if (count === 0) {
              if (amount === 1) bid = 0;
              else ask = 0;
            } else {
              if (amount > 0) bid = price;
              else ask = price;
            }
          }
          if (bid && ask) {
            const mid = (bid + ask) / 2;
            if (Math.abs(mid - liveUsdtRate) / (liveUsdtRate || mid) > 0.0001)
              liveUsdtRate = mid;
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
  const LIQUID_FEE_RATE = 1.001; // coinos liquid fee, 0.1%

  // Total sats the user's account will be debited (amount + network fee + platform fee)
  //
  // Liquid is predictable — a flat network fee and 0.1% — so it can be priced
  // here. Bitcoin cannot: the miner fee depends on the transaction the server
  // builds at the current feerate, and coinos takes 0.4%, not 0.1%. This page
  // serves both (see `liquid` above, already used for exceedsBtcHot vs
  // exceedsLbtcHot) but priced everything as liquid, understating a bitcoin
  // send by the entire miner fee plus 0.3%.
  //
  // So for bitcoin the only thing knowable here is that you can't send more
  // than you hold; the server subtracts the real fee itself when the amount
  // won't fit (build()'s full-withdrawal path), and the confirmation screen
  // already shows the reduced figure.
  let totalSatsCost = $derived.by(() => {
    if (!a) return 0;
    if (useUsdt && liveUsdtRate > 0) {
      const btcSats = Math.round(
        (amountFiat / (liveUsdtRate / 1.0015)) * 100_000_000,
      );
      return btcSats;
    }
    if (!liquid) return a;
    return Math.round(a * LIQUID_FEE_RATE) + LIQUID_NETWORK_FEE; // a + liquid platform fee + network fee
  });

  let exceedsSats = $derived(totalSatsCost > 0 && totalSatsCost > balance);
  let exceedsUsdt = $derived(
    useUsdt && amountFiat > 0 && amountFiat > usdtHotBalance,
  );
  let exceedsBtcHot = $derived(
    !useUsdt && !liquid && a > 0 && a > btcHotBalance,
  );
  let exceedsLbtcHot = $derived(
    !useUsdt && liquid && a > 0 && a > lbtcHotBalance,
  );
  let canProceed = $derived(
    !exceedsSats && !exceedsUsdt && !exceedsBtcHot && !exceedsLbtcHot,
  );

  // For bitcoin, hand the server the whole balance and let it reduce the
  // amount to whatever actually fits: build() already switches to a full
  // withdrawal when amount + fee + ourfee exceeds the balance, subtracting the
  // real miner fee from the output. Reserving a guess here is what produced an
  // unsendable Max — a 21,000 balance gave 20,929, which then failed the
  // ledger check because the true cost is the miner fee plus 0.4%, not 50 sats
  // plus 0.1%.
  let maxSendable = $derived(
    liquid
      ? balance > LIQUID_NETWORK_FEE
        ? Math.floor((balance - LIQUID_NETWORK_FEE) / LIQUID_FEE_RATE)
        : 0
      : balance,
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
      const usdtEquiv = parseFloat(
        (((a / 100_000_000) * liveUsdtRate) / 1.0015).toFixed(2),
      );
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
        onclick={() => {
          a = 0;
          amountFiat = 0;
          fiat = false;
          useUsdt = false;
        }}
      >
        <img src="/images/liquid.svg" class="w-6" alt="Liquid" />
        L-BTC
      </button>
      <button
        type="button"
        class="btn !w-auto grow"
        class:btn-accent={useUsdt}
        onclick={() => {
          a = 0;
          amountFiat = 0;
          fiat = true;
          useUsdt = true;
        }}
      >
        <iconify-icon noobserver icon="cryptocurrency-color:usdt" width="24"
        ></iconify-icon>
        L-USDT
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
  {:else if exceedsUsdt || exceedsBtcHot || exceedsLbtcHot}
    <div class="text-error">{$t("payments.exceedsHotWallet")}</div>
  {/if}

  <div class="flex justify-center gap-2">
    {#if !useUsdt}
      <!-- Label the figure only for liquid, where it's exact (flat network fee
           + 0.1%). For bitcoin it isn't knowable here — the miner fee depends
           on the transaction the server builds — and setMax hands over the
           whole balance for the server to reduce, so printing a number would
           advertise more than the next screen quotes, by the miner fee plus
           0.4%. -->
      <button
        type="button"
        class="btn !w-auto grow"
        onclick={setMax}
        onkeydown={setMax}>Max{liquid ? ` ⚡️${s(maxSendable)}` : ""}</button
      >
    {/if}

    {#if useUsdt}
      <div class="btn !w-auto grow font-bold">
        1 <span style="color:#F7931A">₿</span> =
        <span style="color:#26A17B">₮</span>
        <span style="font-variant-numeric:tabular-nums"
          >{Math.round(liveUsdtRate / 1.0015).toLocaleString(locale)}</span
        >
      </div>
      <button
        type="button"
        class="btn !w-auto grow btn-accent"
        onclick={nextUsdt}
        disabled={!canProceed}
      >
        {$t("payments.next")}
      </button>
    {:else}
      <!-- `!a` in the disabled check matters: every other guard here is
           deliberately inert at zero — totalSatsCost returns 0, and both
           exceeds*Hot require a > 0 — so with no amount entered nothing was
           disabled and this submitted /send/bitcoin/<address>/0, which fires a
           /fee quote for 0 sats that can only come back as an error. The USDT
           button above already refuses, via nextUsdt's `if (!a || a <= 0)`. -->
      <form action={`/send/bitcoin/${address}/${amount}`} class="contents">
        <button
          use:focus
          bind:this={submit}
          type="submit"
          class="btn !w-auto grow btn-accent"
          disabled={!a || exceedsSats || exceedsBtcHot || exceedsLbtcHot}
        >
          {$t("payments.next")}
        </button>
      </form>
    {/if}
  </div>
</div>
