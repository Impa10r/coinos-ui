<script>
  import { t } from "$lib/translations";
  import { PUBLIC_DOMAIN_FIPS, PUBLIC_DOMAIN } from "$env/static/public";

  let fipsUrl = $derived(
    PUBLIC_DOMAIN_FIPS ? `https://${PUBLIC_DOMAIN_FIPS}` : null,
  );
  let npub = $derived(
    PUBLIC_DOMAIN_FIPS ? PUBLIC_DOMAIN_FIPS.replace(/\.fips$/, "") : null,
  );
</script>

<div class="container px-4 max-w-2xl mx-auto space-y-10 mt-10 mb-20">
  <h1 class="text-3xl font-bold text-center">{$t("fips.title")}</h1>

  <p class="text-secondary text-lg">
    <a
      href="https://fips.network"
      target="_blank"
      rel="noreferrer"
      class="underline underline-offset-4">FIPS</a
    >
    {$t("fips.description")}
  </p>

  <div class="space-y-8">
    <div class="space-y-3">
      <h2 class="text-xl font-bold">{$t("fips.step1.title")}</h2>
      <p class="text-secondary">{$t("fips.step1.description")}</p>
      <a href="https://fips.network" target="_blank" rel="noreferrer">
        <button class="btn">FIPS.network →</button>
      </a>
    </div>

    <div class="space-y-3">
      <h2 class="text-xl font-bold">{$t("fips.step2.title")}</h2>
      <p class="text-secondary">{$t("fips.step2.description")}</p>
      <a href="/fips-ca.pem" download="coinos-fips-ca.pem">
        <button class="btn">{$t("fips.step2.download")}</button>
      </a>
      <div class="space-y-4 mt-4">
        <div class="space-y-1">
          <p class="font-semibold">Firefox</p>
          <p class="text-secondary text-sm">{$t("fips.step2.firefox")}</p>
        </div>
        <div class="space-y-1">
          <p class="font-semibold">Chrome / Edge</p>
          <p class="text-secondary text-sm">{$t("fips.step2.chrome")}</p>
        </div>
        <div class="space-y-1">
          <p class="font-semibold">{$t("fips.step2.linux")}</p>
          <pre
            class="bg-base-200 rounded-xl p-4 text-sm overflow-x-auto">sudo cp coinos-fips-ca.pem /usr/local/share/ca-certificates/coinos-fips.crt
sudo update-ca-certificates</pre>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h2 class="text-xl font-bold">{$t("fips.step3.title")}</h2>
      <p class="text-secondary">{$t("fips.step3.description")}</p>
      {#if fipsUrl}
        <a href={fipsUrl} target="_blank" rel="noreferrer">
          <button class="btn btn-accent">{$t("fips.step3.open")}</button>
        </a>
      {:else}
        <p class="text-secondary italic">{$t("fips.step3.notConfigured")}</p>
      {/if}
    </div>

    {#if npub}
    <div class="space-y-3">
      <h2 class="text-xl font-bold">{$t("fips.step4.title")}</h2>
      <p class="text-secondary">{$t("fips.step4.description")}</p>
      <pre class="bg-base-200 rounded-xl p-4 text-sm overflow-x-auto">- npub: "{npub}"
  alias: "coinos"
  addresses:
    - transport: udp
      addr: "{PUBLIC_DOMAIN}:2121"
  connect_policy: auto_connect</pre>
    </div>
    {/if}
  </div>
</div>
