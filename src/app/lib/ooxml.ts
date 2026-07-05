// Minimal Office Open XML helpers — build .docx/.xlsx and parse .xlsx/.pptx
// entirely in the browser with JSZip. No server, no heavy dependencies.
import JSZip from 'jszip';

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // strip control chars that are invalid in XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

// Convert a 0-based column index to an A1-style column letter (0 → A, 26 → AA)
export function colLetter(index: number): string {
  let s = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export interface DocxParagraph {
  text: string;
  heading?: boolean;
}

// Build a minimal but valid .docx from a list of paragraphs.
export async function buildDocx(paragraphs: DocxParagraph[]): Promise<Blob> {
  const body = paragraphs
    .map(p => {
      const runProps = p.heading ? '<w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>' : '';
      return `<w:p><w:r>${runProps}<w:t xml:space="preserve">${escapeXml(p.text)}</w:t></w:r></w:p>`;
    })
    .join('');

  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`);

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export interface SheetData {
  name: string;
  rows: string[][];
}

// Build a minimal .xlsx workbook using inline strings (no sharedStrings table).
export async function buildXlsx(sheets: SheetData[]): Promise<Blob> {
  const zip = new JSZip();

  const sheetOverrides = sheets
    .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join('');
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheetOverrides}</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);

  const sheetEntries = sheets
    .map((s, i) => `<sheet name="${escapeXml(s.name.slice(0, 31) || `Sheet${i + 1}`)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries}</sheets></workbook>`);

  const relEntries = sheets
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join('');
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relEntries}</Relationships>`);

  sheets.forEach((s, i) => {
    const rowsXml = s.rows
      .map((row, r) => {
        const cells = row
          .map((val, c) => {
            if (val === '') return '';
            const ref = `${colLetter(c)}${r + 1}`;
            const num = Number(val);
            if (val.trim() !== '' && Number.isFinite(num) && /^-?\d+(\.\d+)?$/.test(val.trim())) {
              return `<c r="${ref}"><v>${num}</v></c>`;
            }
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(val)}</t></is></c>`;
          })
          .join('');
        return `<row r="${r + 1}">${cells}</row>`;
      })
      .join('');
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`);
  });

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Parse cell reference "BC23" → 0-based column index
function refToCol(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0] || 'A';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

// Parse an .xlsx file into sheets of string cells.
export async function parseXlsx(data: ArrayBuffer): Promise<SheetData[]> {
  const zip = await JSZip.loadAsync(data);
  const parser = new DOMParser();
  const readXml = async (path: string) => {
    const f = zip.file(path);
    if (!f) return null;
    return parser.parseFromString(await f.async('text'), 'application/xml');
  };

  // Shared strings (each <si> may contain multiple <t> runs)
  const sharedStrings: string[] = [];
  const ssDoc = await readXml('xl/sharedStrings.xml');
  if (ssDoc) {
    for (const si of Array.from(ssDoc.getElementsByTagName('si'))) {
      let text = '';
      for (const t of Array.from(si.getElementsByTagName('t'))) text += t.textContent || '';
      sharedStrings.push(text);
    }
  }

  // Workbook sheet list → relationship targets
  const wbDoc = await readXml('xl/workbook.xml');
  const relsDoc = await readXml('xl/_rels/workbook.xml.rels');
  if (!wbDoc || !relsDoc) throw new Error('Not a valid .xlsx file');

  const relTargets: Record<string, string> = {};
  for (const rel of Array.from(relsDoc.getElementsByTagName('Relationship'))) {
    relTargets[rel.getAttribute('Id') || ''] = rel.getAttribute('Target') || '';
  }

  const sheets: SheetData[] = [];
  for (const sheetEl of Array.from(wbDoc.getElementsByTagName('sheet'))) {
    const name = sheetEl.getAttribute('name') || `Sheet${sheets.length + 1}`;
    const rId = sheetEl.getAttribute('r:id') || sheetEl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || '';
    let target = relTargets[rId];
    if (!target) continue;
    if (!target.startsWith('xl/')) target = 'xl/' + target.replace(/^\//, '');

    const sheetDoc = await readXml(target);
    if (!sheetDoc) continue;

    const rows: string[][] = [];
    for (const rowEl of Array.from(sheetDoc.getElementsByTagName('row'))) {
      const rowIdx = parseInt(rowEl.getAttribute('r') || String(rows.length + 1), 10) - 1;
      const row: string[] = [];
      for (const cell of Array.from(rowEl.getElementsByTagName('c'))) {
        const col = refToCol(cell.getAttribute('r') || 'A1');
        const type = cell.getAttribute('t');
        let value = '';
        if (type === 'inlineStr') {
          value = cell.getElementsByTagName('t')[0]?.textContent || '';
        } else {
          const v = cell.getElementsByTagName('v')[0]?.textContent || '';
          if (type === 's') value = sharedStrings[parseInt(v, 10)] ?? '';
          else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
          else value = v;
        }
        row[col] = value;
      }
      // normalize sparse arrays
      for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
      rows[rowIdx] = row;
    }
    for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
    sheets.push({ name, rows });
  }
  return sheets;
}

export interface SlideData {
  title: string;
  paragraphs: string[];
}

const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';

// Parse a .pptx file into per-slide text (titles + body paragraphs).
export async function parsePptx(data: ArrayBuffer): Promise<SlideData[]> {
  const zip = await JSZip.loadAsync(data);
  const parser = new DOMParser();

  const slidePaths = Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => parseInt(a.match(/\d+/)![0], 10) - parseInt(b.match(/\d+/)![0], 10));
  if (slidePaths.length === 0) throw new Error('No slides found — is this a .pptx file?');

  const slides: SlideData[] = [];
  for (const path of slidePaths) {
    const doc = parser.parseFromString(await zip.file(path)!.async('text'), 'application/xml');
    let title = '';
    const paragraphs: string[] = [];

    // Shapes are <p:sp>; placeholder type lives at nvSpPr/nvPr/ph[@type]
    const shapes = Array.from(doc.getElementsByTagName('p:sp'));
    for (const sp of shapes) {
      const ph = sp.getElementsByTagName('p:ph')[0];
      const phType = ph?.getAttribute('type') || '';
      const isTitle = phType === 'title' || phType === 'ctrTitle';

      for (const p of Array.from(sp.getElementsByTagNameNS(DRAWING_NS, 'p'))) {
        let text = '';
        for (const t of Array.from(p.getElementsByTagNameNS(DRAWING_NS, 't'))) text += t.textContent || '';
        text = text.trim();
        if (!text) continue;
        if (isTitle && !title) title = text;
        else paragraphs.push(text);
      }
    }
    slides.push({ title, paragraphs });
  }
  return slides;
}
