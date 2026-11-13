import type { ReactNode } from "react";

/** Quita caracteres de control; React ya escapa el HTML al pintar. */
function sanitizeText(input: string, maxLen = 100_000): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, maxLen);
}

/**
 * Markdown seguro: solo genera elementos React con texto escapado por React.
 * No usa dangerouslySetInnerHTML ni interpreta etiquetas HTML del modelo.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="rounded-xs bg-teal-mist px-1 py-0.5 font-mono text-[0.9em] text-teal-deep"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(
        <em key={`${keyPrefix}-i${i}`} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + token.length;
    i += 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text }: { text: string }) {
  const safe = sanitizeText(text);
  const lines = safe.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2;
      const content = line.replace(/^#{1,3}\s+/, "");
      const Tag = (level === 1 ? "h3" : "h4") as "h3" | "h4";
      blocks.push(
        <Tag key={`h${k++}`} className="mt-3 mb-1 font-display text-lg font-semibold tracking-tight text-ink">
          {inline(content, `h${k}`)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`ol${k++}`} className="my-2 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-teal">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `ol${k}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul${k++}`} className="my-2 list-disc space-y-1.5 pl-5 marker:text-teal">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `ul${k}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() &&
      !/^#{1,3}\s/.test(lines[i] ?? "") &&
      !/^\d+\.\s/.test(lines[i] ?? "") &&
      !/^[-*]\s/.test(lines[i] ?? "")
    ) {
      para.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push(
      <p key={`p${k++}`} className="my-2 leading-relaxed">
        {inline(para.join(" "), `p${k}`)}
      </p>,
    );
  }

  return <div className="text-[0.98rem] text-ink-soft">{blocks}</div>;
}
