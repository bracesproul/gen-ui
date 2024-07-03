"use client";

import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export interface DallEProps {
  imageURL: string;
}

export function DallELoading() {
  return (
    <Card className="w-[325px] max-w-[325px] p-4 h-[350px] max-h-[350px] flex flex-col text-gray-50 bg-white">
      <Skeleton className="h-[16px] w-full" />
      <span>image loading</span>
    </Card>
  );
}

export function DallE(props: DallEProps) {
  return (
    <Card className="w-[325px] max-w-[325px] p-4 h-[350px] max-h-[350px] flex flex-col text-grey-900 bg-white">
      <a href={props.imageURL} target="_blank">
      </a>
    </Card>
  );
}
