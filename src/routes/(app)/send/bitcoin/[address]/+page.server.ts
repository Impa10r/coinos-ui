import getRates from "$lib/rates";
import { auth, get } from "$lib/utils";

export async function load({ cookies, parent }) {
  const { user } = await parent();
  const rates = await getRates();
  const aid = cookies.get("aid") || user.id;
  const [{ balance }, { amount: usdtHotBalance }] = await Promise.all([
    get(`/account/${aid}`, auth(cookies)),
    get("/liquid/usdt/balance", auth(cookies)),
  ]);
  return {
    balance,
    usdtHotBalance,
    rate: rates[user.currency],
    usdtRate: rates["USDT"] || rates["USD"],
  };
}
