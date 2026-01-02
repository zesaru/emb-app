import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface BackupNotificationProps {
  type: "success" | "failure";
  backupDate: string;
  backupSize?: string;
  error?: string;
}

export const BackupNotification: React.FC<Readonly<BackupNotificationProps>> = ({
  type,
  backupDate,
  backupSize,
  error,
}) => {
  const isSuccess = type === "success";

  const previewText = isSuccess
    ? "Backup completado exitosamente"
    : "Error en el proceso de backup";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isSuccess ? "Backup Completado" : "Error en Backup"}
          </Heading>

          <Section style={section}>
            {isSuccess ? (
              <>
                <Text style={text}>Hola,</Text>
                <Text style={text}>
                  El backup de la base de datos se ha completado exitosamente.
                </Text>

                <div style={box}>
                  <Text style={boxText}>
                    <strong>Fecha:</strong> {backupDate}
                  </Text>
                  {backupSize && (
                    <Text style={boxText}>
                      <strong>Tamaño:</strong> {backupSize}
                    </Text>
                  )}
                  <Text style={boxText}>
                    <strong>Estado:</strong>{" "}
                    <span style={successBadge}>Completado</span>
                  </Text>
                </div>

                <Text style={text}>
                  El archivo de backup ha sido almacenado de forma segura y está
                  disponible para su restauración si es necesario.
                </Text>
              </>
            ) : (
              <>
                <Text style={text}>Hola,</Text>
                <Text style={text}>
                  Se ha producido un error durante el proceso de backup.
                </Text>

                <div style={errorBox}>
                  <Text style={errorBoxText}>
                    <strong>Fecha:</strong> {backupDate}
                  </Text>
                  <Text style={errorBoxText}>
                    <strong>Estado:</strong>{" "}
                    <span style={failureBadge}>Fallido</span>
                  </Text>
                  {error && (
                    <>
                      <Text style={errorBoxText}>
                        <strong>Error:</strong>
                      </Text>
                      <Text style={errorText}>{error}</Text>
                    </>
                  )}
                </div>

                <Text style={text}>
                  Por favor, revisa los logs del sistema para obtener más
                  detalles sobre el error y toma las acciones necesarias.
                </Text>
              </>
            )}
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Sistema de Gestión de Empleados y Reservas (EMB)
            <br />
            Este es un mensaje automático, por favor no respondas a este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BackupNotification;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
};

const section = {
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
};

const box = {
  border: "1px solid #e8e8e8",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  backgroundColor: "#f9f9f9",
};

const boxText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const errorBox = {
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  backgroundColor: "#fef2f2",
};

const errorBoxText = {
  color: "#991b1b",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const errorText = {
  color: "#991b1b",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  padding: "12px",
  backgroundColor: "#fee2e2",
  borderRadius: "4px",
  fontFamily: "monospace",
};

const successBadge = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "bold",
  backgroundColor: "#d1fae5",
  color: "#065f46",
};

const failureBadge = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "bold",
  backgroundColor: "#fecaca",
  color: "#991b1b",
};

const hr = {
  border: "none",
  borderTop: "1px solid #eaeaea",
  margin: "48px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 40px",
};
