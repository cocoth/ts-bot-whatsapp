import { WhatsAppConnectionHandler } from "./handler/whatsappConnectionHandler";

async function main(){
    const handler = WhatsAppConnectionHandler.create();
    await handler.init();
}
main()