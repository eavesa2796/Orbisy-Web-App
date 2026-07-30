"use client";

import type { ComponentProps } from "react";
import {
  trackEvent,
  type AnalyticsEventName,
} from "@/components/analytics-provider";

type Props = ComponentProps<"a"> & {
  eventName: AnalyticsEventName;
  componentId: string;
};

export function TrackLink({
  eventName,
  componentId,
  onClick,
  ...props
}: Props) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackEvent(eventName, componentId);
        onClick?.(event);
      }}
    />
  );
}
