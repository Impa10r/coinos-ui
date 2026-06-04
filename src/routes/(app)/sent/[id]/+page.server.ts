import { auth, get } from "$lib/utils";

export const load = async ({ cookies, params, depends }) => {
  depends("app:sent-payment");
  const { id } = params;
  const p = await get(`/payments/${id}`, auth(cookies)).catch(() => null);
  return { ...(p ?? {}), id, p };
};
