"use client";

import { useEffect } from "react";
import { Segmented, TextField } from "../base/controls";
import { loadPdfLib } from "../base/engines";
import { outputName, type ToolFile } from "../base/files";
import { openPdf, savePdf } from "../base/pdf";
import { defineTool, type OptionsProps } from "../base/types";

type Fields = { title: string; author: string; subject: string; keywords: string };
type Options = Fields & { mode: "remove" | "edit"; loadedFor?: ToolFile };

/** Info dictionary entries that can identify a person, an organization or their software. */
const INFO_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate", "Trapped"];

function MetadataOptions({ files, options, setOptions }: OptionsProps<Options>) {
  const file = files[0];

  // Fill the edit fields with what the PDF already says, once per file.
  useEffect(() => {
    if (!file || options.loadedFor === file) return;
    let current = true;
    openPdf(file)
      .then((doc) => {
        if (!current) return;
        setOptions({
          ...options,
          loadedFor: file,
          title: doc.getTitle() ?? "",
          author: doc.getAuthor() ?? "",
          subject: doc.getSubject() ?? "",
          keywords: doc.getKeywords() ?? "",
        });
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [file, options, setOptions]);

  const set = (patch: Partial<Options>) => setOptions({ ...options, ...patch });

  return (
    <>
      <Segmented
        label="What to do"
        value={options.mode}
        choices={[
          { value: "remove", label: "Remove all" },
          { value: "edit", label: "Edit details" },
        ]}
        onChange={(mode) => set({ mode })}
      />
      {options.mode === "remove" ? (
        <p className="field-hint">
          Clears the title, author, subject, keywords, the app that made the file, its dates and any XMP metadata.
        </p>
      ) : (
        <>
          <TextField label="Title" value={options.title} onChange={(title) => set({ title })} />
          <TextField label="Author" value={options.author} onChange={(author) => set({ author })} />
          <TextField label="Subject" value={options.subject} onChange={(subject) => set({ subject })} />
          <TextField label="Keywords" value={options.keywords} onChange={(keywords) => set({ keywords })} />
        </>
      )}
    </>
  );
}

export default defineTool<Options>({
  defaults: { mode: "remove", title: "", author: "", subject: "", keywords: "" },
  Options: MetadataOptions,
  actionLabel: (_files, options) => (options.mode === "remove" ? "Remove metadata" : "Save details"),

  async run(files, options) {
    const { PDFDict, PDFName, PDFHexString, PDFRef } = await loadPdfLib();
    const doc = await openPdf(files[0]);
    const existing = doc.context.lookup(doc.context.trailerInfo.Info);
    const info = existing instanceof PDFDict ? existing : doc.context.obj({});
    if (info !== existing) doc.context.trailerInfo.Info = doc.context.register(info);

    // Unlinking the XMP packet isn't enough: the saved file would still contain it.
    const removeXmp = () => {
      const xmp = doc.catalog.get(PDFName.of("Metadata"));
      if (xmp instanceof PDFRef) doc.context.delete(xmp);
      doc.catalog.delete(PDFName.of("Metadata"));
    };

    if (options.mode === "remove") {
      for (const key of INFO_KEYS) info.delete(PDFName.of(key));
      removeXmp();
      return [{ name: outputName(files[0].file.name, "-clean", "pdf"), blob: await savePdf(doc) }];
    }

    const fields: [keyof Fields, string][] = [
      ["title", "Title"],
      ["author", "Author"],
      ["subject", "Subject"],
      ["keywords", "Keywords"],
    ];
    for (const [field, key] of fields) {
      const value = options[field].trim();
      if (value) info.set(PDFName.of(key), PDFHexString.fromText(value));
      else info.delete(PDFName.of(key));
    }
    // An XMP packet would still carry the old details, and many apps prefer it over the Info dictionary.
    removeXmp();
    return [{ name: outputName(files[0].file.name, "-edited", "pdf"), blob: await savePdf(doc) }];
  },
});
