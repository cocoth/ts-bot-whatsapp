import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import * as fs from "fs";
import { EmbedHandler } from "../admin/embedHandler";
import { ContactHandler } from "../file-handler/contactHandler";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "./core";
import { mimeType } from "../../utils/mimeType";
import { FileHandler } from "../file-handler/fileHandler";
import { generateSystemInstruction } from "../../config/systemInstuction";

dotenv.config();

export class AiHandler {
  private embedHandler: EmbedHandler;
  private contactHandler: ContactHandler;
  private fileHandler: FileHandler;

  private name?: string;
  private whatsappNumber?: string;
  private prompt?: string;
  private systemCmd?: string;

  private static sessionStore: Map<string, string> = new Map();

  constructor(embedHandler: EmbedHandler, systemCmd?: string) {
    this.embedHandler = embedHandler;
    this.contactHandler = new ContactHandler();
    this.fileHandler = new FileHandler();
    this.systemCmd = systemCmd;
  }

  public setAttributes(attributes: {
    name?: string;
    whatsappNumber?: string;
    prompt?: string;
    systemCmd?: string;
  }) {
    if (attributes.name) this.name = attributes.name;
    if (attributes.whatsappNumber) this.whatsappNumber = attributes.whatsappNumber;
    if (attributes.prompt) this.prompt = attributes.prompt;
    if (attributes.systemCmd) this.systemCmd = attributes.systemCmd;
  }

  public getSession(whatsappNumber: string) {
    return AiHandler.sessionStore.get(whatsappNumber);
  }
  public setSession(whatsappNumber: string, response: string) {
    AiHandler.sessionStore.set(whatsappNumber, response);
  }

  public async fileToGenerativePath(fileName: string) {
    const file = fs.readFileSync(fileName);
    const mime = mimeType(fileName);

    console.log({ mimeType: mime });
    return {
      inlineData: {
        data: Buffer.from(file).toString("base64"),
        mimeType: mime,
      },
    };
  }

  public async aiMultimodalResponse(prompt: string, fileName: string) {
    const genAI = new GoogleGenAI().getGoogleGenerativeAiInstance();
    const phone = this.whatsappNumber || "";
    const name = this.name || "";
    const session = this.getSession(phone);
    const embededPrompt = this.embedHandler
      .getEmbeddedCmd()
      .map((embed) => embed[1]);
    const contact = this.contactHandler.getContact(phone);
    const botInstruction = generateSystemInstruction({
      unsavedContact: {
        name,
        phone,
        relation: contact?.relation,
      },
      contactInformation: contact,
      embeddedPrompt: embededPrompt,
    });
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: this.systemCmd || botInstruction,
    });
    const path = await this.fileToGenerativePath(fileName);
    const result = await model.generateContent([prompt, path]);
    const tokenCount = await model.countTokens([prompt, path]);
    console.log({ tokenCount: tokenCount.totalTokens });
    console.log({ genResult: result.response.usageMetadata });
    return result.response.text();
  }

  public async aiMessageResponse(prompt: string) {
    const genAI = new GoogleGenAI().getGoogleGenerativeAiInstance();
    const model = new GoogleGenAI().getModel();

    const phone = this.whatsappNumber || "";
    const name = this.name || "";
    const session = this.getSession(phone);
    const embededPrompt = this.embedHandler
      .getEmbeddedCmd()
      .map((embed) => embed[1]);
    const contact = this.contactHandler.getContact(phone);

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
        {
          role: "model",
          parts: [{ text: "Great to meet you. What would you like to know?" }],
        },
      ],
    });
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  }

  public async aiChatResponse() {
    try {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const phone = this.whatsappNumber || "";
      const name = this.name || "";
      const session = this.getSession(phone);
      const embededPrompt = this.embedHandler
        .getEmbeddedCmd()
        .map((embed) => embed[1]);

      const contact = this.contactHandler.getContact(phone);

      console.log({
        contactName: contact?.name,
        contactPhone: contact?.phone,
      });
      console.log({ contact });
      console.log({
        embededPrompt:
          embededPrompt.length === 0 ? "no embeded prompt" : embededPrompt,
      });

      const botInstruction = generateSystemInstruction({
        unsavedContact: {
          name,
          phone,
          relation: contact?.relation,
        },
        contactInformation: contact,
        embeddedPrompt: embededPrompt,
      });

      const result = await generateText({
        model: google("gemini-1.5-flash-latest"),
        system: this.systemCmd || botInstruction,
        prompt: this.prompt || "",
      });
      this.setSession(phone, result.text);
      console.log(`session: ${session}`);
      return result.text || "Connection error";
    } catch (error) {
      console.error(`Error getting AI response: ${error}`);
    }
  }
}
