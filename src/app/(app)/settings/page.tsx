import { requireBusiness } from "@/lib/session";
import { updateBusinessSettings } from "@/lib/actions/settings";
import { db } from "@/db";
import { subscriptions, plans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function SettingsPage() {
  const { business } = await requireBusiness();

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.businessId, business.id),
    with: { plan: true },
    orderBy: desc(subscriptions.createdAt),
  });

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Your business details appear on every invoice PDF.
        </p>
      </div>

      {subscription && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-3">Subscription</h2>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{subscription.plan.name}</p>
              <p className="text-gray-500">
                {subscription.plan.priceMonthly > 0
                  ? `${subscription.plan.currency} ${subscription.plan.priceMonthly.toFixed(2)} / month`
                  : "Free"}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                subscription.status === "trialing"
                  ? "bg-blue-100 text-blue-700"
                  : subscription.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {subscription.status === "trialing" ? "Free trial" : subscription.status}
            </span>
          </div>
          {subscription.status === "trialing" && subscription.trialEndsAt && (
            <p className="text-xs text-gray-500 mt-2">
              Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}. Billing is not
              yet connected — add a payment provider (e.g. PayFast or Stripe) before the trial ends.
            </p>
          )}
        </div>
      )}

      <form
        action={updateBusinessSettings}
        encType="multipart/form-data"
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-6"
      >
        <div>
          <h2 className="font-semibold mb-3">Branding</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              {business.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt="Current logo"
                  className="h-14 mb-2 object-contain border border-gray-200 rounded-md p-1"
                />
              )}
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-sm file:font-medium hover:file:bg-gray-200"
              />
              {business.logoUrl && (
                <label className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <input type="checkbox" name="removeLogo" value="1" />
                  Remove current logo
                </label>
              )}
              <p className="text-xs text-gray-400 mt-1">PNG or JPG, under 500KB. Appears on invoice PDFs.</p>
            </div>

            <div>
              <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-1">
                Brand color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="brandColor"
                  type="color"
                  name="brandColor"
                  defaultValue={business.brandColor}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500">Used for headings and accents on invoices</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice layout</label>
            <div className="grid sm:grid-cols-3 gap-3">
              <TemplateOption
                value="modern"
                label="Modern"
                description="Shaded table header, bold accents"
                current={business.pdfTemplate}
              />
              <TemplateOption
                value="classic"
                label="Classic"
                description="Centered header, serif-style"
                current={business.pdfTemplate}
              />
              <TemplateOption
                value="minimal"
                label="Minimal"
                description="Clean lines, no fills"
                current={business.pdfTemplate}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="font-semibold mb-3">Business details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field name="name" label="Business name" defaultValue={business.name} required />
            <Field name="email" label="Email" type="email" defaultValue={business.email} required />
            <Field name="phone" label="Phone" defaultValue={business.phone ?? ""} />
            <Field name="vatNumber" label="VAT number" defaultValue={business.vatNumber ?? ""} />
            <Field name="regNumber" label="Registration number" defaultValue={business.regNumber ?? ""} />
            <Field name="currency" label="Currency (e.g. ZAR, USD, EUR, GBP)" defaultValue={business.currency} />
            <Field
              name="invoicePrefix"
              label="Invoice number prefix"
              defaultValue={business.invoicePrefix}
            />
            <Field
              name="defaultTaxRate"
              label="Default tax rate (%)"
              type="number"
              defaultValue={String(business.defaultTaxRate)}
            />
            <Field
              name="paymentTermsDays"
              label="Default payment terms (days)"
              type="number"
              defaultValue={String(business.paymentTermsDays)}
            />
          </div>

          <div className="mt-4 space-y-4">
            <Field name="address" label="Address" defaultValue={business.address ?? ""} textarea />
            <Field
              name="bankDetails"
              label="Bank / payment details (shown on invoices)"
              defaultValue={business.bankDetails ?? ""}
              textarea
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}

function TemplateOption({
  value,
  label,
  description,
  current,
}: {
  value: string;
  label: string;
  description: string;
  current: string;
}) {
  const checked = current === value;
  return (
    <label
      className={`flex flex-col gap-1 rounded-md border p-3 cursor-pointer text-sm ${
        checked ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <input type="radio" name="pdfTemplate" value={value} defaultChecked={checked} />
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-xs text-gray-500">{description}</span>
    </label>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      )}
    </div>
  );
}
