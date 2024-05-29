import Chat from "@/components/prebuilt/chat";
import { GithubLoading } from "@/components/prebuilt/github";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-24 pt-12">
      <div className="w-full min-w-[600px] flex flex-col gap-4">
        <p className="text-[28px] text-center">
          Generative UI with LangChain 🦜🔗
        </p>
        <Chat />
      </div>
    </main>
  );
}
