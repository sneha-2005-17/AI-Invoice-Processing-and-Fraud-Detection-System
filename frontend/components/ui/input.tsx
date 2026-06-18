import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("focus-ring h-10 w-full rounded-md border bg-background px-3 text-sm", props.className)} />;
}
