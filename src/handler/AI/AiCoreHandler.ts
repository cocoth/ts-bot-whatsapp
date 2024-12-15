import { GoogleGenAI } from "./core";
import { generateSystemInstruction } from "../../config/systemInstuction";

import { FileState } from "@google/generative-ai/server";

import { mimeType } from "../../utils/mimeType";
import { FileHandler } from "../file-handler/fileHandler";
import { EmbedHandler } from "../admin/embedHandler";
import { ContactHandler } from "../file-handler/contactHandler";
import { ChatSession } from "@google/generative-ai";

interface AiCoreHandlerAttributes {
  userFields: {
    name?: string;
    whatsappNumber?: string;
    prompt?: string;
  };
  media?: {
    name?: string;
    uri?: string;
  };
}

const googleGenAI = new GoogleGenAI();
const model = "models/gemini-1.5-flash-001";
const genAI = googleGenAI.getModel(model);
const userSessions = new Map<string, ChatSession>();


export class AiCoreHandler {
  private genAi: GoogleGenAI;

  private fileHandler: FileHandler;
  private contactHandler: ContactHandler;
  private embeddHandler?: EmbedHandler;

  constructor() {
    this.genAi = googleGenAI;
    this.fileHandler = new FileHandler();
    this.contactHandler = new ContactHandler();
    this.embeddHandler = new EmbedHandler();
  }

  private async uploadMedia(filePath: string, displayName: string) {
    const fileManager = new GoogleGenAI().getFileManager();
    try {
      const fileResult = await fileManager.uploadFile(filePath, {
        displayName,
        mimeType: mimeType(filePath),
      });
  
      console.log({ fileResult });
      const { name, uri } = fileResult.file;
  
      let file = await fileManager.getFile(name);
      while (file.state === FileState.PROCESSING) {
        console.log(`File ${name} is still processing...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        file = await fileManager.getFile(name);
      }
      return fileResult;
    } catch (error) {
      console.error({ error });
      return
    }
  }

  public setSession(phoneNumber: string, userFields: { name?: string; whatsappNumber?: string }) {
  // public setSession(phoneNumber: string, systemInstruction: string ) {
    // Generate system instruction only once per session
    const contactInformation = this.contactHandler.getContact(userFields.whatsappNumber || "");
    const embeddedPrompt = this.embeddHandler?.getEmbeddedCmd().map((embed) => embed[1]);

    const systemInstruction = generateSystemInstruction({
      unsavedContact: {
        name: userFields.name,
        phone: userFields.whatsappNumber,
        relation: contactInformation?.relation,
      },
      contactInformation,
      embeddedPrompt,
    });

    const session = genAI.startChat({
      history: [],
      systemInstruction: {
        role: "model",
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },
    });
    console.log(embeddedPrompt ? embeddedPrompt?.length > 0 ? embeddedPrompt : "No embedded prompt": "else embed executed");
    console.log({ session });
    console.log({ systemInstruction });
    userSessions.set(phoneNumber, session);
    return session;
  }

  public getSession(phoneNumber: string) {
    return userSessions.get(phoneNumber);
  }

  public async aiResponse(
    { userFields = {}, media = {} }: AiCoreHandlerAttributes,
    session?: ChatSession,
  ) {
    
    if(!session) return null    
    
    if (!media.name) {
      const result = await session.sendMessage(userFields.prompt || "");
      console.log({ result: result.response.text() });
      return result.response.text();
    }

    // Begin Media Upload

    const uploadFile = await this.fileHandler.fileToGenerativePath(media.uri || "");
    const genContent  = await session.sendMessage([userFields.prompt || "", uploadFile]);
    return genContent.response.text();

    // End of Media Upload


    // Begin the process of uploading the video file

    // const fileResult = await this.uploadMedia(
    //   media.uri || "",
    //   media.name || ""
    // );
    // if(!fileResult) return null
    // // console.log(`File uploaded: ${fileResult.file.name}`);
    // const ttlSeconds = 60 * 60 * 2;
    // const cahceMedia = await googleGenAI.getCacheManager().create({
    //   model,
    //   contents: [
    //     {
    //       role: "user",
    //       parts: [
    //         {
    //           fileData: {
    //             mimeType: fileResult!.file.mimeType,
    //             fileUri: fileResult!.file.uri,
    //           },
    //         },
    //       ],
    //     },
    //   ],
    //   ttlSeconds,
    // });

    // const genModel2 = googleGenAI.getGoogleGenerativeAiInstance().getGenerativeModelFromCachedContent(cahceMedia);
    // const resultCachedContent = await genModel2.generateContent({
    //   contents: [
    //     {
    //       role: "user",
    //       parts: [
    //         {
    //           text: userFields.prompt || "",
    //         },
    //       ],
    //     },
    //   ],
    // });
    // return resultCachedContent.response.text();
    // End the process of uploading the video file
  }
}
