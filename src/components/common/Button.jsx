export default function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-accent text-on-accent hover:bg-accent-strong",
    secondary: "bg-sunken text-ink hover:bg-line",
    ghost: "text-ink-soft hover:bg-sunken hover:text-ink",
  };

  return (
    <button
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    />
  );
}
