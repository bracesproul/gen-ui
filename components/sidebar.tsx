"use client";

import { useState } from "react";
import Link from "next/link";
import AddTeamWorkspace from "./teamspace";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { RiBookReadLine } from "react-icons/ri";
import { RiOpenaiFill } from "react-icons/ri";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [active, setActive] = useState("/");
  const [menuItems] = useState([
    { name: "Auto Scheduler", link: "#" },
    { name: "Auto Scheduler ver2", link: "#" },
    { name: "Presentation and Sli...", link: "#" },
    { name: "Diagrams: Show Me ...", link: "#" },
    { name: "Explore GPTs", link: "#" },
    { name: "Store Chat History MongoDB", link: "#" },
    { name: "Build Next.js Webapp", link: "#" },
    { name: "End-to-end Solutions", link: "#" },
    { name: "Data Pipeline Overview", link: "#" },
    { name: "Understanding CRM Systems", link: "#" },
    { name: "Processing Files to Text", link: "#" },
    { name: "AI in Engineering", link: "#" },
    { name: "Solution Proposal on AI", link: "#" },
    { name: "Future of AI", link: "#" },
    { name: "Sequence Diagram Request", link: "#" },
  ]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    console.log(isOpen);
  };

  return (
    <div
      className={cn(
        "h-screen bg-[#171717] text-white w-72 flex flex-col",
        !isOpen && "w-max",
      )}
    >
      <div className="flex items-center justify-between p-1">
        <button
          className="hover:bg-gray-700 p-2 rounded cursor-pointer"
          onClick={toggleSidebar}
        >
          <RiBookReadLine className="text-gray-400 text-2xl " />
        </button>
        {isOpen && (
          <Link
            className="hover:bg-gray-700 p-2 rounded cursor-pointer"
            href="/"
          >
            <HiOutlinePencilSquare className="text-gray-400 text-2xl " />
          </Link>
        )}
      </div>
      {isOpen && (
        <>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Link
              onClick={() => setActive("ChatGPT")}
              href="/"
              className={`mx-2 rounded-lg group relative flex items-center py-2 hover:bg-neutral-600 ${
                active === "ChatGPT" ? "bg-hoverGray" : ""
              }`}
            >
              <span className="mx-2">
                <RiOpenaiFill />
              </span>
              <span className="text-sm">ChatGPT</span>
              <span className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400">
                ...
              </span>
            </Link>
            {menuItems
              .slice()
              .reverse()
              .map((item, index) => (
                <Link
                  onClick={() => setActive(item.name)}
                  key={index}
                  href={item.link}
                  className={`mx-2 rounded-lg group relative flex items-center py-2 hover:bg-neutral-600 ${
                    active === item.name ? "bg-hoverGray" : ""
                  }`}
                >
                  <span className="mx-2 text-sm">{item.name}</span>
                  <span className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400">
                    ...
                  </span>
                </Link>
              ))}
          </div>
          <AddTeamWorkspace />
        </>
      )}
    </div>
  );
}
