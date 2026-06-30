import { FAQ_ITEMS, faqPageSchema } from "@/lib/seo/faq";
import { absoluteUrl, siteConfig } from "@/lib/seo/site";

function schemaGraph(graph: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function organizationSchema(origin: string) {
  return {
    "@type": "Organization",
    "@id": `${origin}#organization`,
    name: siteConfig.author.name,
    url: siteConfig.author.url,
    sameAs: [siteConfig.author.url, siteConfig.links.github],
  };
}

function websiteSchema(origin: string) {
  return {
    "@type": "WebSite",
    "@id": `${origin}#website`,
    name: siteConfig.name,
    url: origin,
    description: siteConfig.description,
    inLanguage: "en-US",
    publisher: { "@id": `${origin}#organization` },
  };
}

function softwareApplicationSchema(origin: string) {
  return {
    "@type": "SoftwareApplication",
    "@id": `${origin}#software`,
    name: siteConfig.name,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Roblox development tools",
    operatingSystem: "Web Browser",
    description: siteConfig.description,
    url: origin,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Roblox Open Cloud bulk upload",
      "Multiple credential profiles for users and groups",
      "Local asset library with folders and tags",
      "Search and filter rbxassetid records",
      "Image, audio, model, and mesh support",
      "Portable JSON and CSV export",
      "Model package updates via Open Cloud",
      "InsertService Luau script generator for Studio workspace loading",
      "Self-hosted Docker deployment",
      "Optional structured audit logging",
      "Git-backed team library sync",
    ],
    author: { "@id": `${origin}#organization` },
    publisher: { "@id": `${origin}#organization` },
  };
}

function breadcrumbSchema(
  breadcrumbId: string,
  items: { name: string; path: string }[],
) {
  return {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function howToSchema(howToId: string) {
  return {
    "@type": "HowTo",
    "@id": howToId,
    name: "How to bulk upload Roblox assets with Studio Vault",
    description:
      "Set up Open Cloud credentials and batch-upload images, audio, models, and meshes to Roblox.",
    totalTime: "PT5M",
    tool: [
      {
        "@type": "HowToTool",
        name: "Roblox Open Cloud API key with asset permission scope",
      },
      {
        "@type": "HowToTool",
        name: "Web browser with Studio Vault",
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Create an Open Cloud API key",
        text: "Create an API key at create.roblox.com with the asset permission scope enabled.",
        url: "https://create.roblox.com/dashboard/credentials",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Add credentials in Studio Vault",
        text: "Open Studio Vault, go to Credentials, and paste your API key, creator ID, and creator type (user or group).",
        url: absoluteUrl("/workspace"),
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Queue files for upload",
        text: "Drag and drop supported image, audio, model, or mesh files into the uploader, or use the file picker. Edit display names if needed.",
        url: absoluteUrl("/workspace"),
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Start the batch upload",
        text: "Click Start batch. Studio Vault uploads each file via Open Cloud and saves the resulting rbxassetid values to your local library.",
        url: absoluteUrl("/workspace"),
      },
    ],
  };
}

export function homePageJsonLd() {
  const origin = absoluteUrl("/");
  const webPageId = `${origin}#webpage`;
  const faqPageId = `${origin}#faq`;
  const howToId = `${origin}#howto`;

  return schemaGraph([
    organizationSchema(origin),
    websiteSchema(origin),
    softwareApplicationSchema(origin),
    {
      "@type": "WebPage",
      "@id": webPageId,
      url: origin,
      name: siteConfig.title,
      description: siteConfig.description,
      isPartOf: { "@id": `${origin}#website` },
      about: { "@id": `${origin}#software` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
      },
      mainEntity: { "@id": faqPageId },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["#faq h3", "#faq p"],
      },
    },
    faqPageSchema(faqPageId),
    howToSchema(howToId),
    breadcrumbSchema(`${origin}#breadcrumbs`, [{ name: "Home", path: "/" }]),
  ]);
}

export function workspacePageJsonLd() {
  const origin = absoluteUrl("/workspace");
  const webPageId = `${origin}#webpage`;

  return schemaGraph([
    organizationSchema(absoluteUrl("/")),
    {
      "@type": "WebPage",
      "@id": webPageId,
      url: origin,
      name: `${siteConfig.name} Workspace`,
      description:
        "Upload, queue, and manage Roblox assets via Open Cloud. Batch images, audio, models, and meshes with a searchable local library.",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: { "@id": `${absoluteUrl("/")}#software` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl("/workspace/opengraph-image"),
        width: 1200,
        height: 630,
      },
    },
    breadcrumbSchema(`${origin}#breadcrumbs`, [
      { name: "Home", path: "/" },
      { name: "Workspace", path: "/workspace" },
    ]),
  ]);
}

export function teamsPageJsonLd() {
  const origin = absoluteUrl("/teams");
  const webPageId = `${origin}#webpage`;
  const faqPageId = `${origin}#faq`;

  return schemaGraph([
    organizationSchema(absoluteUrl("/")),
    softwareApplicationSchema(absoluteUrl("/")),
    {
      "@type": "WebPage",
      "@id": webPageId,
      url: origin,
      name: `${siteConfig.name} — Teams & Self-Hosting`,
      description:
        "Self-hosted Roblox asset pipeline for game studios. Docker deployment, security architecture, optional audit logging, and Git-backed team workflows.",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: { "@id": `${absoluteUrl("/")}#software` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
      },
      mainEntity: { "@id": faqPageId },
    },
    {
      "@type": "FAQPage",
      "@id": faqPageId,
      mainEntity: [
        {
          "@type": "Question",
          name: "Where are Open Cloud API keys stored?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Profile metadata lives in browser localStorage. API keys and webhook secrets are AES-GCM encrypted in IndexedDB — device-bound by default, or passphrase-protected for shared machines. Keys never rest on the Studio Vault server.",
          },
        },
        {
          "@type": "Question",
          name: "What data leaves our network?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Only upload requests to Roblox Open Cloud. Library data, credential profiles at rest, and telemetry never leave your controlled environment unless explicitly exported.",
          },
        },
        {
          "@type": "Question",
          name: "Is Studio Vault multi-tenant SaaS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Each studio deploys their own instance. There are no shared accounts, billing tiers, or cloud-synced libraries.",
          },
        },
      ],
    },
    breadcrumbSchema(`${origin}#breadcrumbs`, [
      { name: "Home", path: "/" },
      { name: "Teams", path: "/teams" },
    ]),
  ]);
}

/** Re-export for components that render FAQ copy. */
export { FAQ_ITEMS };
