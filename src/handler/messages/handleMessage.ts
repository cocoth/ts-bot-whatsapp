import { proto } from "@whiskeysockets/baileys";
export const handleMessage = (messages: proto.IWebMessageInfo[]) => {
    const msg = messages[0];
    const phone = msg.key.remoteJid;
    const phoneNumber = phone?.split("@")[0] || "";
    const name = msg.pushName || msg.participant || "";
    const isGroupMessage = phone?.includes("g.us");
    const isBotMessage = msg.key.fromMe;
    const isMe = msg.message?.extendedTextMessage?.contextInfo?.disappearingMode?.initiatedByMe;
    const isStatusMessage = msg.key.remoteJid === "status@broadcast";
    const isBroadcastMessage = msg.broadcast;
    const isQuotedMessage = !!msg.message?.extendedTextMessage?.contextInfo;
    const isCallMe = !!msg.message?.call;
    const msgType = Object.keys(msg.message || {})[0];
    
    return {
        msg,
        phone,
        phoneNumber,
        name,
        isGroupMessage,
        isBotMessage,
        isMe,
        isStatusMessage,
        isBroadcastMessage,
        isQuotedMessage,
        isCallMe,
        msgType
    }
};
