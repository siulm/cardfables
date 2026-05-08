import Link from "next/link";
import { SERIES } from "@/lib/data";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="mb-4 flex items-center gap-2.5 no-underline"
            >
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-sm"
                style={{
                  background: "linear-gradient(135deg, #D4893A, #B86E28)",
                }}
              >
                📖
              </span>
              <span className="font-heading text-lg font-bold text-gold">
                CardFables
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-text-secondary">
              Original stories inspired by Pokemon trading card artwork. One
              card, one episode, one fable at a time.
            </p>
          </div>

          {/* Series */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[1.5px] text-text-secondary">
              Series
            </h4>
            <div className="flex flex-col gap-2.5">
              {SERIES.slice(0, 4).map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.id}`}
                  className="text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
                >
                  {s.title}
                </Link>
              ))}
              <Link
                href="/browse"
                className="text-sm text-gold transition-colors duration-200"
              >
                See all
              </Link>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[1.5px] text-text-secondary">
              Navigate
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/browse", label: "Browse" },
                { href: "/shop", label: "Shop" },
                { href: "/submit", label: "Submit" },
                { href: "/about", label: "About" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Follow */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[1.5px] text-text-secondary">
              Follow
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { name: "YouTube", url: "https://www.youtube.com/@card.fables" },
                { name: "Instagram", url: "https://www.instagram.com/card.fables" },
                { name: "TikTok", url: "https://www.tiktok.com/@card.fables" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-secondary transition-colors duration-200 hover:text-gold"
                >
                  {social.name} ↗
                </a>
              ))}
              <a
                href="https://ko-fi.com/cardfables"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[rgba(212,137,58,0.2)] bg-[rgba(212,137,58,0.06)] px-3 py-1.5 text-xs font-semibold text-gold transition-colors duration-200 hover:bg-[rgba(212,137,58,0.12)]"
              >
                ☕ Support CardFables ↗
              </a>
            </div>
          </div>
        </div>

        {/* Divider + Legal */}
        <div
          className="mt-12 border-t pt-8"
          style={{ borderColor: "rgba(74,64,53,0.06)" }}
        >
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-footer-disclaimer">
              Pokemon and all character names are trademarks of Nintendo /
              Creatures Inc. / GAME FREAK Inc.
            </p>
            <p className="text-xs leading-relaxed text-footer-disclaimer">
              CardFables is an independent fan project and is not affiliated
              with, endorsed by, or sponsored by The Pokemon Company
              International.
            </p>
            <p className="text-xs leading-relaxed text-footer-disclaimer">
              Product links may be affiliate links — purchases support this site
              at no extra cost. As an Amazon Associate, CardFables earns from
              qualifying purchases.
            </p>
          </div>
          <p className="mt-6 text-xs text-footer-copyright">
            &copy; {new Date().getFullYear()} CardFables. All original stories
            and content are the property of their creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
