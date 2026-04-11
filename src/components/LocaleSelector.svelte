<script>
  import { t, locale, locales } from "$lib/translations";
  let { onClose = undefined } = $props();

  const handleChange = ({ currentTarget }) => {
    const { value } = currentTarget;
    document.cookie = `lang=${value}; path=/`;
    $locale = value;
    onClose?.();
  };
</script>

<select name="language" value={$locale} onchange={handleChange}>
  {#each $locales as locale}
    <option value={locale}>{$t(`lang.${locale}`)}</option>
  {/each}
</select>
