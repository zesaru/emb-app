import { Text } from "@react-email/components";
import * as React from "react";

import EmailLayout from "../../base/email-layout";
import { EmailButton } from "../../base/email-button";
import { EmailHeading } from "../../base/email-text";

interface UserInvitationProps {
  userName: string;
  invitationUrl?: string;
}

export function UserInvitation({ userName, invitationUrl }: Readonly<UserInvitationProps>) {
  return (
    <EmailLayout previewText="Te invitamos a EMB-APP">
      <EmailHeading level={1}>Te damos la bienvenida</EmailHeading>
      <Text style={paragraph}>Hola, {userName}:</Text>
      <Text style={paragraph}>
        Te invitamos a acceder a la aplicación de la Embajada del Perú en Japón.
        Confirma tu correo y configura tu contraseña con el siguiente botón.
      </Text>
      {invitationUrl ? (
        <EmailButton href={invitationUrl}>Aceptar invitación</EmailButton>
      ) : (
        <Text style={previewButton}>Aceptar invitación</Text>
      )}
      {!invitationUrl && (
        <Text style={footnote}>Prueba visual: este mensaje no incluye un enlace de acceso.</Text>
      )}
      <Text style={footnote}>
        Si no esperabas esta invitación, puedes ignorar este mensaje.
      </Text>
    </EmailLayout>
  );
}

export default UserInvitation;

const paragraph = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "12px 0",
};

const footnote = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 0",
};

const previewButton = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  display: "table" as const,
  fontSize: "16px",
  fontWeight: "bold",
  margin: "24px auto",
  padding: "12px 32px",
  textAlign: "center" as const,
};
