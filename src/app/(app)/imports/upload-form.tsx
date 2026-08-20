"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { UploadCloud } from "lucide-react";

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
    >
      {pending
        ? "Reading documents… this can take a minute"
        : count > 0
        ? `Import ${count} document${count === 1 ? "" : "s"}`
        : "Choose files to import"}
    </button>
  );
}

export function UploadForm({ action }: { action: (formData: FormData) => void }) {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="bg-white border border-gray-200 rounded-lg p-6">
      <label
        htmlFor="files"
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-10 px-4 cursor-pointer hover:border-gray-400 hover:bg-gray-50 text-center"
      >
        <UploadCloud size={28} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-700">
          Click to choose old invoices or quotes
        </span>
        <span className="text-xs text-gray-500">
          PDF, Word (.docx), Excel (.xlsx/.csv), or a photo/scan — one at a time or in bulk
        </span>
      </label>
      <input
        ref={inputRef}
        id="files"
        name="files"
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,image/*"
        className="hidden"
        onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
      />

      {fileNames.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-gray-700">
          {fileNames.map((name, i) => (
            <li key={i} className="truncate">
              • {name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <SubmitButton count={fileNames.length} />
      </div>
    </form>
  );
}
