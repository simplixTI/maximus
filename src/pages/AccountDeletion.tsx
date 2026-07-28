// Play Store compliance: apps must provide an account deletion path that is
// publicly reachable without signing in. This page satisfies that requirement.

import { Link } from "react-router-dom";

const LAST_UPDATED = "July 28, 2026";
const CONTACT_EMAIL = "privacy@maximussolutions.app";
const MAILTO_SUBJECT = encodeURIComponent("Account deletion request");
const MAILTO_BODY = encodeURIComponent(
  "Hello Maximus Solutions team,\n\n" +
    "I would like to request the deletion of my account and associated personal data.\n\n" +
    "Email associated with the account: <your email here>\n" +
    "Full name on file: <your name here>\n" +
    "Reason (optional): <optional>\n\n" +
    "Thank you.",
);

export default function AccountDeletion() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="font-display text-3xl font-bold">Delete your account</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            You can request the deletion of your <strong>Maximus Solutions</strong> account and
            associated personal data at any time. This page explains how, what happens to your
            data, and how long it takes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">1. Delete from the app</h2>
          <p className="text-sm leading-relaxed">
            The fastest way is inside the app: <em>Profile → Settings → Delete Account</em>.
            You will be asked to confirm. Once confirmed, deletion begins immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">2. Request via email</h2>
          <p className="text-sm leading-relaxed">
            If you cannot access the app, send an email to{" "}
            <a
              className="underline"
              href={`mailto:${CONTACT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`}
            >
              {CONTACT_EMAIL}
            </a>{" "}
            with the subject <strong>"Account deletion request"</strong>. Please include:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>The email address you used to sign up.</li>
            <li>Your full name as it appears on the account.</li>
            <li>Any additional context that helps us identify you (optional).</li>
          </ul>
          <p className="text-sm leading-relaxed">
            We will confirm receipt within <strong>2 business days</strong> and complete the
            deletion within <strong>30 days</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">3. What gets deleted</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>Your account profile (name, email, phone, avatar).</li>
            <li>Client data: saved addresses, service request history.</li>
            <li>Provider data: business info, uploaded documents, skills, vehicle info.</li>
            <li>Uploaded photos.</li>
            <li>Chat messages you sent.</li>
            <li>Location history broadcast while online.</li>
            <li>Notification preferences and read/unread state.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">4. What we may retain (and why)</h2>
          <p className="text-sm leading-relaxed">
            Certain records are kept after deletion because we are legally required to retain
            them or because they document a completed transaction between two parties:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Payment and tax records</strong> — retained for up to{" "}
              <strong>7 years</strong> to comply with tax and anti-money-laundering laws.
            </li>
            <li>
              <strong>Completed booking summaries</strong> — retained in a form that no longer
              personally identifies you (aggregated / anonymized).
            </li>
            <li>
              <strong>Anti-fraud and abuse records</strong> — retained if your account was
              suspended for policy violations, to prevent re-registration.
            </li>
            <li>
              <strong>Content shared with the other party</strong> — chat messages you sent to
              another user remain visible to that user (mirroring how email works).
            </li>
          </ul>
          <p className="text-sm leading-relaxed">
            Everything not covered by the above is fully purged from our systems (including
            backups) within 30 days of your request.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">5. Third-party processors</h2>
          <p className="text-sm leading-relaxed">
            When you delete your account, we also request deletion of your data from our
            processors:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>
              <strong>Supabase</strong> — database, auth, storage.
            </li>
            <li>
              <strong>Stripe</strong> — payment records are retained by Stripe for their own tax
              and compliance purposes.
            </li>
            <li>
              <strong>Google</strong> — if you signed in with Google, you can also revoke access
              at{" "}
              <a className="underline" href="https://myaccount.google.com/permissions">
                myaccount.google.com/permissions
              </a>
              .
            </li>
            <li>
              <strong>Resend</strong> — email logs are purged.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">6. Reversibility</h2>
          <p className="text-sm leading-relaxed">
            Once deletion is completed, we <strong>cannot restore</strong> your account or data.
            You can create a new account at any time using the same email.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold">7. Questions</h2>
          <p className="text-sm leading-relaxed">
            Contact{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            for any question about this process.
          </p>
        </section>

        <footer className="pt-8 text-sm text-muted-foreground">
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="underline">
            Terms of Use
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
