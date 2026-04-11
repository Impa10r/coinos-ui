<script lang="ts">
  import { avatar } from "$lib/store";
  import punks from "$lib/punks";

  interface Props {
    user: any;
    size?: number;
    disabled?: boolean;
  }

  let { user, size = 32, disabled = false }: Props = $props();

  let s = $derived(size.toString());
  let link = $derived(
    user ? (user.anon ? `/${user.pubkey}` : `/${user.username}`) : undefined,
  );

  let base = "/api/public";
  let profile = $derived(
    user?.picture?.startsWith("/api/public/")
      ? user.picture
      : user?.profile
        ? `${base}/${user.profile}.webp`
        : user?.picture,
  );
  let fallback = $derived.by(() => {
    const k = user?.pubkey || user?.id || "aa";
    const index = Math.floor((parseInt(k.slice(-2), 16) / 256) * 64);
    return `${base}/${punks[index]}.webp`;
  });
  let tmp = $derived($avatar?.id && $avatar.id === user?.id && $avatar.src);
  let errored = $state(false);
  let src = $derived(errored ? fallback : tmp || profile || fallback);
  $effect(() => {
    void profile;
    errored = false;
  });
</script>

{#snippet body()}
  <div
    class="w-{s} h-{s} rounded-full border-4 border-base-100 overflow-hidden bg-gradient-to-r from-primary to-gradient flex justify-center items-center"
  >
    <img
      {src}
      onerror={() => (errored = true)}
      class="w-full h-full object-cover object-center overflow-hidden"
      alt={user?.username}
    />
  </div>
{/snippet}

{#if disabled}
  {@render body()}
{:else if link}
  <a href={link} class:pointer-events-none={disabled}>
    {@render body()}
  </a>
{:else}
  {@render body()}
{/if}
