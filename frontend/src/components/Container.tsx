import { useState } from "react";
import axios from "axios";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function Container() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendToBackend = async (userText: string) => {
    const res = await axios.post("/api/chat", {
      message: userText,
    });

    return res.data.reply; 
  };

  const handleSubmit = async (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!input.trim()) return;

    if (("key" in e && e.key === "Enter") || e.type === "click") {
      e.preventDefault();

      const userText = input;

      setMessages((prev) => [
        ...prev,
        { role: "user", text: userText },
      ]);

      setInput("");
      setLoading(true);

      try {
        const botReply = await sendToBackend(userText);

        setMessages((prev) => [
          ...prev,
          { role: "bot", text: botReply },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Something went wrong " },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl pb-44 px-2">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`my-3 p-3 rounded-xl max-w-fit ${
            msg.role === "user"
              ? "bg-neutral-800 ml-auto"
              : "bg-neutral-700"
          }`}
        >
          {msg.text}
        </div>
      ))}

      {loading && (
        <div className="bg-neutral-700 p-3 rounded-xl max-w-fit">
          Typing...
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 flex justify-center bg-neutral-900 px-2">
        <div className="bg-neutral-800 p-2 rounded-3xl w-full max-w-3xl mb-3">
          <textarea
            rows={2}
            value={input}
            className="w-full resize-none outline-0 p-2"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleSubmit}
          />

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-white py-1 px-4 text-black rounded-full mt-2 hover:bg-gray-300"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
