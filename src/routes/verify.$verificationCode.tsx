import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CertificateVerify";

export const Route = createFileRoute("/verify/$verificationCode")({ component: Page });
