import React from "react";

type Props = React.PropsWithChildren<{
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  /** Use "dense" for operational views like Calendar/Agenda (12px), default is 16px */
  density?: "default" | "dense";
}>;

/**
 * Provides consistent lateral padding and max width per design rules.
 * Prevents components from hitting the viewport edges.
 */
export default function SectionShell({ title, toolbar, children, density = "default" }: Props) {
  const verticalPadding = density === "dense" ? "py-3" : "py-4";
  
  return (
    <div className="w-full">
      <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10 ${verticalPadding}`}>
        {(title || toolbar) && (
          <div className="flex items-center justify-between pb-4">
            {title && <div className="text-2xl font-semibold">{title}</div>}
            {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
