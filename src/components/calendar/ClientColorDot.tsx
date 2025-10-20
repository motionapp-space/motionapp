import React from "react";
import { colorClassesForClient } from "@/utils/clientColor";

export const ClientColorDot = ({ clientId }: { clientId: string }) => {
  const { dot } = colorClassesForClient(clientId);
  return <span className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />;
};
