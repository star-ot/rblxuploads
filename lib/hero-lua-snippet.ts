type LuaSnippetItem = {
  assetName: string;
  assetType: string;
  assetId: string;
};

export function buildCopyAllText(items: LuaSnippetItem[]): string {
  return items
    .map((item) => `[${item.assetType}] ${item.assetName}: rbxassetid://${item.assetId}`)
    .join("\n");
}

export function buildHeroLuaModule(items: LuaSnippetItem[]): string {
  const entries = items
    .map((item) => `  ${item.assetName} = "rbxassetid://${item.assetId}", -- ${item.assetType}`)
    .join("\n");

  return `-- Studio Vault · batch asset map
-- Paste into a ModuleScript, then require from gameplay code.

local Assets = {
${entries}
}

function Assets.get(name: string): string
\tlocal id = Assets[name]
\tassert(id, "Missing asset: " .. name)
\treturn id
end

return Assets`;
}
