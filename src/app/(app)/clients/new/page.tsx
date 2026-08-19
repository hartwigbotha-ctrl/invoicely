import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "../client-form";

export default function NewClientPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">New client</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ClientForm action={createClient} />
      </div>
    </div>
  );
}
