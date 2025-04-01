import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();
const transporter = nodemailer.createTransport({
  service: "Outlook",
  auth: {
    user: "rsanhueza@outlook.com",
    pass: "nachoUNTIL3",
  },
});

/**
 *
 * @return {Promise<Record<string, number>>}
 */
async function obtenerResumenSolped(): Promise<Record<string, number>> {
  const snapshot = await db.collection("solpes").get();
  const resumen: Record<string, number> = {
    Solicitado: 0,
    Aprobado: 0,
    Rechazado: 0,
    TransitoAFaena: 0,
  };

  snapshot.forEach((doc: FirebaseFirestore.DocumentSnapshot) => {
    const data = doc.data();
    if (
      data &&
      typeof data.estatus === "string" &&
      resumen[data.estatus] !== undefined
    ) {
      resumen[data.estatus]++;
    }
  });

  return resumen;
}

export const enviarResumenSemanal = onSchedule(
  {
    schedule: "every monday 08:00",
    timeZone: "America/Santiago",
  },
  async () => {
    const resumen = await obtenerResumenSolped();

    const mensaje =
    "Resumen semanal de SOLPED:\n" +
    `- Solicitado: ${resumen.Solicitado}\n` +
    `- Aprobado: ${resumen.Aprobado}\n` +
    `- Rechazado: ${resumen.Rechazado}\n` +
    `- Tránsito a Faena: ${resumen.TransitoAFaena}`;

    const mailOptions = {
      from: "rsanhueza@outlook.com",
      to: "rsanhueza@outlook.com",
      subject: "Resumen Semanal de SOLPED",
      text: mensaje,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Correo enviado con éxito");
    } catch (error) {
      console.error("Error al enviar el correo:", error);
    }
  }
);
