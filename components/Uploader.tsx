"use client";

import { useRef, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconUpload } from "@/components/ui/Icon";

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
    <section className="panel">
      <SectionHeader
        title="Add to queue"
        description="Drop images, audio, models, or meshes. Display names are formatted automatically — edit before uploading."
      />

      <div
        className={[
          "drop-zone",
          dragActive ? "drop-zone-active" : "",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Add files to upload queue"
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
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
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-hover)] text-[var(--text-muted)]">
          <IconUpload size={20} />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {dragActive ? "Release to add" : "Drop files here"}
        </p>
        <p className="mt-1 caption">
          PNG, JPG, WEBP · MP3, OGG, WAV, FLAC · FBX, GLTF, RBXM, MESH
        </p>
        <button
          type="button"
          className="btn-secondary mt-5"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.mp3,.ogg,.wav,.flac,.fbx,.gltf,.glb,.rbxm,.rbxmx,.mesh,image/png,image/jpeg,image/webp,audio/mpeg,audio/ogg,audio/wav,audio/flac,audio/x-flac,audio/x-wav,model/fbx,model/gltf+json,model/gltf-binary,model/x-rbxm,model/x-file-mesh-data,application/octet-stream"
        className="hidden"
        onChange={(event) => {
          processFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
