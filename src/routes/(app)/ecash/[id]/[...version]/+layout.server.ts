import getRates from "$lib/rates";
import { get } from "$lib/utils";

export async function load({ params, parent }) {
  const { user } = await parent();
  const rates = await getRates();
  let { id } = params;
  let version: number = params.version ? parseInt(params.version) : 4;

  const { token, status } = await get(`/cash/${id}/${version}`);
  const { spent, total, mint, external } = status;
  return {
    id,
    token,
    spent,
    total,
    mint,
    external,
    version,
    rate: rates[user?.currency || "USD"],
  };
}
