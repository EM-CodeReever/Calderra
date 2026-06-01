import { redirect } from "@sveltejs/kit";
import { prisma } from '$lib/index';

export async function load ({ locals: { supabase }, cookies }) {
    const auth = await supabase.auth.getSession();
    const user = await supabase.auth.getUser();
    if (!auth?.data.session) {
        console.log("No active session found, redirecting to login page.");
        throw redirect(303,"/login");
    }
    let userProfile
    if (auth?.data.session?.access_token) {
        cookies.set("sessionToken",auth.data.session?.access_token,{
            path: "/memory-card",
            httpOnly: true,
        })
        userProfile = await prisma.profile.findFirst({
            where: {
                auth_email: user.data.user?.email,
            },
        });
    }
    return {userProfile};
}
