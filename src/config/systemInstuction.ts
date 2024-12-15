import { FileHandler } from "../handler/file-handler/fileHandler";
import { Contact } from "../handler/types/type";

interface generateSystemInstructionParams {
  unsavedContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  contactInformation?: Contact | null;
  embeddedPrompt?: string[];
}

/**
 * Generates a system instruction string based on provided parameters.
 *
 * @param {Object} params.unsavedContact - Information about an unsaved contact.
 * @param {Object} params.contactInformation - Information about the contact.
 * @param {Array} params.embeddedPrompt - An array of embedded prompts.
 * @param {string} [customConfig] - Optional custom configuration file path.
 * @returns {string} The generated system instruction string.
 */
export const generateSystemInstruction = ({
  unsavedContact = {},
  contactInformation,
  embeddedPrompt = [],
}: generateSystemInstructionParams, 
customConfig?: string
): string => {
  const fileHandler = new FileHandler();
  const ChatInstruction = fileHandler.readTextFile("../../config/","system-config.conf");
  // const customInstruction = fileHandler.readTextFile("../../config/", "behavior-config.conf"); 
  const addEmbeddedMessage = embeddedPrompt ? embeddedPrompt.length > 0
    ? "aku menitipkan pesan kepadamu, sampaikanlah terlebih dahulu dan berkreasilah (jangan di simpan ke memori, selalu cek jika ada pesan terbaru maka sampaikan yang terbaru), oke ini isi pesannya:" 
    + embeddedPrompt : []
    : [];
  const contact = contactInformation ? "ini adalah informasi tentang orang yang berbicaran dengan mu, kamu juga bisa menentukan gender dari nicname whatsapp: " 
  + `Nama: ${contactInformation.name ? contactInformation.name : unsavedContact?.name}, `
  + `nomor WhatsApp: ${contactInformation.phone ? contactInformation.phone: unsavedContact?.phone}, ` 
  + `hubungan: ${contactInformation.relation ? contactInformation.relation: unsavedContact?.relation? "": ""}. `
  + `silahkan gunakan informasi ini untuk menyapa atau membalas dengan hangat`
  : [];
  const finalInstruction = `${ChatInstruction}\n${addEmbeddedMessage}\n${contact}`;
  return finalInstruction;
};
