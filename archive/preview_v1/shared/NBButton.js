export default function NBButton({ href, onClick, children, variant = "solid", target }) {
  const base =
    "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] focus-visible:ring-offset-2";

  const styles =
    variant === "ghost"
      ? "px-4 py-2 border border-black/10 text-black/75 hover:text-black hover:border-black/20 bg-white"
      : "px-4 py-2 bg-[var(--c-primary)] text-white hover:opacity-90 shadow-sm";

  const cls = `${base} ${styles}`;

  if (href) {
    return (
      <a href={href} className={cls} target={target}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
