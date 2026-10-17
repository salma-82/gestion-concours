import React from 'react';
import katex from 'katex';

const MATH_DELIMITERS = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g;

export default function MathContent({ children }) {
  const content = String(children ?? '');
  const parts = [];
  let lastIndex = 0;
  let match;

  MATH_DELIMITERS.lastIndex = 0;
  while ((match = MATH_DELIMITERS.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));

    const displayMode = match[1] !== undefined || match[3] !== undefined;
    const expression = match[1] ?? match[2] ?? match[3] ?? match[4];
    try {
      parts.push(
        <span
          key={`math-${match.index}`}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(expression, { displayMode, throwOnError: false })
          }}
        />
      );
    } catch {
      parts.push(match[0]);
    }
    lastIndex = MATH_DELIMITERS.lastIndex;
  }

  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return <>{parts}</>;
}
