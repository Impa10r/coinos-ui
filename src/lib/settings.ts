import { auth, fd, post } from "$lib/utils";
import { fail } from "@sveltejs/kit";

type Error = {
  message: string;
};

export default async ({ cookies, request }) => {
  const form = await fd(request);

  if (form.tab === "account") {
    form.notify = form.notify === "on";
    form.push = form.push === "on";
    form.nip5 = form.nip5 === "on";
    form.prompt = form.prompt === "on";
    form.autowithdraw = form.autowithdraw === "on";
  }

  try {
    const { user, token } = await post("/user", form, auth(cookies));

    // A password change revokes every session older than it, including this
    // one, so the server hands back a replacement. Store it or the user is
    // logged out the moment they change their own password.
    if (token)
      cookies.set("token", token, {
        path: "/",
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

    if (user.language) cookies.set("lang", user.language, { path: "/" });

    return { user, success: true };
  } catch (e) {
    const { message } = e as Error;
    return fail(400, { message });
  }
};
