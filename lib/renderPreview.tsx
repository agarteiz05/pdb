import React from "react";

function renderInline(text: string, key: number): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="text-sm leading-relaxed text-neutral-700 mb-3">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-neutral-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
}

export function renderPreview(markdown: string): React.ReactNode {
  if (!markdown.trim()) {
    return <p className="text-sm text-neutral-300 italic">La vista previa aparece acá.</p>;
  }

  const blocks = markdown.split(/\n\s*\n/).filter((b) => b.trim());

  return blocks.map((block, index) => {
    const trimmed = block.trim();

    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={index} className="font-semibold text-base text-neutral-900 mb-2 mt-4 first:mt-0">
          {trimmed.slice(3)}
        </h2>
      );
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      return (
        <div
          key={index}
          className="w-full h-28 bg-teal-50 rounded-lg flex items-center justify-center mb-3"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth={1.5}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      );
    }

    if (trimmed.match(/^https:\/\/open\.spotify\.com\//)) {
      return (
        <div
          key={index}
          className="w-full h-14 bg-emerald-900 rounded-lg flex items-center px-4 mb-3"
        >
          <span className="text-emerald-50 text-xs">♫ reproducir en Spotify</span>
        </div>
      );
    }

    return renderInline(trimmed, index);
  });
}
