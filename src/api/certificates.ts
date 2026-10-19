import { downloadFile, org, request } from "./client";
import type { Certificate, CertificateVerification, IssueCertificateRequest, PendingChange } from "./types";

export const certificatesApi = {
  certificates: (orgId: string) => request<Certificate[]>(`${org(orgId)}/certificates`),
  certificatePdf: (orgId: string, certNo: string) =>
    downloadFile(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/pdf`, `${certNo}.pdf`),
  minutesPdf: (orgId: string, resolutionId: string) =>
    downloadFile(`${org(orgId)}/documents/minutes/${resolutionId}`, "minutes.pdf"),
  transferFormPdf: (orgId: string, certificateNo: string) =>
    downloadFile(
      `${org(orgId)}/documents/transfer-form/${encodeURIComponent(certificateNo)}`,
      `transfer-${certificateNo}.pdf`,
    ),
  optionStatementPdf: (orgId: string, shareholderId: string, asOf?: string) =>
    downloadFile(
      `${org(orgId)}/documents/option-statement/${shareholderId}${asOf ? `?asOf=${encodeURIComponent(asOf)}` : ""}`,
      "options.pdf",
    ),
  statementPdf: (orgId: string, shareholderId: string, asOf?: string) =>
    downloadFile(
      `${org(orgId)}/documents/statement/${shareholderId}${asOf ? `?asOf=${encodeURIComponent(asOf)}` : ""}`,
      "statement.pdf",
    ),
  issueCertificate: (orgId: string, body: IssueCertificateRequest) =>
    request<Certificate | PendingChange>(`${org(orgId)}/certificates`, { method: "POST", body: JSON.stringify(body) }),
  verifyCertificate: (certNo: string, hash?: string) =>
    request<CertificateVerification>(
      `/api/v1/certificates/${encodeURIComponent(certNo)}/verify${hash ? `?h=${encodeURIComponent(hash)}` : ""}`,
      {},
      false,
    ),
};
