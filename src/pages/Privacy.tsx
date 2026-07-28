// NOTE: Baseline privacy policy for a service marketplace app. Covers Play
// Store, Google OAuth Consent Screen, GDPR and CCPA basics. Have it reviewed
// by legal counsel before publishing beyond a limited MVP audience.

import { Link } from "react-router-dom";

const LAST_UPDATED = "July 28, 2026";
const CONTACT_EMAIL = "privacy@maximussolutions.app";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            This Privacy Policy describes how <strong>Maximus Solutions</strong> ("we", "our",
            "us") collects, uses, shares, and protects information from users of the Maximus
            Solutions mobile app and the website{" "}
            <a className="underline" href="https://www.maximussolutions.app">
              www.maximussolutions.app
            </a>{" "}
            (the "Service"). By using the Service, you agree to this policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">1. Data controller</h2>
          <p className="text-sm leading-relaxed">
            The controller of the personal data described here is <strong>Maximus Solutions</strong>.
            To exercise your rights or ask questions, contact{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">2. Data we collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Account data:</strong> full name, email, phone number, avatar photo,
              account type (client or provider).
            </li>
            <li>
              <strong>Client data:</strong> service address, city, state, ZIP code, request and
              booking history.
            </li>
            <li>
              <strong>Provider data:</strong> business name, EIN, license documents, skills,
              vehicle information (when applicable), reviews and reputation.
            </li>
            <li>
              <strong>Precise location (providers only, only while the app is in use):</strong>{" "}
              when a provider turns on "Online" to receive jobs, the device shares real-time GPS
              coordinates so clients with an active booking can watch the provider en route.
              Sharing stops as soon as the provider goes offline, backgrounds the app, signs
              out, or ends the booking.{" "}
              <strong>
                We do not collect location in the background. We do not use geofencing.
                Clients do not have their location collected by the app.
              </strong>
            </li>
            <li>
              <strong>Photos:</strong> images you attach to a service request or your profile
              (voluntary upload).
            </li>
            <li>
              <strong>Communications:</strong> chat messages exchanged between client and
              provider within an active booking.
            </li>
            <li>
              <strong>Payments:</strong> processed by Stripe. We do not store full card numbers
              or CVVs on our servers.
            </li>
            <li>
              <strong>Technical data:</strong> access logs, timestamps, session identifiers,
              device type, operating system, app version. Used for security, fraud prevention
              and product improvement.
            </li>
            <li>
              <strong>We do NOT collect:</strong> Advertising ID (AAID), contacts, calendar,
              unsolicited media, or browsing history from other apps.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">3. How we use data</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Authenticate your account and keep your session active.</li>
            <li>Connect clients and providers in the services marketplace.</li>
            <li>Process payments and issue receipts.</li>
            <li>Allow clients to track the provider's arrival in real time.</li>
            <li>Send operational notifications (new job, message, status update).</li>
            <li>Investigate and prevent fraud, abuse and violations of the Terms.</li>
            <li>Comply with legal and regulatory obligations.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">4. Legal bases</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Performance of a contract</strong> — delivering the service you requested.
            </li>
            <li>
              <strong>Consent</strong> — for real-time location (requested each time a provider
              activates "Online").
            </li>
            <li>
              <strong>Legitimate interest</strong> — fraud prevention, security and product
              improvement.
            </li>
            <li>
              <strong>Legal obligation</strong> — tax retention, court orders.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">5. Third-party processors</h2>
          <p className="text-sm leading-relaxed">
            We share the minimum data necessary with the following processors:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Supabase Inc.</strong> — database, authentication, storage. Servers in
              the United States.
            </li>
            <li>
              <strong>Stripe, Inc.</strong> — payment processing. PCI-DSS certified.
            </li>
            <li>
              <strong>Google</strong> — when you choose to sign in with Google (OAuth).
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery.
            </li>
            <li>
              <strong>Vercel</strong> — web application hosting.
            </li>
          </ul>
          <p className="text-sm leading-relaxed">
            All processors are contractually required to protect data. We do not sell personal
            data. We do not share location data with third parties for marketing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">6. Retention</h2>
          <p className="text-sm leading-relaxed">
            We keep data while your account is active. After account deletion, personal data is
            purged within 30 days, except records we must retain by law (for example, payment
            and tax records for up to 7 years). Historical location data is kept for up to 90
            days for booking audit purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">7. Your rights</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Confirm whether we process data about you and access it.</li>
            <li>Correct incomplete, inaccurate or outdated data.</li>
            <li>Request anonymization, blocking or deletion of unnecessary data.</li>
            <li>Data portability to another provider.</li>
            <li>Withdraw consent at any time (for example, turn "Online" off).</li>
            <li>
              <Link to="/account-deletion" className="underline">
                Request account deletion
              </Link>{" "}
              via the in-app option or by emailing{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">8. Security</h2>
          <p className="text-sm leading-relaxed">
            All data is transported over HTTPS/TLS. Passwords are securely hashed by our
            authentication provider. Row Level Security (RLS) restricts data access in the
            database. The app disables automatic Android backup (adb backup) to protect
            sensitive data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">9. Children</h2>
          <p className="text-sm leading-relaxed">
            The Service is intended for users aged 18 and over. We do not knowingly collect
            data from minors. If discovered, the data will be deleted immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">10. Changes to this policy</h2>
          <p className="text-sm leading-relaxed">
            We may update this policy. The "Last updated" date at the top indicates the
            current version. Material changes will be notified by email or in-app notification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">11. Contact</h2>
          <p className="text-sm leading-relaxed">
            Questions, requests or complaints:{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <footer className="pt-8 text-sm text-muted-foreground">
          <Link to="/terms" className="underline">
            Terms of Use
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
