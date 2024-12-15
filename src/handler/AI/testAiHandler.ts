import { GoogleGenAI } from "./core";
import { generateSystemInstruction } from "../../config/systemInstuction";
import { ContactHandler } from "../file-handler/contactHandler";
import { EmbedHandler } from "../admin/embedHandler";

interface AiCoreHandlerAttributes {
  userFields?: {
    name?: string;
    whatsappNumber?: string;
    prompt?: string;
  };
  media?: {
    name?: string;
    uri?: string;
  };
}

const genAI = new GoogleGenAI();
const contactHandler = new ContactHandler();
const embeddHandler = new EmbedHandler();
const model = "models/gemini-1.5-flash-001";
const genModel = genAI.getModel(model);

// Inisialisasi `chat` sekali di luar `testAiHandler` untuk mempertahankan riwayat
const systemInstruction = generateSystemInstruction({
  unsavedContact: {
    name: "User", // nilai default
    phone: "",
    relation: "friend",
  },
  contactInformation: null,
  embeddedPrompt: [],
});

genModel.systemInstruction = {
  role: "model",
  parts: [
    {
      text: systemInstruction,
    },
  ],
};

const chat = genModel.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});

export async function testAiHandler({
  userFields = {},
  media = {},
}: AiCoreHandlerAttributes = {}) {
  console.log(`Executing testAIHandler`);

  const contactInformation = contactHandler.getContact(
    userFields.whatsappNumber || ""
  );
  const embeddedPrompt = embeddHandler
    ?.getEmbeddedCmd()
    .map((embed) => embed[1]);

  // Update system instruction sesuai dengan input pengguna
  const updatedSystemInstruction = generateSystemInstruction({
    unsavedContact: {
      name: userFields.name,
      phone: userFields.whatsappNumber,
      relation: contactInformation?.relation,
    },
    contactInformation,
    embeddedPrompt,
  });

  genModel.systemInstruction = {
    role: "model",
    parts: [
      {
        text: updatedSystemInstruction,
      },
    ],
  };

  // Kirim prompt dan dapatkan hasilnya
  const result = await chat.sendMessage(userFields.prompt || "");
  console.log({ result: result.response.text() });
  return result.response.text();
}
