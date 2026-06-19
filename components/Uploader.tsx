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

    onFilesAdded(Array.from(fileList));
  }

  return (
    <section className="panel h-full">
      <div className="mb-4">
        <h2 className="font-display text-lg text-[var(--text-primary)]">Add assets</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          PNG, JPG, JPEG, WEBP, MP3, OGG, WAV, FLAC.
        </p>
      </div>

      <div
        className={[
          "drop-zone",
          dragActive ? "drop-zone-active" : "",
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
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
        <p className="text-sm text-[var(--text-secondary)]">
          {dragActive ? "Release to queue files" : "Drag files here"}
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
          or browse manually
        </p>
        <button
          type="button"
          className="btn-secondary mt-4"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Choose files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.mp3,.ogg,.wav,.flac,image/png,image/jpeg,image/webp,audio/mpeg,audio/ogg,audio/wav,audio/flac,audio/x-flac,audio/x-wav"
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
