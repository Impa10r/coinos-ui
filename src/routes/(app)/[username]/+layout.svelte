<script lang="ts">
  import type { Snippet } from "svelte";
  let { children, fixed }: { children: Snippet; fixed?: Snippet } = $props();
</script>

<div class="content">
  {@render children?.()}
</div>

{@render fixed?.()}
