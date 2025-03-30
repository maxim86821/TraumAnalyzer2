import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { insertUserSchema, User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Konfiguration
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d"; // 7 Tage

// Helfer-Funktionen
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

function generateToken(user: SelectUser): string {
  const payload = {
    id: user.id,
    username: user.username,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware für Authentifizierung
export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Nicht authentifiziert" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res
      .status(401)
      .json({ message: "Ungültiger oder abgelaufener Token" });
  }

  // Benutzer in der Anfrage speichern
  req.user = { id: decoded.id, username: decoded.username } as Express.User;
  next();
}

// Auth-Setup
export function setupAuth(app: Express) {
  // Middleware
  app.use(cookieParser());

  // Passport-Konfiguration
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, {
            message: "Benutzername oder Passwort falsch",
          });
        }

        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, {
            message: "Benutzername oder Passwort falsch",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Routen

  // Registrierung
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("Registrierungsanfrage empfangen:", req.body);

      // Einfache manuelle Validierung für Benutzername und Passwort
      const { username, password: userPassword } = req.body;

      if (!username || typeof username !== "string" || username.length < 3) {
        return res.status(400).json({
          message: "Ungültige Benutzerdaten",
          errors: [
            {
              path: ["username"],
              message: "Benutzername muss mindestens 3 Zeichen lang sein",
            },
          ],
        });
      }

      if (
        !userPassword ||
        typeof userPassword !== "string" ||
        userPassword.length < 6
      ) {
        return res.status(400).json({
          message: "Ungültige Benutzerdaten",
          errors: [
            {
              path: ["password"],
              message: "Passwort muss mindestens 6 Zeichen lang sein",
            },
          ],
        });
      }

      // Prüfe, ob der Benutzername bereits existiert
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Benutzername bereits vergeben" });
      }

      // Hash des Passworts
      const hashedPassword = await hashPassword(userPassword);

      // Erstelle neuen Benutzer
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      // Erstelle JWT
      const token = generateToken(user);

      // Setze Cookie
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Sende Benutzerinformationen zurück (ohne Passwort)
      const userWithoutPassword = { id: user.id, username: user.username };
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      res.status(500).json({ message: "Fehler bei der Registrierung" });
    }
  });

  // Login
  app.post(
    "/api/auth/login",
    async (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate(
        "local",
        { session: false },
        (err: any, user: Express.User | false, info: { message: string }) => {
          if (err) {
            return next(err);
          }

          if (!user) {
            return res
              .status(401)
              .json({ message: info?.message || "Ungültige Anmeldedaten" });
          }

          // Erstelle JWT
          const token = generateToken(user);

          // Setze Cookie
          res.cookie("token", token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });

          // Sende Benutzerinformationen zurück (ohne Passwort)
          const userInfo = { id: user.id, username: user.username };
          return res.json(userInfo);
        },
      )(req, res, next);
    },
  );

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Erfolgreich abgemeldet" });
  });

  // Aktuellen Benutzer abrufen
  app.get("/api/auth/me", authenticateJWT, (req: Request, res: Response) => {
    res.json(req.user);
  });


  // Return nothing, authenticateJWT is already exported
}
