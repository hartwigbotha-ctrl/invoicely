import { SupportForm } from "./support-form";

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Report a problem</h1>
      <p className="text-sm text-gray-600 mb-8">
        Found a bug, or something not working the way you&apos;d expect? Let us know and we&apos;ll
        take a look.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <SupportForm />
      </div>
    </div>
  );
}
