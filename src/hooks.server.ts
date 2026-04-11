import { ipStore } from "$lib/server/ip";
import { setIpGetter } from "$lib/utils";
import { PUBLIC_DOMAIN_TOR } from "$env/static/public";
import type { Handle, HandleServerError } from "@sveltejs/kit";

export const handleError: HandleServerError = ({ error, event }) => {
  console.error(
    `[handleError] ${event.request.method} ${event.url.pathname}`,
    error,
  );
  return { message: "Internal Error" };
};

setIpGetter(() => ipStore.getStore());

const COINOS_URL = process.env.PUBLIC_COINOS_URL || "http://localhost:3119";

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/.well-known/nostr.json") {
    const url = `${COINOS_URL}/nostr.json${event.url.search}`;
    return fetch(url);
  }

  if (event.url.pathname === "/.well-known/security.txt") {
    return fetch(`${COINOS_URL}/.well-known/security.txt`);
  }

  const ip =
    event.request.headers.get("cf-connecting-ip") ||
    event.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    event.getClientAddress();

  const response = await ipStore.run(ip, () => resolve(event));

  try {
    response.headers.set("Cache-Control", "no-store");
  } catch {}

  if (PUBLIC_DOMAIN_TOR) {
    try {
      response.headers.set(
        "Onion-Location",
        `http://${PUBLIC_DOMAIN_TOR}${event.url.pathname}${event.url.search}`,
      );
    } catch {}
  }

  return response;
};
