import { proto, WASocket, downloadMediaMessage } from "@whiskeysockets/baileys";
import { AiHandler } from "../AI/aiHandler";
import { AdminHandler } from "../admin/adminHandler";
import { EmbedHandler } from "../admin/embedHandler";
import { FileHandler } from "../file-handler/fileHandler";
import {
  ExportConversationHandler,
  HumanBehavior,
} from "../file-handler/exportConversationHandler";

import {
  MessageProps,
  ConversationProps,
  HumanBehaviorProps,
  HMBProps,
} from "../types/type";
import { getFormattedLocalTime } from "../../utils/dateTime";
import { ContactHandler } from "../file-handler/contactHandler";
import { AiCoreHandler } from "../AI/AiCoreHandler";
import { testAiHandler } from "../AI/testAiHandler";
import { handleMessage } from "./handleMessage";
import { ChatSession } from "@google/generative-ai";
import { generateSystemInstruction } from "../../config/systemInstuction";

interface MsgTextProps extends proto.WebMessageInfo {}
interface handleMediaMessageInterface {
  userFields: {
    msg: MsgTextProps;
    name: string;
    phone: string;
    msgContent: string;
    localDate: string;
  };
}

const aiCoreHandlerInstance = new AiCoreHandler();
const testai = testAiHandler;

export class MessageHandler {
  public sock!: WASocket;
  private aiCoreHandler: AiCoreHandler;
  private adminHandler: AdminHandler;
  private embedHandler: EmbedHandler;
  private conversationHandler: ExportConversationHandler;
  private HumanBehaviors: HumanBehavior;
  private fileHandler: FileHandler;
  private contactHandler: ContactHandler;

  constructor(
    embedHandler: EmbedHandler = new EmbedHandler(),
    adminNumber?: string
  ) {
    this.embedHandler = embedHandler;
    // this.aiCoreHandler = new AiCoreHandler();
    this.aiCoreHandler = aiCoreHandlerInstance;
    this.adminHandler = new AdminHandler(
      this.sock,
      this.embedHandler,
      adminNumber
    );
    this.conversationHandler = new ExportConversationHandler();
    this.HumanBehaviors = new HumanBehavior();
    this.fileHandler = new FileHandler();
    this.contactHandler = new ContactHandler();
  }

  public setSocket(sock: WASocket) {
    this.sock = sock;
    this.adminHandler.setSocket(sock);
  }

  private getMsgContent(msg: MsgTextProps): string | undefined {
    try {
      const msgType = Object.keys(msg.message || {})[0];
      console.log({ msgType });

      const msgKey = Object.keys(msg.message || {});
      for (const key of msgKey) {
        const content = (msg.message as proto.Message)[
          key as keyof proto.Message
        ];

        // conversation check
        if (key === "conversation" && typeof content === "string") {
          return content;
        }
        // text check
        if (
          key === "extendedTextMessage" &&
          typeof content === "object" &&
          content !== null
        ) {
          if ("text" in content) {
            return (content as { text: string }).text;
          }
        }

        // ephemeral message check
        if (
          key === "ephemeralMessage" &&
          typeof content === "object" &&
          content !== null
        ) {
          const nestedMessage = (content as { message: proto.Message }).message;
          const nestedContent = nestedMessage?.extendedTextMessage;

          if (nestedContent && "text" in nestedContent) {
            return (nestedContent as { text: string }).text;
          }
        }

        // media check
        if (typeof content === "object" && content !== null) {
          if ("caption" in content) {
            return (content as { caption: string }).caption;
          }
        }
        // pdf check
        if (
          key === "documentWithCaptionMessage" &&
          typeof content === "object"
        ) {
          const documentMsg = content as {
            message: { documentMessage: { caption: string } };
          };
          if (documentMsg.message.documentMessage.caption) {
            return documentMsg.message.documentMessage.caption;
          }
        }
      }
      return undefined;
    } catch (error) {
      console.error({ error });
      return undefined;
    }
  }

