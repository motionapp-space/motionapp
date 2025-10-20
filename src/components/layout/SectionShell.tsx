import React from "react";

type Props = React.PropsWithChildren<{
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
}>;

/**
 * Provides consistent lateral padding and max width per design rules.
 * Prevents components from hitting the viewport edges.
 */
export default function SectionShell({ title, toolbar, children }: Props) {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {(title || toolbar) && (
          <div className="flex items-center justify-between py-4">
            {title && <div className="text-2xl font-semibold">{title}</div>}
            {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
