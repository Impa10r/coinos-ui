import getRates from "$lib/rates";
import { auth, get } from "$lib/utils";

export async function load({ cookies, parent }) {
  const { user } = await parent();
  const rates = await getRates();
  const aid = cookies.get("aid") || user.id;
  const [
    { balance },
    { amount: usdtHotBalance },
    { amount: btcHotBalance },
    { amount: lbtcHotBalance },
  ] = await Promise.all([
    get(`/account/${aid}`, auth(cookies)),
    get("/liquid/usdt/balance", auth(cookies)),
    get("/bitcoin/hot-balance", auth(cookies)),
    get("/liquid/hot-balance", auth(cookies)),
  ]);
  return {
    balance,
    usdtHotBalance,
    btcHotBalance,
    lbtcHotBalance,
    rate: rates[user.currency],
    usdtRate: rates["USD"],
  };
}
