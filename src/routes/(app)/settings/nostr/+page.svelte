<script>
  import { onMount, untrack } from "svelte";
  import { browser } from "$app/environment";
  import { getNsec, send, sign } from "$lib/nostr";
  import { tick } from "svelte";
  import { t } from "$lib/translations";
  import { s, copy, fail } from "$lib/utils";
  import { signer, save } from "$lib/store";

  let { data } = $props();
  let { apps, challenge, offer, user } = $derived(data);
  let npub = $state(untrack(() => user.npub));
  let extensionAvailable = $derived(
    browser && /** @type {any} */ (window).nostr,
  );
  let { locale } = $derived(user);

  let nsec = $state(),
    revealNsec = $state(),
    revealedNwc = $state(""),
    revealedPubkey = $state("");

  onMount(() => {
    if (!browser) return;
    let hash = new URLSearchParams(window.location.hash.slice(1));
    let revealed = hash.get("nwc");
    if (revealed) {
      revealedNwc = revealed;
      revealedPubkey = hash.get("pubkey") || "";
    }
  });

  let toggleNsec = async () => {
    try {
      nsec = await getNsec(user);
      revealNsec = !revealNsec;
    } catch (e) {
      fail("Failed to decrypt nsec");
    }
  };

  let extension = $state();
  let getPubkey = async () => {
    $signer = { method: "extension", ready: true };
    extension = true;
    npub = await /** @type {any} */ (window).nostr.getPublicKey();
    await tick();
    /** @type {any} */ ($save).click();
  };

  let publishing = $state(),
    published = $state();

  // Kind 10058 is the NIP-177 BOLT12 offer list — publishing it lets nostr
  // clients (Amethyst v1.13+) zap this user over BOLT12. Replaceable event,
  // so republishing just updates it.
  let publishOffer = async () => {
    try {
      publishing = true;
      let event = {
        kind: 10058,
        content: "",
        created_at: Math.round(Date.now() / 1000),
        tags: [["offer", offer]],
      };

      event = await sign(event, user);
      await send(event);
      published = true;
    } catch (e) {
      console.log(e);
      fail($t("user.settings.offerPublishFailed"));
    } finally {
      publishing = false;
    }
  };
</script>

<input type="hidden" name="challenge" value={challenge} />
<input type="hidden" name="extension" value={extension} />

