"use client";
import { Chat, Menu } from "@/components";
import { ORBIS } from "@/config";
import useSelectRoom from "@/hooks/useSelectRoom";
import useWindowSize from "@/hooks/useWindowSize";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect } from "react";

const App = () => {
  const router = useRouter();
  const checkConnection = useCallback(async () => {
    let res = await ORBIS.isConnected();
    if (res.status != 200) {
      router.push("/");
    }
  }, [router]);
  const [width, height] = useWindowSize();
  const selectedChat = useSelectRoom((state) => state.selectedRoom);
  useEffect(() => {
    checkConnection();
  }, [checkConnection, selectedChat]);

  if (width <= 760) {
    return (
      <div className="overflow-scroll md:hidden">
        <Menu />
      </div>
    );
  } else {
    return (
      <div className="hidden md:flex">
        <div className="overflow-scroll w-[25%] max-w-[400px] border-r-2 border-slate-900">
          <Menu />
        </div>
        <div className="overflow-scroll w-[75%]">
          <Chat context={selectedChat} />
        </div>
      </div>
    );
  }
};

export default App;
