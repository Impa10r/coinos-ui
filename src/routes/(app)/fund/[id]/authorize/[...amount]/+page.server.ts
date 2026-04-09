import getRates from "$lib/rates";
import { auth, get, post, sats } from "$lib/utils";
import { error, redirect } from "@sveltejs/kit";

export async function load({ cookies, params, parent }) {
  const { user } = await parent();
  const { id } = params;
  let [amountStr, currency] = params.amount.split("/");
  let fiat: number | undefined;
  let amount: number | string;

  if (!currency) currency = user?.currency;
  if (currency) currency = currency.toUpperCase();

  const rates = await getRates();
  const rate = rates[currency || "USD"];
  if (currency && !rate) error(500, "Invalid currency symbol");

  if (!amountStr) {
    const balance = await get(`/fund/${id}`);
    amount = balance.amount;
  } else if (currency) {
    fiat = Number(amountStr);
    amount = Math.round((fiat * sats) / rate);
  } else {
    amount = amountStr;
  }

  if (!amount) redirect(307, `/fund/${id}`);

  try {
    await post("/authorize", { amount, currency, fiat, id }, auth(cookies));
  } catch (e) {
    console.log("caught", e);
    redirect(307, `/fund/${id}`);
  }

  return { amount, currency, id, rate, rates };
}
