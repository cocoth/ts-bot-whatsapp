import * as fs from "fs";
import * as path from "path";
import * as cyrpto from "crypto";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

import { mimeType } from "../../utils/mimeType";

export class FileHandler {
  private pathName: string;
  private fileName: string;
  private db: Database | null = null;

  constructor(pathName?: string, fileName?: string) {
    this.pathName = pathName || "../../downloads";
    this.fileName = fileName || new Date().toISOString();
    this.initDB();
  }

  private async initDB() {
    this.db = await open({
      filename: path.join(__dirname, "../../data", "file.db"),
      driver: sqlite3.Database,
    });
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_hash TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  private calculateHash(data: Buffer) {
    return cyrpto.createHash("sha256").update(data).digest("hex");
  }

  private async getFilePathByHash(fileHash: string) {
    if (!this.db) return null;
    const file = await this.db?.get(
      "SELECT * FROM files WHERE file_hash = ?",
      fileHash
    );
    return file?.file_path;
  }

  public setLocationFile(
    pathName: string = this.pathName,
    fileName: string = this.fileName
  ) {
    const sanitizedPathName = pathName.replace(/(\.\.[\/\\])/g, "");
    const sanitizedFileName = fileName.replace(/(\.\.[\/\\])/g, "");
    const fullPath = path.join(__dirname, sanitizedPathName, sanitizedFileName);
    return fullPath;
  }

  /**
   * Saves a file to the filesystem and stores its metadata in the database.
   * If a file with the same hash already exists, it returns the existing file's path.
   *
   * @param file - The file content as a Buffer.
   * @param name - The name to save the file as. Defaults to the instance's fileName property.
   * @returns The path of the saved file or the existing file's path if it already exists.
   *
   * @throws Will log and return if an error occurs during file saving or database operations.
   */
  public async setSaveFile(file: Buffer, name: string = this.fileName) {
    const fileHash = this.calculateHash(file);
    const existingFile = await this.db?.get(
      "SELECT * FROM files WHERE file_hash = ?",
      fileHash
    );

    if (existingFile) {
      console.log({ fileAlreadyExist: existingFile.file_path });
      return existingFile.file_path;
    }

    try {
      const fullPath = path.join(__dirname, this.pathName, name);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.writeFileSync(fullPath, file);
      await this.db?.run(
        "INSERT INTO files (file_hash, file_path, created_at) VALUES (?, ?, ?)",
        fileHash,
        fullPath,
        new Date().toISOString()
      );
      this.fileName = fullPath;
      console.log({ success: fullPath });
    } catch (error) {
      console.log("error from setSaveFile");
      console.error({ error: error });
      return;
    }
  }

  public readTextFile(
    filePath: string = this.pathName,
    fileName: string = this.fileName
  ) {
    const fullPath = path.join(__dirname, filePath, fileName);
    console.log(`Reading file from ${fullPath}`);
    try {
      const fileData = fs.readFileSync(fullPath, "utf-8");
      return fileData;
    } catch (error) {
      console.error({ error });
      return;
    }
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

  public async getFileName(buffer: Buffer) {
    const fileHash = this.calculateHash(buffer);
    const filePath = await this.getFilePathByHash(fileHash);
    if (filePath) {
      console.log({ fileExist: filePath });
      return filePath;
    } else {
      console.log({ fileNotExist: fileHash });
      return null;
    }
  }
}
