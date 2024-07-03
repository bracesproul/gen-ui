import Markdown from "react-markdown";

export interface MessageTextProps {
  content: string;
}

export function AIMessageText(props: MessageTextProps) {
  return (
    // <div className="flex mr-auto w-fit max-w-[700px] bg-blue-400 rounded-md px-2 py-1 mt-3">
    //   <p className="text-normal text-gray-50 text-left break-words">
    //     <Markdown>{props.content}</Markdown>
    //   </p>
    // </div>
    <li className="flex flex-row mb-4 mr-auto">
      <div className="rounded-2xl py-2 px-4 bg-blue-500 shadow-md flex">
        <p className="text-primary">
          <Markdown>{props.content}</Markdown>
        </p>
      </div>
    </li>
  );
}

export function HumanMessageText(props: MessageTextProps) {
  return (
    // <div className="flex ml-auto w-fit max-w-[700px] bg-gray-200 rounded-md px-2 py-1">
    //   <p className="text-normal text-gray-800 text-left break-words">
    //     {props.content}
    //   </p>
    // </div>
    <li className="flex flex-row-reverse mb-4 ml-auto">
      <div className="rounded-2xl py-2 px-4 bg-slate-400 shadow-md flex">
        <p className="text-primary">
          {props.content}
        </p>
      </div>
    </li>
  );
}
