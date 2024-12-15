import * as fs from "fs";
import * as path from "path";
import {
  MessageProps,
  ConversationProps,
  HumanBehaviorProps,
  HMBProps,
} from "../types/type";

export class ExportConversationHandler {
  private conversationPath: string = path.join(__dirname, "../../data/chats");

  constructor() {
    if (!fs.existsSync(this.conversationPath)) {
      fs.mkdirSync(this.conversationPath, { recursive: true });
    }
  }

  private getFilePath(phone: string) {
    const fullPath = path.join(this.conversationPath, `${phone}-chat.json`);
    return fullPath;
  }

  public setMessage(name: string, phone: string, message: MessageProps) {
    const fullPath = this.getFilePath(phone);
    console.log(`Chat path: ${fullPath}`);
    let conversation: ConversationProps;
    try {
      if (fs.existsSync(fullPath)) {
        const fileData = fs.readFileSync(fullPath, "utf-8");
        if (fileData.trim() === "") {
          conversation = {
            name,
            phone,
            message: [message],
          };
        } else {
          conversation = JSON.parse(fileData);
        }
      } else {
        conversation = {
          name,
          phone,
          message: [message],
        };
      }
      conversation.message.push(message);
      fs.writeFileSync(fullPath, JSON.stringify(conversation, null, 2));
    } catch (error) {
      console.error({ error });
      return;
    }
  }
}

export class HumanBehavior {
  private conversationPath: string = path.join(__dirname, "../../data/chats");

  constructor() {
    if (!fs.existsSync(this.conversationPath)) {
      fs.mkdirSync(this.conversationPath, { recursive: true });
    }
  }

  private getFilePath(phone: string) {
    const fullPath = path.join(
      this.conversationPath,
      `Behavior-${phone}-chat.json`
    );
    return fullPath;
  }

  public setMessage(name: string, phone: string, messages: HMBProps) {
    const fullPath = this.getFilePath(phone);
    console.log(`HumanBehavior path: ${fullPath}`);
    let conversation: HumanBehaviorProps;
    try {
      if (fs.existsSync(fullPath)) {
        const fileData = fs.readFileSync(fullPath, "utf-8");
        if (fileData.trim() === "") {
          conversation = {
            name,
            phone,
            message: [messages],
          };
        } else {
          conversation = JSON.parse(fileData);
        }
      } else {
        conversation = {
          name,
          phone,
          message: [messages],
        };
      }
      conversation.message.push(messages);
      fs.writeFileSync(fullPath, JSON.stringify(conversation, null, 2));
    } catch (error) {
      console.error({ error });
      return;
    }
  }
}
