<script>
  import Avatar from "$comp/Avatar.svelte";
  import { request } from "$lib/store";
  /** @type {any} */
  $: req = $request;
</script>

Invoice sent to
<div class="flex">
  <Avatar user={req?.requester} size={12} />
  <h1 class="my-auto"><b>{req?.requester?.username}</b> is ready to pay</h1>
</div>
