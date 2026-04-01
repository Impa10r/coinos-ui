<script>
  import { PUBLIC_DOMAIN } from "$env/static/public";
  import { t } from "$lib/translations";
</script>

<div
  class="mx-auto md:shadow-xl rounded-3xl max-w-xl w-full md:w-[480px] md:p-8 mb-20 space-y-5"
>
  <h1 class="text-2xl font-bold text-center">{$t("login.reset")}</h1>

  <div class="text-secondary">
    {$t("login.resetDesc")}
    <a href={`mailto:support@${PUBLIC_DOMAIN}`} class="font-bold"
      >support@{PUBLIC_DOMAIN}</a
    >
  </div>
</div>
