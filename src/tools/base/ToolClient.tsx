"use client";

import { useEffect, useState } from "react";
import { TOOL_LOADERS } from "../loaders";
import type { ToolInput } from "./files";
import { ToolRunner } from "./ToolRunner";
import type { AnyToolDefinition } from "./types";

type ToolClientProps = { slug: string; input: ToolInput; zipName: string };

/** Shows the drop area straight away and loads the tool's own code alongside it. */
export function ToolClient({ slug, input, zipName }: ToolClientProps) {
  const [definition, setDefinition] = useState<AnyToolDefinition | null>(null);

  useEffect(() => {
    let current = true;
    TOOL_LOADERS[slug]?.().then((module) => {
      if (current) setDefinition(module.default);
    });
    return () => {
      current = false;
    };
  }, [slug]);

  return <ToolRunner input={input} definition={definition} zipName={zipName} />;
}
