<script lang="ts">
  import { t } from "$lib/translations";

  function linkCoinos(text: string): string {
    return text.replace(
      /coinos\.io/,
      '<a href="https://github.com/CoinOS" target="_blank" rel="noreferrer" class="link">coinos.io</a>',
    );
  }
</script>

<div class="flex justify-center">
  <div class="mx-auto w-full md:w-2/3 lg:w-[700px] space-y-6">
    <h3 class="text-5xl font-medium">
      {$t("about.header")}
    </h3>
    <p class="text-xl text-secondary">
      {@html linkCoinos($t("about.description"))}
    </p>
    <ul class="text-xl text-secondary space-y-3 list-disc ml-8">
      <li>{$t("about.feature1")}</li>
      <li>{$t("about.feature2")}</li>
      <li>{$t("about.feature3")}</li>
      <li>{$t("about.feature4")}</li>
      <li>{$t("about.feature5")}</li>
      <li>{$t("about.feature6")}</li>
    </ul>
  </div>
</div>
<div class="pb-20"></div>
