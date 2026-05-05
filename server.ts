import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Resend (will fail gracefully if key is missing)
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API routes
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório" });
    }

    // In a real app, you would generate a token and save it in a database
    // For this demo, we'll simulate the token
    const token = Math.random().toString(36).substring(2, 15);
    const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log(`[EMAIL SIMULATION] Enviando e-mail de recuperação para: ${email}`);
    console.log(`[EMAIL SIMULATION] Link de redefinição: ${resetLink}`);

    try {
      if (resend) {
        await resend.emails.send({
          from: 'LifeSteps <onboarding@resend.dev>',
          to: email,
          subject: 'Recuperação de Senha - LifeSteps',
          html: `
            <h1>Recuperação de Senha</h1>
            <p>Você solicitou a redefinição de sua senha no LifeSteps.</p>
            <p>Clique no link abaixo para confirmar e definir uma nova senha:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Se você não solicitou isso, ignore este e-mail.</p>
          `
        });
        res.json({ success: true, message: "E-mail de confirmação enviado com sucesso!" });
      } else {
        // Fallback for demo when API key is missing
        res.json({ 
          success: true, 
          message: "E-mail de confirmação enviado (Simulado)! Verifique o console do servidor.",
          debugLink: resetLink // Only for demo purposes
        });
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).json({ error: "Falha ao enviar e-mail de recuperação." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
