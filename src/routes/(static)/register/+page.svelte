<script>
  /* global grecaptcha */
  import { PUBLIC_RECAPTCHA_SITE_KEY } from "$env/static/public";
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";
  import punks from "$lib/punks";
  import { upload } from "$lib/upload";
  import { afterNavigate, invalidateAll } from "$app/navigation";
  import { applyAction, deserialize } from "$app/forms";
  import { tick, untrack } from "svelte";
  import { fly } from "svelte/transition";

  import Pin from "$comp/Pin.svelte";
  import Spinner from "$comp/Spinner.svelte";
  import PasswordInput from "$comp/PasswordInput.svelte";

  import { focus, fail } from "$lib/utils";
  import { avatar, signer, password, pin, loginRedirect } from "$lib/store";
  import { t } from "$lib/translations";
  import { page } from "$app/stores";
  import {
    NumberDictionary,
    uniqueNamesGenerator,
    colors,
    animals,
  } from "unique-names-generator";
  import { sign } from "$lib/nostr";

  let { form, data } = $props();
  let { challenge } = $derived(data);
  let recaptchaSiteKey = PUBLIC_RECAPTCHA_SITE_KEY;
  let isTor = browser && location.hostname.endsWith(".onion");

  onMount(() => {
    if (!isTor && recaptchaSiteKey) {
      let s = document.createElement("script");
      s.src =
        "https://www.google.com/recaptcha/api.js?render=" + recaptchaSiteKey;
      document.head.appendChild(s);
    }
  });

  onMount(() => {
    if (browser) {
      setTimeout(() => {
        password.set(undefined);
        pin.set(undefined);
        signer.set(undefined);
        localStorage.clear();
        sessionStorage.clear();
      }, 50);
    }
  });

  let username = $state();
  let index = $state(untrack(() => data.index));
  let revealPassword = $state(false);

  let cleared;
  let clear = () => {
    if (!cleared) {
      cleared = true;
      username = "";
      $password = "";
      revealPassword = false;
    }
  };

  let refresh = async (e) => {
    e.preventDefault();
    cleared = false;

    username = uniqueNamesGenerator({
      dictionaries: [animals, NumberDictionary.generate({ min: 10, max: 99 })],
      length: 2,
      separator: "",
    });

    $password = uniqueNamesGenerator({
      dictionaries: [colors, NumberDictionary.generate({ min: 100, max: 999 })],
      length: 2,
      separator: "",
    });

    revealPassword = true;
  };

  afterNavigate(async () => {
    try {
      await invalidateAll();
    } catch (e) {
      console.log(e);
    }
  });

  let token = $state();
  let redirect;

  let cancel = () => {
    need2fa = false;
    return "";
  };

  let btn = $state();

  let loading = $state();
  const getRecaptchaToken = () =>
    new Promise((resolve, reject) => {
      if (isTor || !recaptchaSiteKey) return resolve("");
      if (
        !browser ||
        typeof (/** @type {any} */ (window).grecaptcha) === "undefined"
      )
        return resolve("");
      let gc = /** @type {any} */ (window).grecaptcha;
      gc.ready(() => {
        gc.execute(recaptchaSiteKey, { action: "register" })
          .then(resolve)
          .catch(reject);
      });
    });

  async function handleSubmit(e) {
    e.preventDefault();

    loading = true;

    let formEl = /** @type {HTMLFormElement} */ (e.currentTarget);
    let formData = new FormData(formEl);
    let user = Object.fromEntries(formData);
    user.username = String(user.username).replace(/\s*/g, "");

    for (let k in user) {
      formData.set(k, user[k]);
    }

    try {
      const recaptcha = await getRecaptchaToken();
      formData.set("recaptcha", recaptcha);
    } catch (err) {
      fail(err instanceof Error ? err.message : "captcha failed");
      loading = false;
      return;
    }

    formData.set(
      "picture",
      `${$page.url.origin}/api/public/${punks[index]}.webp`,
    );
    if ($avatar) {
      try {
        let av = /** @type {any} */ ($avatar);
        let { hash } = JSON.parse(
          /** @type {string} */ (await upload(av.file, av.type, av.progress)),
        );

        let url = `${$page.url.origin}/api/public/${hash}.webp`;
        formData.set("picture", url);
        await fetch(url, {
          cache: "reload",
          mode: "no-cors",
        });
      } catch (e) {
        console.log("problem uploading avatar", e);
      }
    }

    const response = await fetch("/register", {
      method: "POST",
      body: formData,
    });

    const result = deserialize(await response.text());

    if (result.type === "success") {
      await invalidateAll();
    }

    applyAction(result);
    loading = false;
  }

  let avatarInput = $state();
  let decr = () => (index = index <= 0 ? 63 : index - 1);
  let incr = () => (index = index >= 63 ? 0 : index + 1);
  let selectAvatar = () => avatarInput.click();

  let progress;
  let customSrc = $state("");
  let handleFile = async ({ target }) => {
    let type = "picture";
    let file = target.files[0];
    if (!file) return;

    if (file.size > 10000000) {
      if (form) /** @type {any} */ (form).error = "File too large";
    }
    $avatar = /** @type {any} */ ({ file, type, progress });

    var reader = new FileReader();
    reader.onload = async (e) => {
      customSrc = /** @type {string} */ (e.target?.result) || "";
    };

    reader.readAsDataURL(file);
  };

  let need2fa = $derived(/** @type {any} */ (form)?.message === "2fa");
  let defaultSrc = $derived(`/api/public/${punks[index]}.webp`);
  let src = $derived(customSrc || defaultSrc);

  $effect(() => {
    if (need2fa && /** @type {any} */ (form)?.token === token) token = "";
  });

  $effect(() => {
    if (token && token?.length === 6) void tick().then(() => btn.click());
  });

  let nostrLogin = async () => {
    let event = {
      kind: 27235,
      created_at: Date.now(),
      content: "",
      tags: [
        ["u", `${$page.url.origin}/api/nostrAuth`],
        ["method", "POST"],
        ["challenge", challenge],
      ],
    };

    let user = /** @type {any} */ ({});
    let signedEvent = await sign(event, user);

    const formData = new FormData();

    try {
      const recaptcha = await getRecaptchaToken();
      formData.append("loginRedirect", redirect ?? "");
      formData.append("token", token ?? "");
      formData.append("event", JSON.stringify(signedEvent));
      formData.append("challenge", challenge);
      formData.append("recaptcha", recaptcha);

      let response = await fetch("/login?/nostr", {
        method: "POST",
        body: formData,
      });

      const result = deserialize(await response.text());

      if (result.type === "success") {
        await invalidateAll();
      }

      applyAction(result);
    } catch (e) {
      fail(e instanceof Error ? e.message : String(e));
    }
  };

  onDestroy(() => {
    if (!browser) return;
    const nodeBadge = document.querySelector(".grecaptcha-badge");
    if (nodeBadge && nodeBadge.parentNode) {
      document.body.removeChild(nodeBadge.parentNode);
    }

    const scriptSelector =
      "script[src='https://www.google.com/recaptcha/api.js?render=" +
      recaptchaSiteKey +
      "']";
    const script = document.querySelector(scriptSelector);
    if (script) {
      script.remove();
    }
  });
