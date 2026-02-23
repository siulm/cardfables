"use client";

export function EmberParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    width: 2 + Math.random() * 3,
    height: 2 + Math.random() * 3,
    color: i % 3 === 0 ? "#D4A846" : "#E8651A",
    duration: `${4 + Math.random() * 5}s`,
    delay: `${Math.random() * 4}s`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            animation: `ember ${p.duration} ease-in ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
