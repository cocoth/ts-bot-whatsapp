import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { Config } from "../handler/types/type";

export class ConfigManager {
    private filePath: string;

    constructor(filePath: string = "config.yaml") {
        this.filePath = path.join(__dirname, '../config', filePath);
        if (!fs.existsSync(this.filePath)) {
            this.createDefaultConfig();
        }
    }

    public getConfig(): Config {
        const fileContent = fs.readFileSync(this.filePath, "utf8");
        return yaml.parse(fileContent);
    }

    public saveConfig(config: Config): void {
        const yamlContent = yaml.stringify(config);
        const dirPath = path.dirname(this.filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(this.filePath, yamlContent, "utf8");
    }

    private createDefaultConfig(): void {
        const defaultConfig: Config = {
            bot: {
                statusBotGlobal: true,
                statusBotPerClient: {},
            },
            adminNumber: "",
            embeds: [],
        };
        this.saveConfig(defaultConfig);
    }

    public updateClientStatus(phone: string, status: boolean): void {
        const config = this.getConfig();
        config.bot.statusBotPerClient[phone] = status;
        this.saveConfig(config);
    }

    public addEmbedMessage(message: string): void {
        const config = this.getConfig();
        config.embeds.push(message);
        this.saveConfig(config);
    }

    public updateAdminNumber(phone: string): void {
        const config = this.getConfig();
        config.adminNumber = phone;
        this.saveConfig(config);
    }
}
