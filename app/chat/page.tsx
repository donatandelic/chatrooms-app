"use client";
import { Chat } from "@/components";
import useOrbisUser from "@/hooks/useOrbisUser";
import useSelectRoom from "@/hooks/useSelectRoom";

export default function ChatPage() {
  const selectedChat = useSelectRoom((state) => state.selectedRoom);
  return (
    <div className="overflow-scroll">
      <Chat context={selectedChat} />
    </div>
  );
}
