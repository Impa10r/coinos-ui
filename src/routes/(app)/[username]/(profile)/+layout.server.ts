import getRates from "$lib/rates";

export async function load({ depends, parent }) {
  depends("app:user");

  const rates = await getRates();
  const { subject } = await parent();

  // const { follows, followers } = await get(`/${subject.pubkey}/count`);
  // let followList = new Promise((r) => r([]));
  // if (user)
  // 	followList = get(`/${user.pubkey}/follows?pubkeysOnly=true`).catch(
  // 		() => [],
  // 	);

  const followList = new Promise((r) => r([]));
  const follows = [];
  const followers = [];

  return { follows, followers, followList, rate: rates[subject.currency] };
}
