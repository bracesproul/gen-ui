"use client";

import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export interface CurrentWebProps {
  url: string;
  title: string;
  description: string;
  screenshot: string;
}

export function CurrentWebLoading() {
  return (
    <Card className="w-[325px] max-w-[325px] p-4 h-[350px] max-h-[350px] flex flex-col text-gray-50 bg-white">
      <div className="text-left mb-4">
        <Skeleton className="h-[16px] w-full" />
      </div>
      <div className="flex-grow flex flex-col justify-center items-center mb-8">
        <Skeleton className="h-[200px] w-[300px]" />
      </div>
      <div className="flex justify-between items-center mb-1">
        <Skeleton className="h-[16px] w-full" />
      </div>
    </Card>
  );
}

export function CurrentWeb(props: CurrentWebProps) {
  const cleanUrl = props.url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "");
  return (
    <Card className="w-[325px] max-w-[325px] p-4 h-[350px] max-h-[350px] flex flex-col text-grey-900 bg-white">
      <a href={props.url} target="_blank">
        <div className="text-left mb-4">
          <p className="font-medium">
            {props.title} ({cleanUrl})
          </p>
        </div>
        <div className="flex-grow flex flex-col justify-center items-center mb-8">
          <img
            width={300}
            height={200}
            src={props.screenshot}
            alt="Screenshot of the website"
          />
        </div>
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm">{props.description}</p>
        </div>
      </a>
    </Card>
  );
}
