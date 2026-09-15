import { loadPdfLib } from "../base/engines";
import { outputName } from "../base/files";
import { openPdf, savePdf } from "../base/pdf";
import { defineTool, throwIfCancelled } from "../base/types";

export default defineTool({
  defaults: {},
  minFiles: 2,
  actionLabel: (files) => (files.length < 2 ? "Merge PDFs" : `Merge ${files.length} PDFs`),

  async run(files, _options, { progress, signal }) {
    const { PDFDocument } = await loadPdfLib();
    const merged = await PDFDocument.create();

    for (const [index, file] of files.entries()) {
      throwIfCancelled(signal);
      const source = await openPdf(file);
      const pages = await merged.copyPages(source, source.getPageIndices());
      for (const page of pages) merged.addPage(page);
      progress(index + 1, files.length);
    }

    return [{ name: outputName(files[0].file.name, "-merged", "pdf"), blob: await savePdf(merged) }];
  },
});
