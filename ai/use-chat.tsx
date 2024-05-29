import { useState } from "react"

export default function useChat() {
  const [messages, setMessages] = useState([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {}

  return {
    messages,
    setMessages,
  }
}