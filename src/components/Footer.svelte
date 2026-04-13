<script>
  import DarkToggle from "$comp/DarkToggle.svelte";
  import LocaleSelector from "$comp/LocaleSelector.svelte";
  import { t } from "$lib/translations";
  import { PUBLIC_DOMAIN_TOR, PUBLIC_DOMAIN_FIPS } from "$env/static/public";

  const connectLinks = [
    ...(PUBLIC_DOMAIN_TOR
      ? [{ url: `http://${PUBLIC_DOMAIN_TOR}`, titleID: "onion" }]
      : []),
    ...(PUBLIC_DOMAIN_FIPS ? [{ url: "/connect-via-fips", titleID: "fips" }] : []),
  ];

  const companyLinks = [
    { url: "/docs", titleID: "documentation" },
    { url: "/support", titleID: "support" },
    { url: "https://github.com/coinos", titleID: "github" },
  ];
</script>

<footer
  class="space-y-10 md:space-y-0 text-xl block md:flex justify-around pb-8 px-4"
>
  <div class="space-y-5">
    <div class="text-center w-full">
      <a href="/" aria-label="Home">
        <iconify-icon noobserver icon="coinos:logo" width="224"></iconify-icon>
      </a>
    </div>
    <div class="flex gap-2 justify-center sm:hidden">
      <div>
        <a href="/register">
          <button class="btn">
            {$t("nav.startInSeconds")}
          </button>
        </a>
      </div>
    </div>
    <div
      class="w-full flex flex-wrap sm:flex-nowrap gap-2 justify-center items-center"
    >
      <DarkToggle />
      <LocaleSelector />
    </div>
  </div>

  <div class="text-center md:text-left">
    <p class="font-semibold">{$t("footer.connect")}</p>
    <ul class="mt-5 text-secondary space-y-3 font-medium">
      {#each connectLinks as link}
        <li>
          <a
            href={link.url}
            target={link.url.startsWith("http") ? "_blank" : undefined}
            rel={link.url.startsWith("http") ? "noreferrer" : undefined}
            class="hover:opacity-80">{$t("footer." + link.titleID)}</a
          >
        </li>
      {/each}
    </ul>
  </div>

  <div class="text-center md:text-left">
    <p class="font-semibold">{$t("footer.company")}</p>
    <ul class="mt-5 text-secondary space-y-3">
      {#each companyLinks as link}
        <li>
          <a
            href={link.url}
            target={link.url.startsWith("http") ? "_blank" : undefined}
            rel={link.url.startsWith("http") ? "noreferrer" : undefined}
            class="hover:opacity-80">{$t("footer." + link.titleID)}</a
          >
        </li>
      {/each}
    </ul>
  </div>

  <iconify-icon
    noobserver
    icon="coinos:shield"
    class="flex justify-center"
    width="96"
  ></iconify-icon>
</footer>
