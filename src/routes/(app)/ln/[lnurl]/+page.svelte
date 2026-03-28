<script>
  import Lnurlp from "$comp/Lnurlp.svelte";
  import Lnurlw from "$comp/Lnurlw.svelte";
  let { data } = $props();
  let { tag } = $derived(data);
</script>

{#if tag === "payRequest"}
  <Lnurlp {data} />
{:else if tag === "withdrawRequest"}
  <Lnurlw {data} />
{/if}
