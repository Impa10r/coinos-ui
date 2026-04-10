<script lang="ts">
  import { t } from "$lib/translations";
  import { upload } from "$lib/upload";
  import { fail } from "$lib/utils";
  import { applyAction, deserialize } from "$app/forms";
  import Spinner from "$comp/Spinner.svelte";
  let { item = $bindable(), user } = $props();

  let fileInput = $state<HTMLInputElement | undefined>();
  let formElement = $state<HTMLFormElement | undefined>();
  let file: File | undefined;
  let submitting = $state(false);
  let progress: any;
  let select = () => fileInput?.click();
  let src = $state<string | undefined>();

  let tooLarge: Record<string, boolean> = {};
  let handleFile = async (e: Event, type: string) => {
    const target = e.target as HTMLInputElement;
    tooLarge[type] = false;
    file = target.files?.[0];
    if (!file) return;

    if (file.size > 10000000) return void (tooLarge[type] = true);

    var reader = new FileReader();
    reader.onload = async (ev) => {
      src = ev.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: Event) {
    e.preventDefault();
    try {
      submitting = true;
      let data = new FormData(formElement);

      if (src && file) {
        try {
          let { hash } = JSON.parse(
            (await upload(file, "item", progress)) as string,
          );

          data.set("image", hash);

          await fetch(`/api/public/${hash}.webp`, {
            cache: "reload",
            mode: "no-cors",
          });
        } catch (err) {
          console.log("problem upsubmitting avatar", err);
        }
      }

      const response = await fetch(formElement!.action, {
        method: "POST",
        body: data,
      });

      const result = deserialize(await response.text());

      applyAction(result);
    } catch (err) {
      console.log(err);
      fail("Something went wrong");
    }

    submitting = false;
  }
</script>

<form
  method="POST"
  class="space-y-5"
  onsubmit={handleSubmit}
  bind:this={formElement}
>
  <input type="hidden" name="id" bind:value={item.id} />
  <input type="hidden" name="image" bind:value={item.image} />

  <div>
    <label for="name" class="font-bold mb-1 block">{$t("items.name")}</label>
    <input name="name" bind:value={item.name} />
  </div>

  <div>
    <label for="price" class="font-bold mb-1 block">{$t("items.price")}</label>
    <div class="flex">
      <input
        name="price"
        bind:value={item.price}
        class="border-r-none rounded-r-none"
      />
      <div
        class="text-gray-600 rounded-r-2xl p-4 my-auto rounded-l-none rounded border bg-gray-100"
      >
        {user.currency}
      </div>
    </div>
  </div>

  <div class="w-full">
    <label for="img" class="font-bold mb-1 block">{$t("items.image")}</label>

    <div class="grid sm:grid-cols-2 gap-4">
      <div class="h-64 rounded-2xl overflow-hidden">
        {#if src}
          <button type="button" onclick={select} class="w-full h-full p-0 border-0">
            <img {src} alt={item.name} class="object-cover w-full h-full" />
          </button>
        {:else if item.image}
          <button type="button" onclick={select} class="w-full h-full p-0 border-0">
            <img src={`/api/public/${item.image}.webp`} alt={item.name} class="object-cover w-full h-full" />
          </button>
        {:else}
          <button
            type="button"
            aria-label="Select image"
            class="bg-gradient-to-r from-primary to-gradient mb-4 cursor-pointer hover:opacity-80 w-full h-full"
            onclick={select}
          ></button>
        {/if}
      </div>
    </div>

    <input
      type="file"
      class="hidden"
      bind:this={fileInput}
      onchange={(e) => handleFile(e as Event, "item")}
    />
  </div>

  <button
    class="rounded-full py-5 px-6 font-bold hover:opacity-80 bg-black text-white text-2xl w-full text-center"
  >
    {#if submitting}
      <Spinner />
    {:else}
      {$t("items.submit")}
    {/if}
  </button>
</form>
