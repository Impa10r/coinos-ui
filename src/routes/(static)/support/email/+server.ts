import { env } from "$env/dynamic/private";
import { json } from "@sveltejs/kit";

export const GET = () => json({ email: env.SUPPORT_EMAIL ?? "" });
