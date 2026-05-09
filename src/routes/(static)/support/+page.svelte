<script>
  import { PUBLIC_SIMPLEX_URL, PUBLIC_TELEGRAM_URL } from "$env/static/public";
  import { t } from "$lib/translations";
  import { page } from "$app/stores";

  let { data } = $props();

  async function compose() {
    const r = await fetch("/support/email");
    const { email } = await r.json();
    if (!email) return;
    const username = $page.data.user?.username;
    const subject = username
      ? `?subject=${encodeURIComponent(`Username: ${username}`)}`
      : "";
    window.location.href = `mailto:${email}${subject}`;
  }
</script>

<div class="container max-w-lg mx-auto space-y-8 p-4 pb-20">
  <h1 class="text-center text-3xl md:text-4xl font-semibold">
    {$t("user.support.header")}
  </h1>

  <a
    href={PUBLIC_SIMPLEX_URL}
    target="_blank"
    rel="noreferrer"
    class="btn w-full"
  >
    <iconify-icon noobserver icon="ph:chat-circle-text-bold" width="32"
    ></iconify-icon>
    {$t("user.support.chat")}
  </a>

  <a
    href={PUBLIC_TELEGRAM_URL}
    target="_blank"
    rel="noreferrer"
    class="btn w-full"
  >
    <iconify-icon noobserver icon="ph:telegram-logo-bold" width="32"
    ></iconify-icon>
    Telegram
  </a>

  {#if data.hasEmail}
    <button type="button" class="btn w-full" onclick={compose}>
      <iconify-icon noobserver icon="ph:envelope-bold" width="32"
      ></iconify-icon>
      {$t("user.support.email")}
    </button>
  {/if}
</div>
