import { homePageJsonLd, teamsPageJsonLd, workspacePageJsonLd } from "@/lib/seo/json-ld";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function HomePageJsonLd() {
  return <JsonLd data={homePageJsonLd()} />;
}

export function WorkspacePageJsonLd() {
  return <JsonLd data={workspacePageJsonLd()} />;
}

export function TeamsPageJsonLd() {
  return <JsonLd data={teamsPageJsonLd()} />;
}
