"use client";

import { useRef, useState } from "react";

interface UploaderProps {
  disabled?: boolean;
  onFilesAdded: (files: File[]) => void;
}

export function Uploader({ disabled = false, onFilesAdded }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function processFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    onFilesAdded(files);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-100">Image Upload</h2>
        <p className="text-sm text-zinc-400">
          Drag and drop many images or pick files manually.
        </p>
      </div>

      <div
        className={[
          "flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center transition",
          dragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-700 bg-zinc-950/50",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ].join(" ")}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragActive(true);
          }
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (disabled) {
            return;
          }

          processFiles(event.dataTransfer.files);
        }}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click();
          }
        }}
      >
        <p className="text-sm text-zinc-200">
          Drop PNG, JPG, JPEG, WEBP files here
        </p>
        <p className="mt-1 text-xs text-zinc-500">Supports 50+ files per batch</p>
        <button
          type="button"
          className="mt-4 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Choose Files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
