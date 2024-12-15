import { WASocket } from "@whiskeysockets/baileys";
import { EmbedHandler } from "./embedHandler";
import { ConfigManager } from "../../utils/config";

export class AdminHandler {
  private sock: WASocket;
  private embedHandler: EmbedHandler;

  private statusBotGlobal: boolean = true;
  private statusBotPerClient: Map<string, boolean> = new Map();
  private adminNumber?: string;
  private configManager: ConfigManager;

  constructor(
    sock: WASocket,
    embedHanlder: EmbedHandler,
    adminNumber?: string
  ) {
    this.sock = sock;
    this.adminNumber = adminNumber;
    this.embedHandler = embedHanlder;

    this.configManager = new ConfigManager();
    this.loadConfig();
  }

  public setSocket(sock: WASocket) {
    this.sock = sock;
  }

  private loadConfig() {
    const config = this.configManager.getConfig();
    this.statusBotGlobal = config.bot.statusBotGlobal;
    this.statusBotPerClient = new Map(
      Object.entries(config.bot.statusBotPerClient)
    );
    this.adminNumber = config.adminNumber;
    config.embeds.forEach((embed) => {
      this.embedHandler.setEmbeddedCmd(this.adminNumber!, embed);
    });
  }

  private setBotGlobalStatus(status: boolean) {
    this.statusBotGlobal = status;
    const config = this.configManager.getConfig();
    config.bot.statusBotGlobal = status;
    if (status) {
      this.statusBotPerClient.clear();
      config.bot.statusBotPerClient = {};
    }
    this.configManager.saveConfig(config);
  }

  private setBotGlobalKeepPerClientStatus(status: boolean) {
    this.statusBotGlobal = status;
    const config = this.configManager.getConfig();
    config.bot.statusBotGlobal = status;
    this.configManager.saveConfig(config);
  }

  private handleDynamicCommands(phone: string, msgContent: string) {
    if (msgContent.startsWith("embed ")) {
      const embeddedContent = msgContent.substring(6);
      this.embedHandler.setEmbeddedCmd(phone, embeddedContent);
      this.configManager.addEmbedMessage(embeddedContent);
      this.sock.sendMessage(phone, {
        text: `*[BOT🤖]:* \n\nEmbedded command has been set\n> ${embeddedContent}`,
      });
    } else if (msgContent === "clear") {
      const config = this.configManager.getConfig();
      config.embeds = [];
      this.embedHandler.deleteEmbeddedCmd(phone);
      this.configManager.saveConfig(config);
      this.sock.sendMessage(phone, {
        text: "*[BOT🤖]:* \n\nEmbedded command has been cleared",
      });
    } else if (msgContent === "ls embed") {
      this.sock.sendMessage(phone, {
        text: `*[BOT🤖]:* \n\nEmbedded command:\n> ${
          this.embedHandler.getEmbeddedCmd() === undefined
            ? ""
            : this.embedHandler.getEmbeddedCmd()
        }`,
      });
    }
  }

  private handlePerClientCommand(phone: string, msgContent: string) {
    const status =
      msgContent === "disable" ? false : msgContent === "enable" ? true : null;
    if (status !== null) {
      this.configManager.updateClientStatus(phone, status);
      this.sock.sendMessage(phone, {
        text: `*[BOT🤖]:* \n\nBot has been ${
          status ? "enabled 🟢" : "disabled 🔴"
        } by admin`,
      });
    }
  }

  private sendStatusMessage(phone: string) {
    const config = this.configManager.getConfig();
    let statusMessage = `Global bot status: ${
      config.bot.statusBotGlobal ? "active 🟢" : "inactive 🔴"
    }\n`;
    if (Object.keys(config.bot.statusBotPerClient).length > 0) {
      statusMessage += `per client status:\n`;
      Object.entries(config.bot.statusBotPerClient).forEach(
        ([number, status]) => {
          statusMessage += `https://wa.me/${number.split("@")[0]}: ${
            status ? "active 🟢" : "inactive 🔴"
          }\n`;
        }
      );
    } else {
      statusMessage += "\nNo specific contact has a different status.\n";
    }
    return {
      phone,
      statusMessage,
    }
  }
  

  private helpMessage(phone: string) {
    this.sock.sendMessage(phone, {
      text: `*[BOT🤖]:* \n\n
*Available commands:*\n
- *embed* [msg] embed some command\n
- *ls embed*    list embedded command\n
- *clear*       clear embedded command\n
- *disable*     disable bot to all contacts\n
- *enable*      enable bot to all contacts\n
- *keep disable* disable bot and keep previous configuration\n
- *keep enable* enable bot and keep previous configuration\n
- *status*      status bot\n
- *help*        show this message\n`,
    });
  }

  public setAdminNumber(phone: string) {
    this.adminNumber = phone;
  }
  public getAdminNumber(): string | undefined {
    return this.adminNumber;
  }
  public getStatusBotGlobal(): boolean {
    return this.statusBotGlobal;
  }
  public getStatusBotPerClient(phone: string) {
    const config = this.configManager.getConfig();
    let statusMessage = ``
    if (Object.keys(config.bot.statusBotPerClient).length > 0) {
      statusMessage += `per client status:\n`;
      Object.entries(config.bot.statusBotPerClient).forEach(
        ([number, status]) => {
          statusMessage += `https://wa.me/${number.split("@")[0]}: ${
            status ? "active 🟢" : "inactive 🔴"
          }\n`;
        }
      );
    } else {
      statusMessage += "\nNo specific contact has a different status.\n";
    }
    return {phone, statusMessage}
  }

  public handleAdminCommand(phone: string, msgContent: string) {
    console.log(`admin number: ${this.adminNumber}, phone: ${phone}`);
    const config = this.configManager.getConfig();
    if (phone === config.adminNumber) {
      switch (msgContent) {
        case "disable":
          this.setBotGlobalStatus(false);
          this.sock.sendMessage(phone, {
            text: "*[BOT🤖]:* \n\nBot has been disabled globally 🔴",
          });
          break;
        case "enable":
          this.setBotGlobalStatus(true);
          this.sock.sendMessage(phone, {
            text: "*[BOT🤖]:* \n\nBot has been enabled globally 🟢",
          });
          break;
        case "keep enable":
          this.setBotGlobalKeepPerClientStatus(true);
          this.sock.sendMessage(phone, {
            text: `*[BOT🤖]:* \n\nBot has been enabled globally 🟢\nbut the previous configuration was saved \n\nper client status: ${this.getStatusBotPerClient(phone).statusMessage}
            `,
          });
          this.sendStatusMessage(phone);
          break;
        case "keep disable":
          this.setBotGlobalKeepPerClientStatus(false);
          this.sock.sendMessage(phone, {
            text: `*[BOT🤖]:* \n\nBot has been disabled globally 🔴\nbut the previous configuration was saved\n\nper client status: ${this.getStatusBotPerClient(phone).statusMessage}`,
          });
          this.sendStatusMessage(phone);
          break;
        case "status":
          this.sock.sendMessage(phone, {
            text: `*[BOT🤖]:* \n\n${this.sendStatusMessage(phone).statusMessage}`
          });
          break;
        case "help":
          this.helpMessage(phone);
          break;
        default:
          this.handleDynamicCommands(phone, msgContent);
          break;
      }
    } else {
      this.handlePerClientCommand(phone, msgContent);
    }
  }

  public canRespondToContact(phone: string): boolean {
    const config = this.configManager.getConfig();
    return (
      config.bot.statusBotGlobal ||
      (config.bot.statusBotPerClient[phone] ?? true)
    );
  }
}
