<script>
  import Lnurlp from "$comp/Lnurlp.svelte";
  import Lnurlw from "$comp/Lnurlw.svelte";
  const props = $props();
  let { tag } = $derived(props.data);
</script>

{#if tag === "payRequest"}
  <Lnurlp data={props.data} form={props.form} />
{:else if tag === "withdrawRequest"}
  <Lnurlw data={props.data} form={props.form} />
{/if}
