
import { Client } from '@replit/object-storage';

class ObjectStorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadFile(fileName: string, data: string | Buffer | NodeJS.ReadableStream): Promise<boolean> {
    try {
      let result;
      
      if (typeof data === 'string') {
        result = await this.client.uploadFromText(fileName, data);
      } else if (Buffer.isBuffer(data)) {
        result = await this.client.uploadFromBytes(fileName, data);
      } else {
        result = await this.client.uploadFromStream(fileName, data);
      }

      if (!result.ok) {
        console.error('Upload failed:', result.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }

  async downloadFile(fileName: string, asText = false): Promise<string | Buffer | null> {
    try {
      let result;
      
      if (asText) {
        result = await this.client.downloadAsText(fileName);
      } else {
        result = await this.client.downloadAsBytes(fileName);
      }

      if (!result.ok) {
        console.error('Download failed:', result.error);
        return null;
      }
      return result.value;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  async listFiles(): Promise<string[]> {
    try {
      const result = await this.client.list();
      if (!result.ok) {
        console.error('List operation failed:', result.error);
        return [];
      }
      return result.value;
    } catch (error) {
      console.error('List operation error:', error);
      return [];
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const result = await this.client.delete(fileName);
      if (!result.ok) {
        console.error('Delete failed:', result.error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
}

export const objectStorage = new ObjectStorageService();
