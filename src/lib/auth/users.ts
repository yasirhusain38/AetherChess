import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  image?: string | null;
  createdAt: string;
  provider: "credentials";
}

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
}

async function readUsers(): Promise<LocalUser[]> {
  await ensureStore();
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw) as LocalUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: LocalUser[]) {
  await ensureStore();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByEmail(email: string) {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string) {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email.split("@")[0];
  if (!email || !input.password) {
    throw new Error("Email and password are required");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: LocalUser = {
    id: randomUUID(),
    email,
    name,
    passwordHash,
    image: null,
    createdAt: new Date().toISOString(),
    provider: "credentials",
  };

  const users = await readUsers();
  users.push(user);
  await writeUsers(users);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}

export async function verifyPassword(email: string, password: string) {
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
