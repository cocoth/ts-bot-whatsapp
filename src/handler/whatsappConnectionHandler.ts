import {
  makeWASocket,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { MessageHandler } from "./messages/msgHandler";

let msgHandler: MessageHandler | null = null;

export class WhatsAppConnectionHandler {
  private sock: WASocket | null = null;
  private reconnectAttempts: number = 0;
  private timeout: number = 1;
  private messageHandler: MessageHandler;

  constructor() {
    if (!msgHandler) {
        msgHandler = new MessageHandler();
    }
    this.messageHandler = msgHandler
  }

  public async init() {
    if (this.sock) return;

    const { state, saveCreds } = await useMultiFileAuthState("session");
    this.sock = makeWASocket({
      auth: state,
      browser: ["Linux server", "Bot", "Server"],
      printQRInTerminal: true,
    });
    this.sock.ev.on("creds.update", saveCreds);
    if (msgHandler && this.sock) {
      msgHandler.setSocket(this.sock);
      msgHandler.listenForMsg();
    }

    this.sock.ev.on("connection.update", (update) => {
      this.handleConnectionUpdate(update);
    });
  }

  private handleConnectionUpdate(
    update: Partial<{ connection: string; qr?: string }>
  ) {
    if (update.connection === "open") {
      console.log("Connection successfully!");
    } else if (update.connection === "connecting") {
      console.log("Connecting...");
    } else if (update.connection === "close") {
      console.log("Connection closed!. Reconnecting...");
      this.reconnect();
    }
    if (update.qr) {
      console.log(update.qr);
    }
  }

  private reconnect() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= 5) {
      this.sock = null;
      this.init();
    } else {
      console.log(
        `Failed to reconnect after 5 attempts... retrying in ${this.timeout} minute`
      );
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.timeout++;
        if (this.timeout >= 5) {
          this.timeout = 0;
        }
        this.sock = null;

        this.init();
      }, 1000 * 60 * this.timeout);
    }
  }

  public static create() {
    return new WhatsAppConnectionHandler();
  }
}
