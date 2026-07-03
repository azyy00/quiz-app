/**
 * CSV question import for the quiz editor.
 *
 * Expected columns (header row required, matching the downloadable template):
 *   question, option1, option2, option3, option4, correct, time_limit, points
 *
 * - option3/option4 may be left empty (2-option questions like True/False)
 * - correct is 1-based (1 = option1 … 4 = option4)
 * - time_limit (seconds, 5–120) and points (0–2000) are optional;
 *   defaults: 10s / 1000 points
 */

export interface ImportedQuestion {
  text: string;
  options: string[];
  correct_index: number;
  time_limit: number;
  points: number;
}

export interface ImportResult {
  questions: ImportedQuestion[];
  errors: string[];
}

/** Minimal RFC-4180-ish CSV parser: quoted fields, escaped quotes, CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      // Skip completely empty lines
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

export function parseQuestionCsv(text: string): ImportResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  const questions: ImportedQuestion[] = [];

  if (rows.length === 0) {
    return { questions, errors: ["The file is empty."] };
  }

  // Tolerate a missing header if the first row clearly isn't one
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header[0] === "question";
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (dataRows.length === 0) {
    return { questions, errors: ["No question rows found below the header."] };
  }

  dataRows.forEach((cols, idx) => {
    const rowNum = idx + (hasHeader ? 2 : 1); // human-friendly line number
    const [text_, o1, o2, o3, o4, correct, timeLimit, points] = cols.map((c) =>
      (c ?? "").trim()
    );

    if (!text_) {
      errors.push(`Row ${rowNum}: question text is empty — skipped.`);
      return;
    }
    const options = [o1, o2, o3, o4].filter((o) => o && o.length > 0);
    if (options.length < 2) {
      errors.push(`Row ${rowNum}: needs at least 2 options — skipped.`);
      return;
    }

    const correctNum = parseInt(correct, 10);
    if (isNaN(correctNum) || correctNum < 1 || correctNum > options.length) {
      errors.push(
        `Row ${rowNum}: "correct" must be a number between 1 and ${options.length} — skipped.`
      );
      return;
    }

    const tl = parseInt(timeLimit, 10);
    const pts = parseInt(points, 10);

    questions.push({
      text: text_.slice(0, 500),
      options: options.map((o) => o.slice(0, 200)),
      correct_index: correctNum - 1,
      time_limit: isNaN(tl) ? 10 : clamp(tl, 5, 120),
      points: isNaN(pts) ? 1000 : clamp(pts, 0, 2000),
    });
  });

  if (questions.length === 0 && errors.length === 0) {
    errors.push("No valid questions found in the file.");
  }
  return { questions, errors };
}
