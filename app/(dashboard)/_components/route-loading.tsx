type RouteLoadingProps = {
  title: string;
  message: string;
  variant?: "table" | "cards" | "calendar";
};

function Placeholder({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-slate-200 ${className}`} />;
}

export function RouteLoading({ title, message, variant = "table" }: RouteLoadingProps) {
  return (
    <section aria-busy="true" className="min-h-[480px] bg-[#f7f8fa] px-4 py-8 md:px-6 md:py-10">
      <div className="container mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p role="status" className="text-sm text-slate-500">{message}</p>
        </div>
        <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
          {variant === "cards" ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map(card => (
                <div key={card} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
                  <Placeholder className="h-4 w-2/3" />
                  <Placeholder className="h-12 w-1/3" />
                  <Placeholder className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : variant === "calendar" ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <Placeholder className="mx-auto h-8 w-1/2" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 30 }, (_, day) => <Placeholder key={day} className="h-12 md:h-20" />)}
              </div>
            </div>
          ) : (
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <Placeholder className="h-9 w-2/3 md:w-1/3" />
              {Array.from({ length: 6 }, (_, row) => (
                <div key={row} className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <Placeholder className="h-5" /><Placeholder className="h-5" /><Placeholder className="h-5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
