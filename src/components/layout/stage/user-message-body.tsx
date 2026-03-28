"use client";

export function UserMessageBody({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).filter((segment) => segment.length > 0);

  return (
    <div className="inline-grid max-w-full gap-2.5" data-user-message-body="true">
      {(paragraphs.length > 0 ? paragraphs : [content]).map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          className="m-0 whitespace-pre-wrap break-words text-[0.95rem] leading-7 tracking-[0.01em]"
          style={{ overflowWrap: "anywhere" }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
