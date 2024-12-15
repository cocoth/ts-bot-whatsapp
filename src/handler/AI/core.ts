import { google } from "@ai-sdk/google";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import {
  GoogleAICacheManager,
  GoogleAIFileManager
} from "@google/generative-ai/server";
import * as dotenv from "dotenv";
dotenv.config();

export class GoogleGenAI {
  private googleGenerativeAiInstance: GoogleGenerativeAI;
  private model: GenerativeModel;
  private API_KEY: string = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  private cacheManager: GoogleAICacheManager | null = null;
  private fileManager: GoogleAIFileManager | null = null;

  private models: Map<string, GenerativeModel> = new Map()

  constructor() {
    this.googleGenerativeAiInstance = new GoogleGenerativeAI(this.validateApiKey());
    this.model = this.googleGenerativeAiInstance.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    // this.getModel()
    this.fileManager = new GoogleAIFileManager(this.validateApiKey());
  }

  private validateApiKey(): string {
    if (!this.API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }
    return this.API_KEY;
  }

  public getGoogleGenerativeAiInstance(): GoogleGenerativeAI {
    return this.googleGenerativeAiInstance;
  }

  public getModel(modelName: string = "gemini-1.5-flash-latest") {
    console.log(`this only runs once`);
    if(modelName){
      this.model = this.googleGenerativeAiInstance.getGenerativeModel({ model: modelName });
      console.log(`using model : ${modelName}`);
    }
    return this.model
  }

  public getCacheManager() {
    if (!this.cacheManager) {
      this.cacheManager = new GoogleAICacheManager(this.validateApiKey());
    }
    return this.cacheManager;
  }

  public getFileManager() {
    if (!this.fileManager) {
      this.fileManager = new GoogleAIFileManager(this.validateApiKey());
    }
    return this.fileManager;
  }
}



// import { google } from "@ai-sdk/google";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import {
//   GoogleAICacheManager,
//   GoogleAIFileManager
// } from "@google/generative-ai/server";
// import * as dotenv from "dotenv";
// dotenv.config();

// export class GoogleGenAI {
//   private googleGenerativeAiInstance: GoogleGenerativeAI;
//   private model: any;
//   private genModel: string = "gemini-1.5-flash-latest";
//   private API_KEY: string = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
//   private cacheManager: GoogleAICacheManager | null = null;
//   private fileManager: GoogleAIFileManager | null = null;

//   constructor() {
//     this.googleGenerativeAiInstance = new GoogleGenerativeAI(this.validateApiKey());
//     this.model = this.googleGenerativeAiInstance.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
//   }

//   private validateApiKey(): string {
//     if (!this.API_KEY) {
//       throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
//     }
//     return this.API_KEY;
//   }

//   public getGoogleGenerativeAiInstance(): GoogleGenerativeAI {
//     return this.googleGenerativeAiInstance;
//   }

//   public getModel(modelName: string = this.genModel) {
//     console.log(`this getModel suppose to only runs once`);
//     // this.model = this.googleGenerativeAiInstance.getGenerativeModel({ model: modelName });
//     return this.model;
//   }

//   public getCacheManager() {
//     if (!this.cacheManager) {
//       this.cacheManager = new GoogleAICacheManager(this.validateApiKey());
//     }
//     return this.cacheManager;
//   }

//   public getFileManager() {
//     if (!this.fileManager) {
//       this.fileManager = new GoogleAIFileManager(this.validateApiKey());
//     }
//     return this.fileManager;
//   }
// }
