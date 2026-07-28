// NOTE: Baseline Terms of Use template for a service marketplace app. Have
// it reviewed by legal counsel before publishing beyond a limited MVP audience.

import { Link } from "react-router-dom";

const LAST_UPDATED = "July 28, 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="font-display text-3xl font-bold">Terms of Use</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            These Terms govern the use of the <strong>Maximus Solutions</strong> app and the
            website{" "}
            <a className="underline" href="https://www.maximussolutions.app">
              www.maximussolutions.app
            </a>{" "}
            (the "Service"), operated by <strong>Maximus Solutions</strong> ("we"). By creating
            an account or using the Service, you agree to these Terms and to the{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">1. What the Service is</h2>
          <p className="text-sm leading-relaxed">
            The Service is a marketplace that connects <strong>clients</strong> who need home
            services to independent <strong>service providers</strong>. We are not the
            employer of providers; we are a platform that facilitates discovery, communication,
            scheduling and payment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">2. Eligibility</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>You must be at least 18 years old.</li>
            <li>You must provide accurate information and keep it up to date.</li>
            <li>You are responsible for the security of your account and password.</li>
            <li>One account per person. Duplicate accounts may be suspended.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">3. Client accounts</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Describe the requested service accurately.</li>
            <li>Provide a correct address and be available at the scheduled time.</li>
            <li>Pay for the service you accepted the quote for.</li>
            <li>Treat providers with respect. Reviews must be honest.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">4. Provider accounts</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Prove your skills and hold any required licenses or documents.</li>
            <li>Perform accepted services competently and within the agreed timeframe.</li>
            <li>Follow applicable safety, labor and sanitary regulations.</li>
            <li>You are responsible for your own taxes and labor obligations.</li>
            <li>
              Real-time location sharing is triggered only when you turn on "Online" and is
              used exclusively to let the client of an active booking watch your arrival.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">5. Payments</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Payments are processed by Stripe, Inc.</li>
            <li>The client authorizes the charge when accepting the quote.</li>
            <li>
              Maximus may retain a service fee on each transaction (disclosed before the client
              accepts).
            </li>
            <li>
              Refunds and disputes follow the current policy and Maximus mediation, without
              prejudice to consumer rights granted by applicable law.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">6. Cancellation</h2>
          <p className="text-sm leading-relaxed">
            You can cancel your account at any time from the app settings or by emailing{" "}
            <a className="underline" href="mailto:support@maximussolutions.app">
              support@maximussolutions.app
            </a>
            . See also the{" "}
            <Link to="/account-deletion" className="underline">
              Account Deletion
            </Link>{" "}
            page. We may suspend or terminate accounts that violate these Terms, with notice
            (except in serious cases).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">7. User content</h2>
          <p className="text-sm leading-relaxed">
            You retain ownership of the photos, text and reviews you submit. By posting
            content, you grant Maximus a non-exclusive, royalty-free, worldwide license to
            host, process and display that content within the Service. You warrant you have
            the rights to the content submitted.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">8. Prohibited conduct</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              Fraud, money laundering or off-platform payments meant to avoid service fees.
            </li>
            <li>Harassment, discrimination, violence or threats.</li>
            <li>Falsifying documents, licenses or reviews.</li>
            <li>Using the Service for illegal activities.</li>
            <li>Reverse engineering or attempts to bypass technical controls.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">9. Disclaimer of warranties</h2>
          <p className="text-sm leading-relaxed">
            Maximus takes reasonable steps to verify providers but does not guarantee the
            quality, safety or legality of services performed by third parties. The Service is
            provided "as is", without warranties of uninterrupted availability or error-free
            operation. Nothing in these Terms waives consumer rights that cannot be waived
            under applicable law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">10. Limitation of liability</h2>
          <p className="text-sm leading-relaxed">
            To the maximum extent permitted by law, Maximus is not liable for indirect
            damages, lost profits, loss of data, or damages arising from acts or omissions of
            providers. Where limits apply, our total aggregate liability is capped at the
            amount the client paid to Maximus in the 6 months preceding the event giving rise
            to the claim.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">11. Governing law</h2>
          <p className="text-sm leading-relaxed">
            These Terms are governed by the laws of the jurisdiction where Maximus Solutions
            is legally established. Consumer users retain the right to bring claims in their
            place of residence where required by applicable consumer-protection law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">12. Changes to these Terms</h2>
          <p className="text-sm leading-relaxed">
            We may update these Terms. Material changes will be notified by email or in-app
            notification at least 15 days in advance. Continued use after the effective date
            means acceptance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">13. Contact</h2>
          <p className="text-sm leading-relaxed">
            Questions or legal notices:{" "}
            <a className="underline" href="mailto:legal@maximussolutions.app">
              legal@maximussolutions.app
            </a>
            .
          </p>
        </section>

        <footer className="pt-8 text-sm text-muted-foreground">
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/account-deletion" className="underline">
            Delete account
          </Link>
          <span className="mx-2">·</span>
          <Link to="/" className="underline">
            Home
          </Link>
        </footer>
      </div>
    </div>
  );
}
