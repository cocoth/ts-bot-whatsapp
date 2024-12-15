import * as fs from "fs";
import * as path from "path";
import { Contact } from "../types/type";

export class ContactHandler {
  private contacts: Contact[] = [];
  private contactsPath: string = path.join(__dirname, "../../data/contacts.json");

  constructor() {
    this.loadContacts();
  }

  public async loadContacts() {
    try {
      if (fs.existsSync(this.contactsPath)) {
        const contacts = JSON.parse(
          await fs.promises.readFile(this.contactsPath, "utf-8")
        );
        this.contacts = contacts.data || [];
      } else {
        await fs.promises.writeFile(
          this.contactsPath,
          JSON.stringify({ data: [] })
        );
      }
    } catch (error: Error | any) {
      if (error.code === "ENOENT") {
        await fs.promises.writeFile(
          this.contactsPath,
          JSON.stringify({ data: [] })
        );
      } else {
        console.error("Error loading contacts:", error);
        return [];
      }
    }
  }

  public saveContacts() {
    try {
      const formattedContacts = { data: this.contacts };
      fs.writeFileSync(
        this.contactsPath,
        JSON.stringify(formattedContacts, null, 2)
      );
    } catch (error) {
      console.error("Error saving contacts:", error);
    }
  }

  public addContact(phone: string, name: string, relation: string) {
    const existingContact = this.contacts.find(
      (contact) => contact.phone === phone
    );
    if (existingContact) {
      if (!existingContact.name && name) {
        existingContact.name = name;
        existingContact.relation = relation;
        this.saveContacts();
        console.log(`name change, loaded..`)
      }
      console.log(`Contact already exists`); 
    }else {
      this.contacts.push({ phone: phone, name, relation });
      this.saveContacts();
    }
  }

  public deleteContact(phone: string) {
    this.contacts = this.contacts.filter((contact) => contact.phone !== phone);
    this.saveContacts();
  }

  public getContact(phone: string) {
    this.loadContacts();
    const contact = this.contacts.find((contact) => contact.phone === phone);
    console.log(
      `Contact lookup for phone: ${phone}, Found: ${contact ? "Yes" : "No"}`
    );

    return contact;
  }

  public listContacts() {
    if (this.contacts.length === 0) return "no contacts";
    let contacts = "*List:*\n";
    this.contacts.forEach((contact) => {
      contacts += `Phone: https://wa.me/${contact.phone} \nName: ${contact.name}\nRelation: ${contact.relation}\n\n`;
    });
    return contacts;
  }
}
