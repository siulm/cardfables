import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 text-7xl">📖</span>
      <h1 className="mb-3 font-heading text-3xl font-bold text-text-primary">
        Oops! This page wandered off...
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist. Maybe the story
        moved, or perhaps it hasn&apos;t been written yet!
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button href="/">Take Me Home</Button>
        <Button href="/browse" variant="ghost">Browse Stories</Button>
      </div>
    </div>
  );
}
