<script>
  import LandingHeader from "$comp/LandingHeader.svelte";
  import { untrack } from "svelte";
  let { data, children } = $props();
  let { user } = $state(untrack(() => data));
</script>

<LandingHeader {user} />
<main class="container px-10 md:px-40 mx-auto min-h-[600px] pb-20">
  {@render children?.()}
</main>
