import { signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ referralCode }: { referralCode?: string }) {
  return (
    <form action={signInWithGoogle.bind(null, referralCode)}>
      <Button
        type="submit"
        className="h-11 w-full rounded-full bg-[#111] text-white shadow-none hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-100"
      >
        Continue with Google
      </Button>
    </form>
  );
}
