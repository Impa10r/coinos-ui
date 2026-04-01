<script>
  import { send } from "$lib/socket";
  import { loc, post, copy, fail, types } from "$lib/utils";
  import { onMount, untrack } from "svelte";
  import { browser } from "$app/environment";
  import { last, showQr, amountPrompt } from "$lib/store";
  import InvoiceData from "$comp/InvoiceData.svelte";
  import InvoiceActions from "$comp/InvoiceActions.svelte";
  import SetAmount from "$comp/SetAmount.svelte";
  import SetMemo from "$comp/SetMemo.svelte";
  import SetType from "$comp/SetType.svelte";
  import { t } from "$lib/translations";
  import { goto } from "$app/navigation";

  let { data } = $props();

  let { subject, user } = $derived(data);
  let id = $state(untrack(() => data.id));
  let { invoice } = $derived(/** @type {any} */ (data));
  let { amount, rate, tip, hash, text, type } = $derived(invoice);
  let memo = $state(untrack(() => invoice.memo));
  let { username, currency } = $derived(invoice.user);
  let locale = $derived(loc(user));

  // if (browser && !subbed[id])
  //   send("subscribe", invoice)
  //     .then(() => (subbed[id] = true))
  //     .catch((e) => {
  //       console.log("failed to subscribe to invoice notifications", invoice);
  //       console.log(e);
  //     });

  let subbed = false;

  $effect(() => {
    if (!browser) return;
    last.subscribe((v) => {
      if (!v || subbed) return;
      subbed = true;
      send("subscribe", invoice);
    });
  });

  onMount(async () => {
    if (!browser) return;
    if ($amountPrompt && !amount) toggleAmount();
  });

  let update = async () => {
    try {
      ({ id } = await post(`/invoice`, {
        invoice,
        user: { username, currency },
      }));

      let url = `/invoice/${id}`;
      if (subject?.prompt) url += "/tip";
      else url += "?options=true";

      goto(url, { invalidateAll: true, noScroll: true });
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e));
    }
  };

  let settingType = $state();
  let toggleType = () => (settingType = !settingType);
  let setType = async (type, address_type) => {
    $showQr = true;
    if (type === types.lightning && !amount && typeof newAmount === "undefined")
      goto(`/${username}/receive`, { invalidateAll: true, noScroll: true });
    else {
      if (typeof newAmount !== "undefined") invoice.amount = newAmount;
      invoice.address_type = address_type;
      invoice.type = type;
      await update();
    }
    settingType = false;
  };

  let newAmount = $state(0);
  let settingAmount = $state();
  let toggleAmount = () => (settingAmount = !settingAmount);

  let setAmount = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    settingAmount = false;

    if (typeof $amountPrompt === "undefined") $amountPrompt = true;
    invoice.amount = newAmount;
    invoice.tip = 0;

    await update();
  };

  let setMemo = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    settingMemo = false;
    invoice.memo = memo;
    await update();
  };

  let settingMemo = $state();
  let toggleMemo = () => (settingMemo = !settingMemo);

  let fiat = $state(true);

  let link = $derived(
    [types.bitcoin, types.liquid].includes(type) ? text : `lightning:${text}`,
  );

  let txt = $derived(
    [types.bitcoin, types.liquid].includes(type) ? hash : text,
  );
</script>

<div class="invoice container mx-auto max-w-xl px-4 space-y-2">
  <InvoiceData
    {link}
    {txt}
    {invoice}
    {amount}
    {currency}
    {locale}
    {tip}
    {rate}
    showQr={$showQr}
    t={$t}
  />

  <InvoiceActions
    bind:newAmount
    {setType}
    {toggleType}
    {toggleAmount}
    {toggleMemo}
    {user}
    {invoice}
    {copy}
    {link}
    {txt}
    t={$t}
    bind:showQr={$showQr}
  />
</div>

<SetAmount
  bind:newAmount
  bind:fiat
  {currency}
  {locale}
  {rate}
  {settingAmount}
  {setAmount}
  {toggleAmount}
  t={$t}
/>

<SetMemo bind:memo {settingMemo} {setMemo} {toggleMemo} t={$t} />

<SetType
  bind:newAmount
  {setAmount}
  {invoice}
  {user}
  {settingType}
  {setType}
  {toggleType}
  t={$t}
/>
