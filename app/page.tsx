import Chat from "@/components/prebuilt/chat";
import { Sidebar } from "@/components/sidebar";

export default function Home() {
  return (
    <div className="flex bg-neutral-800">
      <Sidebar />
      <Chat />
    </div>
  );
}
