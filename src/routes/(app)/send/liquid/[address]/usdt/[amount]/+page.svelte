<script>
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";
  import { t } from "$lib/translations";
  import { f, s, sats, loc } from "$lib/utils";

  let { data, form } = $props();
  let {
    address,
    usdtAmount,
    fixedSats,
    rate: fiatRate,
    currency,
  } = $derived(data);
  let locale = $derived(loc(data.user));

  let liveUsdtRate = $state(0);
  let currentUsdtAmount = $state(0);
  let currentSats = $state(0);

  $effect(() => {
    if (!liveUsdtRate) return;
    const effectiveRate = liveUsdtRate / 1.0015;
    if (fixedSats) {
      currentSats = fixedSats;
      currentUsdtAmount = parseFloat(
        ((fixedSats / sats) * effectiveRate).toFixed(8),
      );
    } else {
      currentUsdtAmount = usdtAmount;
      currentSats = Math.round((usdtAmount / effectiveRate) * sats);
    }
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
</script>

<div class="container px-4 max-w-lg mx-auto space-y-8 text-2xl">
  <h1 class="text-center text-3xl md:text-4xl font-semibold">
    {$t("payments.send")} USDT
  </h1>

  <div class="text-xl text-secondary break-all text-center">{address}</div>

  <div class="btn w-full text-lg">
    1 <span style="color:#F7931A" class="font-bold">₿</span> =
    <span style="color:#26A17B">₮</span>
    {liveUsdtRate
      ? Math.round(liveUsdtRate / 1.0015).toLocaleString(locale)
      : "…"}
  </div>

  {#if form?.message}
    <div class="text-error text-xl">{form.message}</div>
  {/if}

  <div class="space-y-5">
    <div>
      <div class="text-lg text-secondary flex items-center gap-1">
        {$t("payments.assetToSend")}
        {#if !fixedSats}<iconify-icon
            noobserver
            icon="ph:check-circle-fill"
            class="text-green-500"
            width="20"
          ></iconify-icon>{/if}
      </div>
      <div class="flex items-center gap-2">
        <span style="color:#26A17B">₮</span>
        {currentUsdtAmount.toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>

    <div>
      <div class="text-lg text-secondary flex items-center gap-1">
        {$t("payments.amountToDebit")}
        {#if fixedSats}<iconify-icon
            noobserver
            icon="ph:check-circle-fill"
            class="text-green-500"
            width="20"
          ></iconify-icon>{/if}
      </div>
      <div class="flex items-center gap-2">
        <iconify-icon
          noobserver
          icon="ph:lightning-fill"
          class="text-yellow-300"
          width="24"
        ></iconify-icon>
        {s(currentSats, locale)}
        <span class="text-secondary text-lg"
          >{f((currentSats / sats) * fiatRate, currency, locale)}</span
        >
      </div>
    </div>

    <div class="border-t border-base-200 pt-4">
      <div class="text-lg text-secondary">{$t("payments.total")}</div>
      <div class="flex items-center gap-2">
        <iconify-icon
          noobserver
          icon="ph:lightning-fill"
          class="text-yellow-300"
          width="24"
        ></iconify-icon>
        {s(currentSats, locale)}
        <span class="text-secondary text-lg"
          >{f((currentSats / sats) * fiatRate, currency, locale)}</span
        >
      </div>
    </div>
  </div>

  <form method="POST" use:enhance class="space-y-3">
    <input type="hidden" name="address" value={address} />
    <input type="hidden" name="amount" value={currentUsdtAmount} />
    <button type="submit" class="btn btn-accent w-full">
      <iconify-icon noobserver icon="ph:paper-plane-right-bold" width="32"
      ></iconify-icon>
      {$t("payments.send")}
      <span style="color:#26A17B">₮</span>
      {currentUsdtAmount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </button>
    <a href="/send" class="btn w-full">{$t("payments.cancel")}</a>
  </form>
</div>
