"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HttpErrorPage } from "@/components/errors/HttpErrorPage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <HttpErrorPage
      code="500"
      title="Something went wrong"
      description="An unexpected error interrupted this page. You can try again, or return home while things settle."
      actions={
        <>
          <button type="button" className="btn-primary px-5 py-2.5 text-[15px]" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn-secondary px-5 py-2.5 text-[15px]">
            Back to home
          </Link>
        </>
      }
    />
  );
}
