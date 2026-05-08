import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CardFables",
  description: "How CardFables handles your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-16">
      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">
        Privacy Policy
      </h1>

      <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
        <p>
          <strong className="text-text-primary">Last updated:</strong> May 2026
        </p>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">What we collect</h2>
          <p>
            CardFables collects very little information. When you submit a card through our Submit page,
            we receive the name you provide (optional), the card name, your photo, and any message you include.
            This information is stored securely and only used to create episodes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Cookies</h2>
          <p>
            We use a single session cookie for admin authentication. We do not use tracking cookies,
            analytics cookies, or advertising cookies. We do not track your browsing behavior.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Affiliate links</h2>
          <p>
            Some links on this site go to Amazon.com. These are affiliate links &mdash; if you make a purchase,
            CardFables may earn a small commission at no extra cost to you. Amazon has its own privacy policy
            that applies when you visit their site. We clearly mark all external links with an arrow (↗).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Children&apos;s privacy</h2>
          <p>
            CardFables is designed for readers of all ages, including children ages 6&ndash;11.
            We do not knowingly collect personal information from children under 13 beyond what is
            voluntarily submitted through the card submission form. Parents or guardians may contact
            us to request removal of any submitted information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Third-party services</h2>
          <p>
            CardFables is hosted on Vercel. External links may take you to Amazon.com, Ko-fi.com,
            YouTube, Instagram, or TikTok &mdash; each with their own privacy policies. We encourage
            parents to review these before allowing children to visit external sites.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Contact</h2>
          <p>
            If you have questions about this privacy policy, please reach out through our social channels
            or via Ko-fi at{" "}
            <a href="https://ko-fi.com/cardfables" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
              ko-fi.com/cardfables ↗
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
