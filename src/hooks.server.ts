import { ipStore } from "$lib/server/ip";
import { setIpGetter } from "$lib/utils";
import { PUBLIC_DOMAIN_TOR } from "$env/static/public";
import type { Handle } from "@sveltejs/kit";

setIpGetter(() => ipStore.getStore());

export const handle: Handle = async ({ event, resolve }) => {
  const ip =
    event.request.headers.get("cf-connecting-ip") ||
    event.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    event.getClientAddress();

  const response = await ipStore.run(ip, () => resolve(event));

  if (PUBLIC_DOMAIN_TOR) {
    const headers = new Headers(response.headers);
    headers.set(
      "Onion-Location",
      `http://${PUBLIC_DOMAIN_TOR}${event.url.pathname}${event.url.search}`,
    );
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
};