</script>

{#if need2fa}
  <Pin bind:value={token} title="Enter 2FA Code" {cancel} notify={false} />
{/if}

<div
  class="mx-auto md:shadow-xl rounded-3xl max-w-xl w-full md:w-[480px] md:p-8 space-y-5 mb-20"
>
  <h1 class="text-2xl font-bold text-center">{$t("login.createAccount")}</h1>
  <input
    type="file"
    class="hidden!"
    bind:this={avatarInput}
    onchange={(e) => handleFile(e)}
  />

  <div class="relative">
    <button
      class="absolute w-8 h-12 left-12 bg-base-100 rounded top-12"
      onclick={decr}
      aria-label="Previous"
    >
      <iconify-icon noobserver icon="ph:caret-left-bold" width="32"
      ></iconify-icon>
    </button>
    <button class="block relative w-32 mx-auto" onclick={selectAvatar}>
      <div
        class="w-32 h-32 rounded-full border-4 border-white overflow-hidden flex mx-auto relative"
      >
        <img
          {src}
          class="w-full h-full object-cover object-center overflow-hidden"
          alt={username}
        />
      </div>
      <div
        class="absolute bg-base-100 rounded-full p-2 mx-auto right-0 bottom-0 z-10 w-12"
      >
        <iconify-icon noobserver icon="ph:upload-simple-bold" width="24"
        ></iconify-icon>
      </div>
    </button>
    <button
      class="absolute w-8 h-12 right-12 bg-base-100 rounded top-12"
      onclick={incr}
      aria-label="Next"
    >
      <iconify-icon noobserver icon="ph:caret-right-bold" width="32"
      ></iconify-icon>
    </button>
  </div>

  {#if /** @type {any} */ (form)?.error || /** @type {any} */ (form)?.message}
    <div class="text-red-600 text-center" in:fly>
      {/** @type {any} */ (form)?.message}
      {/** @type {any} */ (form)?.error}
    </div>
  {/if}

  <form class="space-y-5" onsubmit={handleSubmit} method="POST">
    <input
      type="hidden"
      name="loginRedirect"
      value={$loginRedirect || $page.url.searchParams.get("redirect")}
    />
    <input type="hidden" name="token" value={token} />
    <input type="hidden" name="challenge" value={challenge} />

    <label
      for="username"
      class="input flex items-center justify-center gap-2 w-full"
    >
      <input
        class="clean"
        use:focus
        name="username"
        type="text"
        required
        bind:value={username}
        onfocus={clear}
        autocapitalize="none"
        placeholder={$t("login.username")}
      />
      <button
        type="button"
        tabindex="-1"
        onclick={refresh}
        aria-label="Randomize"
        class="contents"
      >
        <iconify-icon noobserver icon="ph:dice-three-bold" width="32"
        ></iconify-icon></button
      >
    </label>

    <PasswordInput
      bind:value={$password}
      placeholder={$t("login.password")}
      bind:show={revealPassword}
    />

    <button
      type="submit"
      class="btn btn-accent"
      disabled={loading}
      bind:this={btn}
    >
      {#if loading}
        <Spinner />
      {:else}
        {$t("login.register")}
      {/if}
    </button>

    <button type="button" class="btn" onclick={nostrLogin}>
      {#if $signer?.ready}
        <div class="shrink">
          <Spinner />
        </div>
      {:else}
        <img src="/images/nostr.png" class="w-8" alt="Nostr" />
      {/if}
      <div class="my-auto">{$t("login.nostr")}</div>
    </button>

    <p class="text-secondary text-center font-medium">
      {$t("login.haveAccount")}
      <a
        href={"/login" + $page.url.search}
        class="block md:inline text-secondary underline underline-offset-4 hover:opacity-80"
      >
        {$t("login.signIn")}
      </a>
    </p>
  </form>
</div>
