import { replitDb } from "./replit-db";

// Example usage
async function example() {
  // Store a value
  await replitDb.set("user:1", { name: "Test User", lastLogin: new Date() });

  // Retrieve a value
  const user = await replitDb.get("user:1");

  // List all keys with prefix
  const userKeys = await replitDb.list("user:");

  // Delete a key
  await replitDb.delete("user:1");
}
