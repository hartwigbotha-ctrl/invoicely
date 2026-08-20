"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";

export function PdfPreviewButton({
  href,
  filename,
  label = "Preview",
  className,
}: {
  href: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:bg-gray-100"
        }
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch sm:items-center sm:justify-center sm:p-6">
          <div className="bg-white w-full h-full sm:h-[90vh] sm:max-w-3xl sm:rounded-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
              <span className="text-sm font-medium truncate">{filename}</span>
              <div className="flex items-center gap-2">
                <a
                  href={href}
                  download={filename}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                  aria-label="Download"
                >
                  <Download size={18} />
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={href} className="flex-1 w-full" title={filename} />
          </div>
        </div>
      )}
    </>
  );
}
