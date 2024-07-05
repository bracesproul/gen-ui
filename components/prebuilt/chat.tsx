"use client";

import { useState, useRef, useEffect, use } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EndpointsContext } from "@/app/agent";
import { useActions } from "@/utils/client";
import { LocalContext } from "@/app/shared";
import { HumanMessageText } from "./message";
import { Paperclip, FileText, Image, Video } from "lucide-react";

export interface ChatProps {}

function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(",")[1]); // Remove the data URL prefix
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

function FileUploadMessage({ file }: { file: File }) {
  return (
    <div className="flex w-full max-w-fit ml-auto">
      <p>File uploaded: {file.name}</p>
    </div>
  );
}

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File>();
  const [submitLock, setSubmitLock] = useState(false);

  async function onSubmit(input: string) {
    const newElements = [...elements];
    let base64File: string | undefined = undefined;
    let fileExtension = selectedFile?.type.split("/")[1];
    if (selectedFile) {
      base64File = await convertFileToBase64(selectedFile);
    }
    console.log("submit");
    if(submitLock) {
      return;
    }
    setSubmitLock(true)
    console.log("submit lock");
    const element = await actions.agent({
      input,
      chat_history: history,
      file:
        base64File && fileExtension
          ? {
              base64: base64File,
              extension: fileExtension,
            }
          : undefined,
    });

    newElements.push(
      <div className="flex flex-col w-full gap-1 mt-auto" key={history.length}>
        {selectedFile && <FileUploadMessage file={selectedFile} />}
        <HumanMessageText content={input} />
        <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          {element.ui}
        </div>
      </div>,
    );

    // consume the value stream to obtain the final value
    // after which we can append to our chat history state
    (async () => {
      let lastEvent = await element.lastEvent;
      if (typeof lastEvent === "object") {
        if (lastEvent["invokeModel"]["result"]) {
          setHistory((prev) => [
            ...prev,
            ["user", input],
            ["assistant", lastEvent["invokeModel"]["result"]],
          ]);
        } else if (lastEvent["invokeTools"]) {
          setHistory((prev) => [
            ...prev,
            ["user", input],
            [
              "assistant",
              `Tool result: ${JSON.stringify(lastEvent["invokeTools"]["toolResult"], null)}`,
            ],
          ]);
        } else {
          console.log("ELSE!", lastEvent);
        }
      }
    })().then(() => {
      console.log("done");
      setSubmitLock(false);
      console.log("submit unlock");
    });;

    setElements(newElements);
    setInput("");
    setSelectedFile(undefined);
  }

  return (
    <div className="w-full h-screen max-h-dvh flex flex-col gap-4 mx-autorounded-lg p-3 shadow-sm">
      <header className="p-4">
        <h1 className="text-lg font-semibold">ChatHKT</h1>
      </header>
      
      <LocalContext.Provider value={onSubmit} >
        <ul className="flex flex-col w-[80%] gap-1 mt-auto container overflow-y-auto">{elements}</ul>
      </LocalContext.Provider>
      
      <form
        onSubmit={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await onSubmit(input);
        }}
        className="flex flex-row gap-2 container w-[80%] bg-transparent"
      >
        
        <label className="flex items-center cursor-pointer">
            <Image />
            <Input
              id="image"
              type="file"
              accept="image/*"
              className="w-0 p-0 m-0"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </label>
        <Input
          placeholder="Enter your question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="rounded-xl"
        />
        
        <Button type="submit" className="rounded-xl" disabled={submitLock}>{submitLock ? "..." : "Submit"}</Button>
      </form>
    </div>
  );
}
