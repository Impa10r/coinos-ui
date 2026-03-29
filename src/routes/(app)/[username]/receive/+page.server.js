import getRates from "$lib/rates";
import { redirect } from "@sveltejs/kit";
import { PUBLIC_DOMAIN } from "$env/static/public";

export const load = async ({ cookies, params: { username }, parent }) => {
  const token = cookies.get("token");
  const rates = await getRates();
  if (!token) redirect(307, `/pay/${username}`);
  const { subject } = await parent();
  return {
    rate: rates[subject.currency],
    text: `${username}@${PUBLIC_DOMAIN}`,
  };
};
