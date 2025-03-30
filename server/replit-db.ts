import fetch from "node-fetch";

export class ReplitDB {
  private dbUrl: string;

  constructor() {
    this.dbUrl = process.env.REPLIT_DB_URL || "";
    if (!this.dbUrl) {
      throw new Error("REPLIT_DB_URL environment variable not set");
    }
  }

  async set(key: string, value: any): Promise<void> {
    const data = `${key}=${encodeURIComponent(JSON.stringify(value))}`;
    await fetch(this.dbUrl, {
      method: "POST",
      body: data,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  async get(key: string): Promise<any> {
    const response = await fetch(`${this.dbUrl}/${encodeURIComponent(key)}`);
    if (response.ok) {
      const text = await response.text();
      return JSON.parse(text);
    }
    return null;
  }

  async delete(key: string): Promise<void> {
    await fetch(`${this.dbUrl}/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
  }

  async list(prefix?: string): Promise<string[]> {
    const url = prefix
      ? `${this.dbUrl}?prefix=${encodeURIComponent(prefix)}`
      : this.dbUrl;
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      return text.split("\n").filter((key) => key.length > 0);
    }
    return [];
  }
}

export const replitDb = new ReplitDB();
