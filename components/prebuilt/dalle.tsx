"use client";

import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";

export interface DallEProps {
  imageURL: string ;
}

export function DallELoading() {
  return (
    <Skeleton className="w-[350px] max-w-[350px] h-[350px] max-h-[350px] bg-slate-500" />
  );
}

export function DallE(props: DallEProps) {
  
  return (
    <Image
      src={props.imageURL}
      width={350}
      height={350}
      alt="Picture of the author"
      className="bg-slate-500"
    />  
  );
}
