export default function PayPalCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-7 text-center">
        <h1 className="text-xl font-semibold">Checkout cancelled</h1>
        <p className="mt-3 text-sm text-zinc-300">PayPal checkout was cancelled. You have not been charged by this checkout attempt.</p>
        <a href="/dashboard" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900">Return to YourThumb</a>
      </section>
    </main>
  );
}
