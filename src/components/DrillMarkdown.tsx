import * as React from "react";
import type { DrillMarkdownBlock, DrillMarkdownListBlock } from "../utils/drillMarkdown";
import { parseDrillMarkdown, parseDrillStepsMarkdown } from "../utils/drillMarkdown";
import { parseInlineMarkdown } from "../utils/inlineMarkdown";
import type { LegacyCoachingFocusPoint } from "../types/drill";

interface DrillMarkdownProps {
  markdown: string | string[] | LegacyCoachingFocusPoint[];
  className?: string;
  treatAsDrillSteps?: boolean;
}

function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode {
  return parseInlineMarkdown(text).map((segment, index) => {
    const className = [
      segment.bold ? "font-bold" : "",
      segment.italics || segment.type === "placeholder" ? "italic" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const key = `${keyPrefix}-inline-${index}`;

    if (segment.type === "link") {
      return (
        <a
          key={key}
          href={segment.url}
          target="_blank"
          rel="noreferrer"
          className={`${className} underline`}
        >
          {segment.text}
        </a>
      );
    }

    return (
      <span key={key} className={className || undefined}>
        {segment.text}
      </span>
    );
  });
}

function renderListBlock(
  list: DrillMarkdownListBlock,
  keyPrefix: string,
  depth = 0
): React.ReactElement {
  const ListTag = list.ordered ? "ol" : "ul";
  const listStyleClass = list.ordered ? "list-decimal" : "list-disc";
  const verticalSpacingClass = depth === 0 ? "space-y-2" : "mt-2 space-y-1";
  const depthIndentClass =
    depth === 0 ? "pl-5 print:pl-6" : depth === 1 ? "pl-8 print:pl-12" : "pl-11 print:pl-16";
  const listClassName = `${listStyleClass} list-outside ${verticalSpacingClass} ${depthIndentClass}`;

  return (
    <ListTag key={keyPrefix} className={listClassName}>
      {list.items.map((item, itemIndex) => (
        <li key={`${keyPrefix}-item-${itemIndex}`}>
          {renderInlineMarkdown(item.text, `${keyPrefix}-item-${itemIndex}`)}
          {item.children.map((child, childIndex) =>
            renderListBlock(child, `${keyPrefix}-item-${itemIndex}-child-${childIndex}`, depth + 1)
          )}
        </li>
      ))}
    </ListTag>
  );
}

function renderBlock(block: DrillMarkdownBlock, keyPrefix: string): React.ReactElement {
  if (block.type === "heading") {
    if (block.level === 1) {
      return (
        <h3 className="font-bold text-gray-800 dark:text-gray-200 print:text-gray-900">
          {renderInlineMarkdown(block.text, keyPrefix)}
        </h3>
      );
    }
    if (block.level === 2) {
      return (
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 print:text-gray-900">
          {renderInlineMarkdown(block.text, keyPrefix)}
        </h4>
      );
    }
    return (
      <h5 className="font-semibold text-gray-800 dark:text-gray-200 print:text-gray-900">
        {renderInlineMarkdown(block.text, keyPrefix)}
      </h5>
    );
  }

  if (block.type === "paragraph") {
    return <p className="whitespace-pre-wrap">{renderInlineMarkdown(block.text, keyPrefix)}</p>;
  }

  return renderListBlock(block, keyPrefix);
}

export default function DrillMarkdown({
  markdown,
  className = "",
  treatAsDrillSteps = false,
}: DrillMarkdownProps) {
  const blocks = React.useMemo(
    () => (treatAsDrillSteps ? parseDrillStepsMarkdown(markdown) : parseDrillMarkdown(markdown)),
    [markdown, treatAsDrillSteps]
  );

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <div key={`block-${index}`}>{renderBlock(block, `block-${index}`)}</div>
      ))}
    </div>
  );
}
