export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
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
    question: "How do I get started with Studio Vault?",
    answer:
      "Create an Open Cloud API key at create.roblox.com with the asset permission scope. Open Studio Vault, paste your API key, creator ID, and creator type in Credentials, add supported files to the upload queue, then click Start batch. Uploaded rbxassetid values appear in your local library automatically.",
  },
  {
    question: "Does Studio Vault store my Roblox API key?",
    answer:
      "Your Open Cloud API keys are saved in browser localStorage only. You can save multiple credential profiles for different users or groups, switch between them from the workspace header, and keys are sent to Roblox during uploads through a local proxy — never stored on a server.",
  },
  {
    question: "Can I use different API keys for different Roblox groups?",
    answer:
      "Yes. Studio Vault supports multiple credential profiles. Add a profile per user or group in Settings, paste the matching Open Cloud key and creator ID, then switch the active profile from the header before uploading. Existing single-key settings migrate automatically.",
  },
  {
    question: "What Roblox asset types does Studio Vault support?",
    answer:
      "Studio Vault supports Image, Audio, Model, and Mesh assets via Roblox Open Cloud, including PNG, JPG, JPEG, WEBP, MP3, OGG, WAV, FLAC, FBX, GLTF, GLB, RBXM, RBXMX, and MESH files.",
  },
  {
    question: "How do model uploads and package updates work?",
    answer:
      "FBX, RBXM, GLTF, and GLB files upload as Roblox Model assets through Open Cloud. After upload, you can replace a package's content by targeting its asset ID in the library and sending a new FBX file — the rbxassetid stays the same so scripts and instances keep working.",
  },
  {
    question: "What is the InsertService script generator?",
    answer:
      "Studio Vault can generate Luau scripts that load your uploaded model packages into Roblox Studio Workspace via InsertService. Pick assets from your library, choose ServerScript, ModuleScript, or Command Bar output, and paste the script into Studio for instant loading during development.",
  },
  {
    question: "Is Studio Vault free to use?",
    answer:
      "Yes. Studio Vault is free, open source, and runs in your browser. There are no subscriptions, usage fees, or paid tiers. You only need a Roblox account with Open Cloud API access.",
  },
  {
    question: "Does Studio Vault send my data to third-party servers?",
    answer:
      "No telemetry, analytics, or cloud storage. Your asset library lives in browser IndexedDB. API keys stay in localStorage. The only outbound network traffic during uploads goes from your machine to Roblox's Open Cloud API through a local Next.js proxy required because Roblox blocks direct browser CORS requests.",
  },
  {
    question: "Can I export and share my asset library?",
    answer:
      "Yes. Export your local library as JSON or CSV to back up metadata, move between machines, or share rbxassetid records with teammates. Import portable exports to merge libraries without re-uploading assets to Roblox.",
  },
  {
    question: "Do I need to self-host Studio Vault?",
    answer:
      "You can use the hosted site or run it locally with npm install and npm run dev. Self-hosting keeps everything on your machine — useful for teams that want full control over the upload proxy and deployment.",
  },
] as const;

export function faqPageSchema(faqPageId: string) {
  return {
    "@type": "FAQPage",
    "@id": faqPageId,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
