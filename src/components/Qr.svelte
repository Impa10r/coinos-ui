<script>
  import screenfull from "screenfull";
  let { icon, text } = $props();
  let qr = $state();

  let src = $derived(
    `/qr/${encodeURIComponent(text)}` + (icon ? `/${icon}` : "/raw"),
  );
</script>

<div
  class="w-72 sm:w-80 mx-auto cursor-pointer"
  bind:this={qr}
  role="button"
  tabindex="0"
  onclick={() => screenfull.toggle(qr)}
  onkeydown={() => screenfull.toggle(qr)}
>
  <img {src} class="mx-auto" alt="QR Code" />
</div>
