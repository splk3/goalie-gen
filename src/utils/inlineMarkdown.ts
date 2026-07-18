export interface InlineMarkdownSegment {
  type: "text" | "link" | "placeholder";
  text: string;
  url?: string;
  bold?: boolean;
  italics?: boolean;
}

interface InlineStyle {
  bold: boolean;
  italics: boolean;
}

const EMPTY_STYLE: InlineStyle = { bold: false, italics: false };

function pushSegment(segments: InlineMarkdownSegment[], segment: InlineMarkdownSegment): void {
  const previous = segments[segments.length - 1];
  if (
    previous &&
    previous.type === "text" &&
    segment.type === "text" &&
    previous.type === segment.type &&
    previous.url === segment.url &&
    previous.bold === segment.bold &&
    previous.italics === segment.italics
  ) {
    previous.text += segment.text;
    return;
  }
  segments.push(segment);
}

function styleProperties(style: InlineStyle): Pick<InlineMarkdownSegment, "bold" | "italics"> {
  return {
    ...(style.bold ? { bold: true } : {}),
    ...(style.italics ? { italics: true } : {}),
  };
}

function findClosingMarker(text: string, marker: string, start: number): number {
  let index = start;
  while ((index = text.indexOf(marker, index)) !== -1) {
    if (index > 0 && text[index - 1] === "\\") {
      index += marker.length;
      continue;
    }
    if (marker.length === 1 && text.startsWith(marker, index + 1)) {
      index += 2;
      continue;
    }
    if (
      (marker === "_" || marker === "__") &&
      index > 0 &&
      index + marker.length < text.length &&
      /\w/.test(text[index - 1]) &&
      /\w/.test(text[index + marker.length])
    ) {
      index += marker.length;
      continue;
    }
    return index;
  }
  return -1;
}

function parseInline(text: string, inheritedStyle: InlineStyle): InlineMarkdownSegment[] {
  const segments: InlineMarkdownSegment[] = [];

  for (let index = 0; index < text.length;) {
    if (text[index] === "\\" && index + 1 < text.length) {
      pushSegment(segments, {
        type: "text",
        text: text[index + 1],
        ...styleProperties(inheritedStyle),
      });
      index += 2;
      continue;
    }

    if (text[index] === "[") {
      const linkMatch = text.slice(index).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        pushSegment(segments, {
          type: "link",
          text: linkMatch[1],
          url: linkMatch[2],
          ...styleProperties(inheritedStyle),
        });
        index += linkMatch[0].length;
        continue;
      }

      const placeholderMatch = text.slice(index).match(/^\[[^\]]+\]/);
      if (placeholderMatch) {
        pushSegment(segments, {
          type: "placeholder",
          text: placeholderMatch[0],
          ...(inheritedStyle.italics ? { italics: true } : {}),
          ...(inheritedStyle.bold ? { bold: true } : {}),
        });
        index += placeholderMatch[0].length;
        continue;
      }
    }

    const marker = text.startsWith("**", index)
      ? "**"
      : text.startsWith("__", index)
        ? "__"
        : text[index] === "*"
          ? "*"
          : text[index] === "_"
            ? "_"
            : null;

    if (marker) {
      const closingIndex = findClosingMarker(text, marker, index + marker.length);
      if (closingIndex > index + marker.length) {
        const nestedStyle: InlineStyle = {
          bold: inheritedStyle.bold || marker === "**" || marker === "__",
          italics: inheritedStyle.italics || marker === "*" || marker === "_",
        };
        parseInline(text.slice(index + marker.length, closingIndex), nestedStyle).forEach((segment) =>
          pushSegment(segments, segment)
        );
        index = closingIndex + marker.length;
        continue;
      }
    }

    pushSegment(segments, {
      type: "text",
      text: text[index],
      ...styleProperties(inheritedStyle),
    });
    index += 1;
  }

  return segments;
}

export function parseInlineMarkdown(text: string): InlineMarkdownSegment[] {
  return parseInline(text, EMPTY_STYLE);
}
