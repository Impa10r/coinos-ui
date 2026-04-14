import getRates from "$lib/rates";
import { auth, post } from "$lib/utils";
import { fail, redirect } from "@sveltejs/kit";

export async function load({ params, url, parent }) {
  const { user } = await parent();
  const rates = await getRates();
  const { address, amount } = params;
  const fixedSatsParam = url.searchParams.get("sats");
  const fixedSats = fixedSatsParam ? parseInt(fixedSatsParam) : null;

  const usdtRate = rates["USDT"] || rates["USD"];
  const effectiveRate = usdtRate / 1.0015;

  const usdtAmount = parseFloat(amount);
  const btcSats =
    fixedSats ?? Math.round((usdtAmount / effectiveRate) * 100_000_000);
  const liquidFee = Math.round(btcSats * 0.001);

  return {
    address,
    usdtAmount,
    btcSats,
    liquidFee,
    fixedSats,
    usdtRate,
    rate: rates[user?.currency || "USD"],
    currency: user?.currency || "USD",
  };
}

export const actions = {
  default: async ({ cookies, request }) => {
    const formData = await request.formData();
    const address = formData.get("address") as string;
    const amount = parseFloat(formData.get("amount") as string);
    let p;
    try {
      p = await post("/liquid/usdt/send", { address, amount }, auth(cookies));
    } catch (e) {
      const { message } = e as Error;
      return fail(400, { message });
    }
    redirect(307, `/sent/${p.id}`);
  },
};