<div>
  <h2 class="text-2xl font-bold mb-2">
    {$t("user.settings.nwc")}
  </h2>
  <p class="text-secondary mb-4">
    {$t("user.settings.nwcDescription")}
  </p>

  <div class="space-y-2">
    {#each apps as app, i}
      {@const last = i === apps.length - 1}
      {@const revealed = app.pubkey === revealedPubkey}
      <div class:border-b-8={!last} class="pb-4">
        <div class="flex justify-center gap-2 p-4">
          <div class="grow text-xl break-words min-w-0">
            <div>{app.name}</div>
            {#if app.max_amount > 0}
              <div class="flex gap-1 text-base">
                <div class="flex items-center">
                  <iconify-icon
                    noobserver
                    icon="ph:lightning-fill"
                    class="text-yellow-300"
                  ></iconify-icon>
                  {s(app.spent, locale)} /
                  {s(app.max_amount, locale)}
                </div>

                {#if app.budget_renewal !== "never"}
                  <div>
                    {app.budget_renewal}
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <a
            href={`/apps/${app.pubkey}`}
            aria-label={$t("accounts.edit")}
            title={$t("accounts.edit")}
          >
            <iconify-icon icon="ph:gear-bold" width="32"></iconify-icon>
          </a>

          <a
            href={`/apps/${app.pubkey}/payments`}
            aria-label={$t("accounts.payments")}
            title={$t("accounts.payments")}
          >
            <iconify-icon icon="ph:clock-bold" width="32"></iconify-icon>
          </a>

          {#if revealed}
            <a
              aria-label="QR"
              href={`/qr/${encodeURIComponent(revealedNwc)}`}
              title={$t("user.receive.showQR")}
            >
              <iconify-icon icon="ph:qr-code-bold" width="32"></iconify-icon>
            </a>
          {/if}
        </div>

        <div class="flex gap-1 w-full"></div>

        {#if revealed}
          <div class="flex flex-wrap justify-center gap-1">
            <button
              aria-label="Copy"
              type="button"
              onclick={() => copy(revealedNwc)}
              class="btn !w-auto grow"
              title={$t("accounts.copy")}
            >
              <iconify-icon icon="ph:copy-bold" width="32"></iconify-icon>
              <div>{$t("accounts.copyNwc")}</div>
            </button>
            <a
              href={revealedNwc}
              class="btn bg-gradient-to-tr from-purple-500 to-pink-500 !w-auto text-white grow whitespace-nowrap"
              aria-label="Open nostr"
            >
              <iconify-icon icon="ph:arrow-square-out-bold" width="32"
              ></iconify-icon>
              <div>{$t("accounts.connect")}</div>
            </a>
          </div>
        {/if}

        {#if revealed}
          <div class="space-y-2 mt-4 p-2 border-2 border-accent rounded">
            <p class="text-warning font-bold">
              {$t("accounts.nwcShownOnce")}
            </p>
            <div class="break-all grow">{revealedNwc}</div>
          </div>
        {/if}
      </div>
    {/each}

    <a href="/apps/new" class="btn">
      <iconify-icon icon="ph:plus-bold" width="32"></iconify-icon>
      {$t("accounts.newConection")}
    </a>
  </div>
</div>

{#if offer}
  <div class="space-y-2">
    <h2 class="text-2xl font-bold mb-2">
      {$t("user.settings.bolt12Offer")}
    </h2>
    <p class="text-secondary mb-4">
      {$t("user.settings.bolt12OfferDescription")}
    </p>

    <div class="break-all text-secondary">{offer}</div>

    <div class="flex my-auto gap-1">
      <button
        type="button"
        class="my-auto btn btn-circle !w-auto grow"
        onclick={() => copy(offer)}
        aria-label="Copy"
        ><iconify-icon noobserver icon="ph:copy-bold" width="32"></iconify-icon>
        {$t("accounts.copy")}</button
      >

      <a
        href={`/qr/${encodeURIComponent(offer)}`}
        class="my-auto btn btn-circle !w-auto grow"
        aria-label="QR"
      >
        <iconify-icon noobserver icon="ph:qr-code-bold" width="32"
        ></iconify-icon>
        {$t("accounts.qr")}
      </a>

      <button
        type="button"
        class="my-auto btn btn-circle !w-auto grow"
        onclick={publishOffer}
        disabled={publishing}
        aria-label="Publish"
        ><iconify-icon noobserver icon="ph:megaphone-bold" width="32"
        ></iconify-icon>
        {published
          ? $t("user.settings.offerPublished")
          : $t("user.settings.publishOffer")}</button
      >
    </div>
  </div>
{/if}

<div class="space-y-2">
  <div class="font-bold">{$t("user.nostrPubkey")}</div>
  <textarea name="pubkey" bind:value={npub} rows={3}></textarea>
  <div>
    <div class="flex my-auto gap-1">
      <button
        type="button"
        class="my-auto btn btn-circle !w-auto grow"
        onclick={() => copy(npub)}
        aria-label="Copy"
        ><iconify-icon noobserver icon="ph:copy-bold" width="32"></iconify-icon>
        {$t("accounts.copy")}</button
      >

      <a
        href={`/qr/${encodeURIComponent(npub)}`}
        class="my-auto btn btn-circle !w-auto grow"
        aria-label="QR"
      >
        <iconify-icon noobserver icon="ph:qr-code-bold" width="32"
        ></iconify-icon>
        {$t("accounts.qr")}
      </a>
    </div>
  </div>

  {#if extensionAvailable}
    <button class="btn" type="button" onclick={getPubkey}>
      <img src="/images/alby.svg" width="32" alt="Alby" />
      {$t("user.settings.syncWithExtension")}</button
    >
  {/if}
</div>

{#if user.nsec}
  <div class="space-y-2">
    <label for="seedphrase" class="font-bold"
      >{$t("user.settings.nostrKeys")}</label
    >

    <p class="text-secondary mb-1">
      {$t("user.settings.nostrDescription")}
    </p>

    <div class="flex flex-wrap sm:flex-nowrap gap-2">
      <button type="button" class="btn !w-auto flex-grow" onclick={toggleNsec}>
        {#if revealNsec}
          <iconify-icon noobserver icon="ph:eye-slash-bold" width="32"
          ></iconify-icon>
          {$t("user.settings.hideNsec")}
        {:else}
          <iconify-icon noobserver icon="ph:warning-bold" width="32"
          ></iconify-icon>
          {$t("user.settings.revealNsec")}
        {/if}
      </button>
    </div>

    {#if revealNsec}
      <button
        type="button"
        class="btn break-all !h-auto font-normal leading-normal flex-nowrap"
        onclick={() => copy(nsec)}
      >
        <div>{nsec}</div>

        <iconify-icon noobserver icon="ph:copy-bold" width="32"></iconify-icon>
      </button>
    {/if}
  </div>
{/if}
