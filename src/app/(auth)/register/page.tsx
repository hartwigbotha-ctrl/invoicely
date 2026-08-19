import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            Invoicely
          </Link>
          <p className="mt-2 text-gray-600">Start your 14-day free trial</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