  private getQuotedMessageContent(msg: MsgTextProps): string | undefined {
    try {
      const quotedMsg =
        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quotedMsg) {
        const msgType = Object.keys(quotedMsg || {})[0];
        console.log({ msgQuotedType: msgType });
        const msgKey = Object.keys(quotedMsg || {});
        for (const key of msgKey) {
          const content = (quotedMsg as proto.Message)[
            key as keyof proto.Message
          ];
          // conversation check
          if (key === "conversation" && typeof content === "string") {
            return content;
          }
          // text check
          if (
            key === "extendedTextMessage" &&
            typeof content === "object" &&
            content !== null
          ) {
            if ("text" in content) {
              return (content as { text: string }).text;
            }
          }
          // ephemeral message check
          if (
            key === "ephemeralMessage" &&
            typeof content === "object" &&
            content !== null
          ) {
            const nestedMessage = (content as { message: proto.Message })
              .message;
            const nestedContent = nestedMessage?.extendedTextMessage;

            if (nestedContent && "text" in nestedContent) {
              return (nestedContent as { text: string }).text;
            }
          }
          // media check
          if (typeof content === "object" && content !== null) {
            if ("caption" in content) {
              return (content as { caption: string }).caption;
            }
          }
          // pdf check
          if (
            key === "documentWithCaptionMessage" &&
            typeof content === "object"
          ) {
            const documentMsg = content as {
              message: { documentMessage: { caption: string } };
            };
            if (documentMsg.message.documentMessage.caption) {
              return documentMsg.message.documentMessage.caption;
            }
          }
        }
      }
      return undefined;
    } catch (error) {
      console.error({ error });
      return undefined;
    }
  }

  private isValidMessage(
    msg: MsgTextProps,
    msgContent: string | undefined
  ): boolean {
    const phone = msg.key.remoteJid;
    return (
      typeof msgContent === "string" &&
      msgContent.trim() !== "" &&
      !msg.key.fromMe &&
      !phone?.includes("g.us") &&
      phone !== "status@broadcast" &&
      !msg.broadcast
    );
  }

  private setSession(phoneNumber: string, userFields: { name?: string; whatsappNumber?: string }, embeddedPrompt?: string[]) {
    const contactInformation = this.contactHandler.getContact(userFields.whatsappNumber || "");
    // const embeddedPrompt = this.embedHandler?.getEmbeddedCmd().map((embed) => embed[1]);
    const systemInstruction = generateSystemInstruction({
      unsavedContact: {
        name: userFields.name,
        phone: userFields.whatsappNumber,
        relation: contactInformation?.relation,
      },
      contactInformation,
      embeddedPrompt,
    })
    return {phoneNumber, systemInstruction}
  }

  private async handleMediaMessage(
    { userFields }: handleMediaMessageInterface,
    session: ChatSession,
  ) {
    const msg = userFields.msg;
    const name = userFields.name;
    const phone = userFields.phone;
    const msgContent = userFields.msgContent;
    const localDate = userFields.localDate;

    if (!msg) return null;
    const mediaMessage =
      msg.message?.audioMessage ||
      msg?.message?.imageMessage ||
      msg?.message?.videoMessage ||
      msg?.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage;
    if (mediaMessage) {
      const buffer = await downloadMediaMessage(msg, "buffer", {});
      const stream = await downloadMediaMessage(msg, "stream", {});
      if (buffer || stream) {
        try {
          const fileType = mediaMessage.mimetype?.split("/")[1];

          console.log({ rawMedia: mediaMessage.mimetype });
          console.log({ rawName: mediaMessage });
          console.log({ fileType });

          const fileName = `${phone.split("@")[0]}-${localDate}.${fileType}`;
          await this.fileHandler.setSaveFile(buffer, fileName);
          const aiMediaResponse = await this.aiCoreHandler.aiResponse(
            {
              userFields: {
                name,
                whatsappNumber: phone,
                prompt: msgContent,
              },
              media: {
                name: fileName,
                uri: await this.fileHandler.getFileName(buffer),
              },
            },
            session,
          );
          await this.sock.sendMessage(phone, {
            text: `*[ BOT🤖 ]:*\n\n${aiMediaResponse}`,
          });
          return true;
        } catch (error) {
          console.error({ error });
          return undefined;
        }
      }
    }
    return false;
  }

  public listenForMsg() {
    this.sock.ev.on("messages.upsert", async ({ messages }) => {
      const handleMsg = handleMessage(messages);

      const canRespondToContact = this.adminHandler.canRespondToContact(
        handleMsg.phone || ""
      );
      const localDate = getFormattedLocalTime();

      const msgContent = this.getMsgContent(
        handleMsg.msg as MsgTextProps
      )?.toLocaleLowerCase();

      console.log({ msg: JSON.stringify(handleMsg.msg) });
      console.log({ msgContent });

      if (handleMsg.isQuotedMessage) {
        console.log(
          `Quoted Message: ${this.getQuotedMessageContent(
            handleMsg.msg as MsgTextProps
          )}`
        );
      }

      // if (handleMsg.isBroadcastMessage) {
      //   let session = aiCoreHandlerInstance.getSession(handleMsg.phone!);
      //   if (!session) {
      //     session = aiCoreHandlerInstance.setSession(handleMsg.phone!);
      //   }

      //   const loadingAiResponse = setTimeout(async () => {
      //     await this.sock.sendMessage(handleMsg.phone!, {
      //       text: `*[ BOT🤖 ]:*\n\still waiting bot to respon...`,
      //     });
      //   }, 1000 * 5);

      //   const mediaHandled = await this.handleMediaMessage(
      //     {
      //       userFields: {
      //         msg: handleMsg.msg as MsgTextProps,
      //         name: handleMsg.name,
      //         phone: handleMsg.phone!,
      //         msgContent: msgContent || "",
      //         localDate,
      //       },
      //     },
      //     session,
      //   );

      //   clearTimeout(loadingAiResponse);

      //   if (!mediaHandled) {
      //     const aiTextMessageResponse = await aiCoreHandlerInstance.aiResponse(
      //       {
      //         userFields: {
      //           name: handleMsg.name,
      //           whatsappNumber: handleMsg.phone!,
      //           prompt: msgContent,
      //         },
      //       },
      //       session,
      //     );

      //     const conversationObj: HMBProps = {
      //       behavior: aiTextMessageResponse,
      //       timeStamp: localDate,
      //     };

      //     this.HumanBehaviors.setMessage(
      //       handleMsg.name,
      //       handleMsg.phoneNumber || "",
      //       conversationObj
      //     );

      //   }
      // }

      if (
        !handleMsg.isStatusMessage &&
        !handleMsg.isGroupMessage &&
        !handleMsg.isBroadcastMessage &&
        msgContent
      ) {
        const conversationObj: MessageProps = {
          msg: !handleMsg.isBotMessage ? msgContent : "",
          timeStamp: !handleMsg.isBotMessage ? localDate : "",
          reply: handleMsg.isBotMessage ? msgContent : "",
          timeReply: handleMsg.isBotMessage ? localDate : "",
        };
        console.log(`Add Contact: ${handleMsg.phoneNumber} ${handleMsg.name}`);
        this.contactHandler.addContact(
          handleMsg.phoneNumber || "",
          handleMsg.name,
          "client"
        );

        this.conversationHandler.setMessage(
          handleMsg.name,
          handleMsg.phoneNumber || "",
          conversationObj
        );
      }

      // Check if the message is from the bot and if the message content is not empty
      if (msgContent && handleMsg.isBotMessage) {
        this.sock.sendPresenceUpdate("available", handleMsg.msg.key.id!);
        if (handleMsg.isMe) {
          this.adminHandler.setAdminNumber(handleMsg.phone || "");
        }
        this.adminHandler.handleAdminCommand(handleMsg.phone || "", msgContent);
      } else if (
        canRespondToContact &&
        this.isValidMessage(handleMsg.msg as MsgTextProps, msgContent) &&
        msgContent
      ) {
        this.sock.sendPresenceUpdate("available", handleMsg.msg.key.id!);
        
        const embedMsg = this.embedHandler.getEmbeddedCmd().map((embed) => embed[1]);
        
        // const sess = this.setSession(handleMsg.phoneNumber, {
        //   name: handleMsg.name,
        //   whatsappNumber: handleMsg.phoneNumber,
        // }, embedMsg);
        let session = aiCoreHandlerInstance.getSession(handleMsg.phoneNumber);
        if (!session) {
          // session = aiCoreHandlerInstance.setSession(sess.phoneNumber, sess.systemInstruction);
          session = aiCoreHandlerInstance.setSession(handleMsg.phoneNumber, 
            {
              name: handleMsg.name,
              whatsappNumber: handleMsg.phoneNumber,
            }
          );
        }
        // else if(embedMsg){
        //   session = aiCoreHandlerInstance.setSession(sess.phoneNumber, sess.systemInstruction);
        // }

        console.log(`Raw Embed Message ${this.embedHandler.getEmbeddedCmd()}`);
        console.log(`Embed Message ${this.embedHandler.getEmbeddedCmd().map((embed) => embed[1])}`);

        const loadingAiResponse = setTimeout(async () => {
          await this.sock.sendMessage(handleMsg.phone!, {
            text: `*[ BOT🤖 ]:*\n\still waiting bot to respon...`,
          });
        }, 1000 * 5);

        const mediaHandled = await this.handleMediaMessage(
          {
            userFields: {
              msg: handleMsg.msg as MsgTextProps,
              name: handleMsg.name,
              phone: handleMsg.phone!,
              msgContent,
              localDate,
            },
          },
          session
        );

        clearTimeout(loadingAiResponse);

        if (!mediaHandled) {
          const aiTextMessageResponse = await aiCoreHandlerInstance.aiResponse(
            {
              userFields: {
                name: handleMsg.name,
                whatsappNumber: handleMsg.phoneNumber,
                prompt: msgContent,
              },
            },
            session
          );
          await this.sock.sendMessage(handleMsg.phone!, {
            text: `*[ BOT🤖 ]:*\n\n${aiTextMessageResponse}`,
          });
        }
      }
    });
  }
}
