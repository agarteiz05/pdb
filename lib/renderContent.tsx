import React from "react";

function renderInline(text: string, key: number): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="text-[15px] leading-relaxed text-ink/80 mb-4">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
}

export function renderContent(markdown: string | null): React.ReactNode {
  if (!markdown) return null;

  const blocks = markdown.split(/\n\s*\n/).filter((b) => b.trim());

  return blocks.map((block, index) => {
    const trimmed = block.trim();

    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={index} className="font-display text-xl text-ink mb-3 mt-6 first:mt-0">
          {trimmed.slice(3)}
        </h2>
      );
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      return (
        <img
          key={index}
          src={imageMatch[2]}
          alt={imageMatch[1]}
          className="w-full rounded-xl my-5"
        />
      );
    }

    const spotifyMatch = trimmed.match(
      /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/
    );
    if (spotifyMatch) {
      return (
        <iframe
          key={index}
          className="w-full rounded-xl my-5"
          height="152"
          src={`https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`}
          allow="encrypted-media"
        />
      );
    }

    return renderInline(trimmed, index);
  });
}
