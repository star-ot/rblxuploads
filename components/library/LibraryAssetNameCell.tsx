import { LibraryAssetThumb } from "@/components/library/LibraryAssetThumb";
import type { AssetType, LocalAssetRecord } from "@/lib/types";

interface LibraryAssetNameCellProps {
  asset: Pick<LocalAssetRecord, "name" | "thumbnailDataUrl" | "type">;
  getTypeGlyph: (type: AssetType) => string;
}

export function LibraryAssetNameCell({ asset, getTypeGlyph }: LibraryAssetNameCellProps) {
  return (
    <td className="font-medium text-[var(--text-primary)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0 sm:hidden">
          <LibraryAssetThumb asset={asset} getTypeGlyph={getTypeGlyph} />
        </span>
        <span className="min-w-0 truncate">{asset.name}</span>
      </div>
    </td>
  );
}
