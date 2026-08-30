// src/app/terms/page.tsx
//
// Drop this file into your Nimblo repo at: src/app/terms/page.tsx
// This creates a public page at https://www.usenimblo.com/terms
//
// After adding it, commit + push (or deliver via the Claude device bridge
// as usual) and Railway will auto-deploy it.

export const metadata = {
  title: "Terms & Conditions | Nimblo",
  description: "Nimblo's Terms & Conditions, including refund, cancellation, and service delivery policies.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-slate">
      <h1>Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500">Last updated: 30 August 2026</p>

      <p>
        <strong>Nimblo</strong> is a SaaS invoicing and quoting platform for
        small businesses and contractors, operated by Cera Technologies
        (Pty) Ltd (&quot;Nimblo&quot;, &quot;we&quot;, &quot;us&quot;).
      </p>

      <h2>1. The Service</h2>
      <p>
        Nimblo provides access to a web-based invoicing and quoting
        application, including client management, invoice/quote
        generation, PDF export, email delivery, and related billing tools
        (&quot;the Service&quot;). The Service is provided on a subscription
        basis as described in your chosen plan (Starter, Pro, or Business).
      </p>

      <h2>2. Service Delivery</h2>
      <p>
        Nimblo is a digital service &mdash; there is no physical product
        shipped. Access to the Service is delivered electronically:
      </p>
      <ul>
        <li>
          Upon successful signup and confirmed payment, your account is
          activated and the Service becomes accessible <strong>immediately</strong>,
          via your login credentials at usenimblo.com.
        </li>
        <li>
          There is no shipping, and no delivery times apply beyond the time
          it takes your payment to be confirmed by our payment processor
          (PayFast), which is typically instant.
        </li>
        <li>
          If you experience any delay accessing your account after a
          successful payment, contact us at the support address below and
          we will resolve it promptly.
        </li>
      </ul>

      <h2>3. Subscription &amp; Billing</h2>
      <ul>
        <li>
          Nimblo operates on a <strong>pay-in-advance, no free trial</strong>{" "}
          basis. Access is granted upon payment and continues for as long as
          your subscription remains active.
        </li>
        <li>
          Subscriptions renew automatically on a monthly basis at the rate
          applicable to your selected plan, until cancelled.
        </li>
        <li>
          All payments are processed securely via PayFast. Nimblo does not
          store your card or banking details.
        </li>
      </ul>

      <h2>4. Cancellation Policy</h2>
      <ul>
        <li>You may cancel your subscription at any time from your account Settings page.</li>
        <li>
          Cancellation takes effect <strong>immediately</strong> upon
          confirmation from our payment processor. You will retain access
          to the Service until the end of your current paid billing period,
          after which access will be suspended.
        </li>
        <li>There is no cancellation fee.</li>
        <li>You may reactivate a cancelled subscription at any time by resubscribing from your account.</li>
      </ul>

      <h2>5. Refund Policy</h2>
      <ul>
        <li>
          Because Nimblo is a digital subscription service delivered
          immediately upon payment,{" "}
          <strong>subscription fees are generally non-refundable</strong>{" "}
          once a billing period has started.
        </li>
        <li>
          If you believe you were charged in error (e.g. a duplicate
          charge, or a charge after you cancelled), please contact us
          within 14 days of the charge at the support address below, and we
          will investigate and issue a refund if warranted.
        </li>
        <li>
          Refunds, where approved, will be processed back to the original
          payment method via PayFast within 5&ndash;10 business days.
        </li>
      </ul>

      <h2>6. Changes to Your Plan</h2>
      <p>
        You may upgrade or downgrade your subscription plan at any time
        from Settings. Plan changes take effect according to your next
        billing cycle unless otherwise stated at the time of the change.
      </p>

      <h2>7. Support</h2>
      <p>
        For billing questions, cancellation help, or to report a problem
        with the Service, please use the <strong>Report a Problem</strong>{" "}
        page within the app, or contact us at:{" "}
        <a href="mailto:hartwigbotha@gmail.com">hartwigbotha@gmail.com</a>
      </p>

      <h2>8. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the
        Service after changes are posted constitutes acceptance of the
        updated Terms.
      </p>
    </main>
  );
}
