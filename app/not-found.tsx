import type { Metadata } from "next";
import { HttpErrorPage } from "@/components/errors/HttpErrorPage";
import { siteConfig } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: `The page you requested does not exist on ${siteConfig.name}.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <HttpErrorPage
      code="404"
      title="This page isn't in the vault"
      description="The URL may be mistyped, or the page was moved. Head back home or jump straight into the workspace."
    />
  );
}
