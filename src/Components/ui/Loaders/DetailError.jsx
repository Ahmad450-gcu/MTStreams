const DetailError = ({ title = "Unable to load details", message, onRetry, onBack }) => (
      <section className="min-h-[70dvh] w-full px-5 py-16 grid place-items-center text-white [background-image:var(--bg-gradient)]">
            <div role="alert" className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1f2022]/90 p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
                  <div className="mx-auto mb-5 grid size-12 place-items-center rounded-full border border-amber-300/25 bg-amber-300/10 text-amber-200" aria-hidden="true">
                        !
                  </div>
                  <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">{message || "Something went wrong while loading this title."}</p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <button type="button" onClick={onRetry} className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">
                              Try again
                        </button>
                        <button type="button" onClick={onBack} className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                              Go back
                        </button>
                  </div>
            </div>
      </section>
);

export default DetailError;
