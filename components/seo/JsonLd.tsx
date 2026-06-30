import { absoluteUrl, siteConfig } from "@/lib/seo/site";

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
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
  const url = absoluteUrl("/");

  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}#website`,
      name: siteConfig.name,
      url,
      description: siteConfig.description,
      inLanguage: "en-US",
      publisher: {
        "@id": `${url}#organization`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${url}#organization`,
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${url}#software`,
      name: siteConfig.name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web Browser",
      description: siteConfig.description,
      url,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Roblox Open Cloud bulk upload",
        "Local asset library with folders and tags",
        "Search and filter rbxassetid records",
        "Image, audio, model, and mesh support",
        "Portable JSON and CSV export",
        "Model package updates via Open Cloud",
      ],
      author: {
        "@id": `${url}#organization`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return <JsonLd data={graph} />;
}

export const FAQ_ITEMS = [
  {
    question: "What is Studio Vault?",
    answer:
      "Studio Vault is a local-first Roblox asset workspace for browsing, organizing, and bulk-uploading images, audio, models, and meshes through Open Cloud. It stores your asset library in the browser and keeps credentials on your machine.",
  },
  {
    question: "How is Studio Vault different from Creator Dashboard?",
    answer:
      "Creator Dashboard is built for publishing individual assets. Studio Vault is built for day-to-day development: batch uploads, searchable local libraries, folders, tags, and fast access to rbxassetid values across projects.",
  },
  {
    question: "Does Studio Vault store my Roblox API key?",
    answer:
      "Your Open Cloud API key is saved in browser localStorage only. It is sent to Roblox during uploads through a local proxy and is never stored on a server.",
  },
  {
    question: "What Roblox asset types does Studio Vault support?",
    answer:
      "Studio Vault supports Image, Audio, Model, and Mesh assets via Roblox Open Cloud, including PNG, JPG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, RBXM, RBXMX, and MESH files.",
  },
  {
    question: "How do model uploads and package updates work?",
    answer:
      "FBX, RBXM, GLTF, and GLB files upload as Roblox Model assets (packages) through Open Cloud. After upload, you can replace a package's content by targeting its asset ID in the library and sending a new FBX file — the rbxassetid stays the same so scripts and instances keep working.",
  },
] as const;
