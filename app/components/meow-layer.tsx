import type { Meow } from "../hooks/use-meows";

export function MeowLayer({ meows }: { meows: Meow[] }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {meows.map(({ id, x, y }) => (
        <span
          key={id}
          style={{ left: x, top: y }}
          className="absolute animate-meow rounded-full border-2 border-ink bg-card px-3 py-1 font-hand text-2xl whitespace-nowrap shadow-hard-sm motion-reduce:animate-none motion-reduce:opacity-0"
        >
          Meow 🐱
        </span>
      ))}
    </div>
  );
}
