/* eslint-disable @next/next/no-img-element */

import type { AssetType, LocalAssetRecord } from "@/lib/types";

interface LibraryAssetThumbProps {
  asset: Pick<LocalAssetRecord, "thumbnailDataUrl" | "type">;
  getTypeGlyph: (type: AssetType) => string;
}

export function LibraryAssetThumb({ asset, getTypeGlyph }: LibraryAssetThumbProps) {
  const thumb = asset.thumbnailDataUrl ? (
    <img
      src={asset.thumbnailDataUrl}
      alt=""
      width={32}
      height={32}
      className="library-asset-thumb"
    />
  ) : (
    <div className="library-asset-thumb library-asset-thumb-fallback" aria-hidden>
      {getTypeGlyph(asset.type)}
    </div>
  );

  return <div className="library-asset-thumb-slot">{thumb}</div>;
}
