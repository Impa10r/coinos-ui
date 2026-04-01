<script>
  import { PUBLIC_SIMPLEX_URL, PUBLIC_TELEGRAM_URL } from "$env/static/public";
  import { t } from "$lib/translations";
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
</div>
