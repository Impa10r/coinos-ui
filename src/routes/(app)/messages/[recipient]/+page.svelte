<script>
  import { run, preventDefault } from "svelte/legacy";

  import { cubicInOut } from "svelte/easing";
  import { format } from "date-fns";
  import Avatar from "$comp/Avatar.svelte";
  import Icon from "$comp/Icon.svelte";
  import { back, fail, focus } from "$lib/utils";
  import { sign, send, encrypt, decrypt } from "$lib/nostr";
  import { event as e, password } from "$lib/store";
  import { tick, untrack } from "svelte";
  import { getEventHash } from "nostr-tools";

  let { data } = $props();

  function fadeScale(
    node,
    { delay = 0, duration = 200, easing = (x) => x, baseScale = 0 },
  ) {
    const o = +getComputedStyle(node).opacity;
    const m = getComputedStyle(node).transform.match(/scale\(([0-9.]+)\)/);
    const s = m ? Number(m[1]) : 1;
    const is = 1 - baseScale;

    return {
      delay,
      duration,
      css: (t) => {
        const eased = easing(t);
        return `opacity: ${eased * o}; transform: scale(${
          eased * s * is + baseScale
        })`;
      },
    };
  }

  let { messages, recipient, user } = $state(untrack(() => ({ ...data })));
  let pane = $state();

  let initialize = async (_p) => {
    await Promise.all(
      messages.map(
        async (event) =>
          /** @type {any} */ (event.message = await decrypt({ event, user })),
      ),
    );

    messages = messages;
    tick().then(() => pane && (pane.scrollTop = pane.scrollHeight));
  };

  e.subscribe(async (ev) => {
    const event = /** @type {any} */ (ev);
    let found = ~messages.findIndex(
      (m) => /** @type {any} */ (m).id === event?.id,
    );
    if (event?.recipient?.id === user.id && !found) {
      event.message = await decrypt({ event, user });
      messages.push(event);
      messages = messages;
      tick().then(() => pane && (pane.scrollTop = pane.scrollHeight));
    }
  });

  let message = $state();
  let submit = async () => {
    let event = {
      pubkey: user.pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 4,
      tags: [["p", recipient.pubkey]],
    };

    event.message = message;

    message = "";

    event.author = user;
    event.recipient = recipient;

    messages.push(/** @type {any} */ (event));
    messages = messages;
    tick().then(() => pane && (pane.scrollTop = pane.scrollHeight));

    try {
      event.content = await encrypt({
        message: event.message,
        recipient: recipient.pubkey,
        user,
      });
      event.id = getEventHash(/** @type {any} */ (event));
      await sign(/** @type {any} */ (event), user);
      await send(/** @type {any} */ (event));
    } catch (e) {
      console.log(e);
      fail("Failed to send message");
    }

    message = "";
  };

  let keydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };
  run(() => {
    initialize($password);
  });
</script>

<div class="container max-w-xl mx-auto px-4 space-y-5">
  <button
    type="button"
    class="hover:opacity-80"
    data-sveltekit-preload-data="false"
    onclick={back}
  >
    <Icon icon="arrow-left" style="w-10" />
  </button>

  <div
    class="h-[50vh] max-h-[50vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-[#F2F6FC] scrollbar-track-white pr-8"
    bind:this={pane}
  >
    {#each messages as _m (/** @type {any} */ (_m).id)}
      {@const { author, message, created_at, pubkey } = /** @type {any} */ (_m)}
      {@const ours = pubkey === user.pubkey}
      {@const theirs = !ours}

      {#if message}
        <div
          class="flex gap-2"
          class:flex-row-reverse={theirs}
          class:justify-end={theirs}
          in:fadeScale={{
            easing: cubicInOut,
            baseScale: 0.5,
          }}
        >
          <div
            class="rounded-2xl px-4 py-2 max-w-[300px] mb-1 text-lg"
            class:ours
            class:theirs
          >
            {message}
          </div>
          <div class="mt-auto">
            <Avatar user={author} size={12} />
          </div>
        </div>
        <div class="text-sm text-gray-400 mb-6" class:text-right={ours}>
          {format(new Date(created_at * 1000), "MMM d")},
          {format(new Date(created_at * 1000), "h:mm aa")}
        </div>
      {/if}
    {/each}
  </div>

  <form
    method="POST"
    class="w-full border rounded-xl outline-none gap-4 flex p-0 pr-2"
    onsubmit={preventDefault(submit)}
  >
    <input type="hidden" name="requester_id" value={user.id} />
    <input type="hidden" name="recipient" value={recipient.username} />

    <div
      use:focus
      contenteditable
      class="grow break-all py-4 outline-none mt-0 pl-4"
      oninput={(e) => (message = /** @type {any} */ (e.target)?.innerText)}
      onkeydown={keydown}
    ></div>
    <button type="submit" class="my-auto shrink-0">
      <Icon icon="send" style="w-8" />
    </button>
  </form>
</div>

<style>
  .ours {
    background: linear-gradient(to right, #f2f6fc, #e1e3ff);
    color: rgb(0 0 0);
    border-bottom-right-radius: 0;
    margin-left: auto;
  }

  .theirs {
    background-color: rgb(243 244 246);
    color: rgb(0 0 0);
    border-bottom-left-radius: 0;
  }
</style>
