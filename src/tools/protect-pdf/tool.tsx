import { TextField, Toggle } from "../base/controls";
import { outputName } from "../base/files";
import { openPdf, savePdf } from "../base/pdf";
import { defineTool, type OptionsProps } from "../base/types";

type Options = { password: string; confirm: string; allowPrinting: boolean; allowCopying: boolean };

function problemWith(options: Options): string | null {
  if (options.password.length < 4) return "Use a password of at least 4 characters.";
  if (options.confirm !== options.password) return "Type the same password in both fields.";
  return null;
}

function ProtectOptions({ options, setOptions }: OptionsProps<Options>) {
  const mismatch = options.confirm.length > 0 && options.confirm !== options.password;
  return (
    <>
      <TextField
        label="Password"
        type="password"
        value={options.password}
        onChange={(password) => setOptions({ ...options, password })}
        hint="Anyone opening the PDF will need it. It can't be recovered if you forget it."
      />
      <TextField
        label="Type it again"
        type="password"
        value={options.confirm}
        error={mismatch ? "The passwords don't match." : null}
        onChange={(confirm) => setOptions({ ...options, confirm })}
      />
      <Toggle
        label="Allow printing"
        checked={options.allowPrinting}
        onChange={(allowPrinting) => setOptions({ ...options, allowPrinting })}
      />
      <Toggle
        label="Allow copying text"
        checked={options.allowCopying}
        onChange={(allowCopying) => setOptions({ ...options, allowCopying })}
        hint="Most PDF apps respect these limits, but not all of them do."
      />
    </>
  );
}

export default defineTool<Options>({
  defaults: { password: "", confirm: "", allowPrinting: true, allowCopying: true },
  Options: ProtectOptions,
  actionLabel: () => "Protect PDF",
  validate: (_files, options) => problemWith(options),

  async run(files, options) {
    const problem = problemWith(options);
    if (problem) throw new Error(problem);

    const doc = await openPdf(files[0]);
    const restricted = !options.allowPrinting || !options.allowCopying;
    doc.encrypt({
      userPassword: options.password,
      // With limits set, a separate random owner password keeps the password from lifting them.
      ownerPassword: restricted ? crypto.randomUUID() : options.password,
      permissions: {
        printing: options.allowPrinting ? "highResolution" : false,
        copying: options.allowCopying,
        modifying: !restricted,
        annotating: !restricted,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: !restricted,
      },
    });
    return [{ name: outputName(files[0].file.name, "-protected", "pdf"), blob: await savePdf(doc) }];
  },
});
