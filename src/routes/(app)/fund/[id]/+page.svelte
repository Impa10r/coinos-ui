<script>
  import Amount from "$comp/Amount.svelte";
  import Payments from "$comp/Payments.svelte";
  import { page } from "$app/stores";
  import Avatar from "$comp/Avatar.svelte";
  import { t } from "$lib/translations";
  import { loc } from "$lib/utils";
  import { loginRedirect } from "$lib/store";

  let { data } = $props();

  let { amount, payments, managers, rate, user } = $derived(data);
  let { id } = $page.params;
  let locale = $derived(loc(user));

  let currency = $derived(user ? user.currency : "CAD");

  $effect(() => {
    $loginRedirect = $page.url.pathname;
  });

  let show = $state();
  let href = $derived(encodeURIComponent($page.url.href));
</script>

<div class="container px-4 max-w-4xl mx-auto mt-10 space-y-5">
  <div class="flex justify-center items-center">
    <div
      class="md:shadow-xl rounded-3xl md:px-10 pt-5 pb-10 space-y-5 w-full md:mx-5"
    >
      {#if show}
        <div class="max-w-[360px] mx-auto">
          <img
            src={`/qr/${href}/raw`}
            class="z-10 border-4 border-white w-"
            alt="URL"
          />
        </div>
      {/if}
      <div class="flex justify-center gap-4">
        <Amount {amount} {currency} {rate} {locale} />
      </div>
      <div class="flex flex-wrap space-y-2 items-center">
        <div class="grow text-center">
          <div class="font-bold text-xl">
            <div>{$t("funds.withdrawAccess")}</div>
          </div>
          {#if managers.length}
            <div class="flex justify-center">
              {#each managers as c, i}
                <div class:-ml-3={i > 0}>
                  <a href={`/pay/${c.username}`} class="contents">
                    <Avatar user={c} size={12} />
                  </a>
                </div>
              {/each}
            </div>
          {:else}
            <div>{$t("funds.anyone")}</div>
          {/if}
        </div>

        {#if (user && !managers.length) || managers.some((m) => m.id === user?.id)}
          <a
            href={`/fund/${id}/access`}
            class="btn !w-auto ml-auto text-secondary grow"
          >
            <iconify-icon icon="ph:gear-bold" width={32}></iconify-icon>
            {$t("funds.manage")}
          </a>
        {/if}
      </div>
      <div class="flex flex-wrap gap-2" data-sveltekit-prefetch="off">
        <div class="grow">
          <a href={`/send/fund/${id}`}>
            <button class="btn">
              <iconify-icon noobserver icon="ph:plus-bold" width="32"
              ></iconify-icon>
              {$t("payments.addFunds")}
            </button>
          </a>
        </div>
        {#if !managers.length || managers.some((m) => m.id === user?.id)}
          <div class="grow">
            <a href={`/fund/${id}/withdraw`}>
              <button class="btn">
                <iconify-icon
                  noobserver
                  icon="ph:hand-coins-bold"
                  width="32"
                  flip="horizontal"
                ></iconify-icon>
                {$t("payments.takeFunds")}
              </button>
            </a>
          </div>
        {/if}
      </div>
      <div class="flex gap-2" data-sveltekit-prefetch="off">
        <a href={`/qr/${href}`} class="btn !w-auto grow">
          <iconify-icon noobserver icon="ph:link-bold" width="32"
          ></iconify-icon>
          <div class="my-auto">{$t("payments.shareLink")}</div>
        </a>
        <a href={`${$page.url.pathname}/gift`} class="btn !w-auto grow">
          <iconify-icon noobserver icon="ph:gift-bold" width="32"
          ></iconify-icon>
          <div class="my-auto">{$t("payments.giftLink")}</div>
        </a>
        <!-- <a href={`/qr/${lnurlw}`} class="btn !w-auto grow"> -->
        <!--   <iconify-icon -->
        <!--     noobserver -->
        <!--     icon="ph:lightning-fill" -->
        <!--     width="24" -->
        <!--     class="text-yellow-300" -->
        <!--   ></iconify-icon> -->
        <!--   {$t("payments.lnurlw")} -->
        <!-- </a> -->
      </div>
      <Payments {payments} fund={true} {locale} {user} />
    </div>
  </div>
</div>
