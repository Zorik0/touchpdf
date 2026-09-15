import { outputName } from "../base/files";
import { isEncrypted, openPdf, savePdf } from "../base/pdf";
import { defineTool } from "../base/types";

export default defineTool({
  defaults: {},
  actionLabel: () => "Unlock PDF",

  async validate(files) {
    return (await isEncrypted(files[0])) ? null : "This PDF has no password or restrictions, so there's nothing to unlock.";
  },

  async run(files) {
    // Opening decrypts the file with the password entered in the file list,
    // or with no password for files that only restrict printing or copying.
    const doc = await openPdf(files[0]);
    return [{ name: outputName(files[0].file.name, "-unlocked", "pdf"), blob: await savePdf(doc) }];
  },
});
