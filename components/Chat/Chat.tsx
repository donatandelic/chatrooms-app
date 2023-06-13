"use client";
import React, { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Message from "./Message";
import { MessageType } from "@/types/MessageType";
import { ORBIS, POLLING_RATE, renderMessageLimit, replyLimit } from "@/config";
import { ColorRing } from "react-loader-spinner";
import { AiOutlineCloseCircle } from "react-icons/ai";
import { BsFillArrowUpCircleFill } from "react-icons/bs";
import { usePathname } from "next/navigation";
type ContextType = {
  context: string;
};

const Chat: FC<ContextType> = ({ context }) => {
  const pathname = usePathname();
  const [orbisMessages, setOrbisMessages] = useState<MessageType[]>();
  const [message, setMessage] = useState<string>("");
  const [replyTo, setReplyTo] = useState<{ content: string; postId: string }>({
    content: "",
    postId: "",
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [popularMessage, setPopularMessage] = useState<MessageType>();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await ORBIS.getPosts({
      context,
    });
    setOrbisMessages(data);
    setLoading(false);
  }, [context]);

  const fetchPopularMessage = useCallback(async () => {
    setLoading(true);
    const { data } = await ORBIS.getPosts(
      {
        context,
        only_master: true,
        order_by: "count_likes",
      },
      0,
      1
    );
    setPopularMessage(data[0]);
    setLoading(false);
  }, [context]);

  const sendMessage = useCallback(async () => {
    if (!sending) {
      setSending(true);
      const res = await ORBIS.createPost({
        body: message,
        context: context,
        master: replyTo.content ? replyTo.postId : null,
        reploy_to: replyTo.content ? replyTo.postId : null,
      });
      if (res.status == 200) {
        setTimeout(() => {
          setMessage("");
          setReplyTo({ content: "", postId: "" });
          fetchMessages();
          setSending(false);
          window.scrollTo(0, 0);
        }, 1500);
      }
    }
  }, [context, message, fetchMessages, replyTo, sending]);

  useEffect(() => {
    fetchPopularMessage();
    fetchMessages();
  }, [fetchMessages, fetchPopularMessage]);

  useEffect(() => {
    const polling = setInterval(async () => {
      await fetchPopularMessage();
      await fetchMessages();
    }, POLLING_RATE);
    return () => {
      clearInterval(polling);
    };
  }, [fetchMessages, fetchPopularMessage]);

  if (!orbisMessages) return null;

  return (
    <div>
      <div className="pb-[120px] overflow-y-auto">
        <div
          className={`fixed right-[env(safe-area-inset-right)] top-[100px] ${
            pathname == "/chat" ? "w-[100%]" : "w-[75%] 2xl:2-[74%] 2xl:right-[1%]"
          } z-30 bg-[#090A10]`}
        >
          <p className="text-[#CBA1A4] text-xs pt-2 text-center flex items-center justify-center space-x-2">
            Popular Message
            <span className={`${loading ? "opacity-100" : "opacity-0"}`}>
              <ColorRing
                visible={true}
                height="20"
                width="20"
                ariaLabel="blocks-loading"
                colors={[
                  "rgb(100,116,139)",
                  "#CBA1A4",
                  "rgb(100,116,139)",
                  "#CBA1A4",
                  "rgb(100,116,139)",
                ]}
              />
            </span>
          </p>
          {popularMessage?.stream_id && (
            <Message
              postId={popularMessage.stream_id}
              content={
                popularMessage.content.body.length > renderMessageLimit
                  ? popularMessage.content.body.slice(0, renderMessageLimit - 3) + "..."
                  : popularMessage.content.body
              }
              sender={popularMessage.creator}
              upvotes={popularMessage.count_likes}
              refetchAllMessages={fetchMessages}
              setThisAsReply={setReplyTo}
              master={popularMessage.master}
              username={
                popularMessage.creator_details.profile
                  ? popularMessage.creator_details.profile.username
                  : ""
              }
            />
          )}
        </div>

        <div className="overflow-y-auto z-10 pt-[120px] md:pt-[100px]">
          {orbisMessages.map((message, i) => {
            if (message.stream_id != popularMessage?.stream_id) {
              return (
                <Fragment key={i}>
                  <Message
                    postId={message.stream_id}
                    content={message.content.body}
                    sender={message.creator}
                    upvotes={message.count_likes}
                    key={i}
                    refetchAllMessages={fetchMessages}
                    setThisAsReply={setReplyTo}
                    master={message.master}
                    username={
                      message.creator_details.profile
                        ? message.creator_details.profile.username
                        : ""
                    }
                  />
                </Fragment>
              );
            }
          })}
        </div>
      </div>
      <div
        className={` h-[75px] fixed bottom-[50px] left-0 flex flex-col space-y-2 justify-center bg-[rgba(8,9,13,1)] ${
          pathname == "/chat" ? "w-[100%]" : "w-[75%] left-auto right-0"
        }`}
      >
        <div className={`text-white flex justify-between items-center pl-2 text-xs px-4`}>
          <p
            className={`flex items-center space-x-4 ${
              replyTo.content ? "opacity-100" : "opacity-0"
            }`}
          >
            <AiOutlineCloseCircle
              size={18}
              className="hover:cursor-pointer"
              onClick={() => setReplyTo({ content: "", postId: "" })}
            />
            <span className="font-bold">re: </span>
            {replyTo.content &&
              (replyTo.content.length > replyLimit
                ? replyTo.content.slice(0, replyLimit - 1) + "..."
                : replyTo.content)}
          </p>
          <p>Chars: {renderMessageLimit - message.length}</p>
        </div>
        <div className="flex justify-center space-x-2 px-4 w-full items-center">
          <input
            placeholder="Ask a question"
            className="outline-1 border-[1px] border-slate-400 text-slate-400 outline-black rounded-2xl text-sm px-4 py-1 w-[90%] bg-[rgba(0,0,0,0.2)]"
            type="text"
            value={message}
            onChange={(e) =>
              setMessage((prev) => {
                if (
                  prev.length < renderMessageLimit ||
                  e.target.value.length <= renderMessageLimit
                ) {
                  return e.target.value;
                }
                return prev;
              })
            }
          />
          <button
            onClick={async () => await sendMessage()}
            className="text-sm flex justify-center text-center text-white"
          >
            {sending ? (
              <ColorRing
                height="20"
                width="20"
                colors={[
                  "rgb(100,116,139)",
                  "#CBA1A4",
                  "rgb(100,116,139)",
                  "#CBA1A4",
                  "rgb(100,116,139)",
                ]}
              />
            ) : (
              <BsFillArrowUpCircleFill color="rgb(100,116,139)" size={28} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
