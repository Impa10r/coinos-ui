import { env } from "$env/dynamic/private";

export const load = () => ({ hasEmail: !!env.SUPPORT_EMAIL });
