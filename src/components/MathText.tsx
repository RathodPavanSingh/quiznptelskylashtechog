"use client";

import { useEffect, useRef } from "react";

export function MathText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = text;

    let tries = 0;
    const render = () => {
      const fn = (window as unknown as {
        renderMathInElement?: (
          node: HTMLElement,
          options: Record<string, unknown>,
        ) => void;
      }).renderMathInElement;

      if (fn) {
        fn(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
          ],
          throwOnError: false,
          strict: false,
        });
      } else if (tries++ < 30) {
        window.setTimeout(render, 100);
      }
    };
    render();
  }, [text]);

  return <div ref={ref} className={`whitespace-pre-wrap ${className}`} />;
}
