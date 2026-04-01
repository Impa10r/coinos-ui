<script>
  import { loc, post, copy, fail, types } from "$lib/utils";
  import { onMount } from "svelte";
  import { showQr, amountPrompt } from "$lib/store";
  import InvoiceData from "$comp/InvoiceData.svelte";
  import InvoiceActions from "$comp/InvoiceActions.svelte";
  import SetAmount from "$comp/SetAmount.svelte";
  import SetMemo from "$comp/SetMemo.svelte";
  import SetType from "$comp/SetType.svelte";
  import { t } from "$lib/translations";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data } = $props();

  let id = $state();
  let { rate, subject, user, text } = $derived(data);
  let locale = $derived(loc(user));

  let currency = $derived(subject.currency);
  let username = $derived(subject.username);
  let type = types.lightning;
  let hash = "";

  let aid = $derived(subject.id);
  let invoice = /** @type {any} */ (
    $derived({
      aid,
      type: types.lightning,
      items: [],
      rate,
      text,
      uid: subject.id,
      user: subject,
    })
  );
  let amount = $state(),
    tip;

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
      fail(String(e));
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

  let setAmount = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    settingAmount = false;

    if (typeof $amountPrompt === "undefined") $amountPrompt = true;
    amount = newAmount;
    invoice.amount = newAmount;
    invoice.tip = null;

    await update();
  };

  let newAmount = $state(0);
  let settingAmount = $state();
  let fiat = $state(true);
  let toggleAmount = () => (settingAmount = !settingAmount);

  let setMemo = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    settingMemo = false;
    invoice.memo = memo;
    await update();
  };

  let memo = $state();
  let settingMemo = $state();
  let toggleMemo = () => (settingMemo = !settingMemo);

  let link = $derived(
    [types.bitcoin, types.liquid].includes(type) ? text : `lightning:${text}`,
  );
  let txt = $derived(
    [types.bitcoin, types.liquid].includes(type) ? hash : text,
  );

  onMount(() => {
    if ($amountPrompt && !amount) toggleAmount();
    let address_type = $page.url.searchParams.get("address_type");
    if (address_type) setType(types.bitcoin, address_type);
  });
</script>

<div class="invoice container mx-auto max-w-xl px-4 space-y-2">
  <InvoiceData
    {locale}
    {link}
    {txt}
    {invoice}
    {amount}
    {currency}
    {tip}
    {rate}
    showQr={$showQr}
    t={$t}
  />

  <InvoiceActions
    bind:newAmount
    {toggleType}
    {setType}
    {toggleAmount}
    {toggleMemo}
    {user}
    {invoice}
    {copy}
    {link}
    {showQr}
    {txt}
    t={$t}
  />
</div>

<SetAmount
  bind:newAmount
  bind:fiat
  {currency}
  locale={loc(user)}
  {rate}
  {settingAmount}
  {setAmount}
  {toggleAmount}
  t={$t}
/>

<SetMemo bind:memo {settingMemo} {setMemo} {toggleMemo} t={$t} />

<SetType
  {invoice}
  {user}
  {settingType}
  {setType}
  {toggleType}
  t={$t}
  bind:newAmount
  {setAmount}
/>
