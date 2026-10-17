import { downloadFile, org, request } from "./client";
import type { Certificate, CertificateVerification, IssueCertificateRequest } from "./types";

export const certificatesApi = {
  certificates: (orgId: string) => request<Certificate[]>(`${org(orgId)}/certificates`),
  certificatePdf: (orgId: string, certNo: string) =>
    downloadFile(`${org(orgId)}/certificates/${encodeURIComponent(certNo)}/pdf`, `${certNo}.pdf`),
  issueCertificate: (orgId: string, body: IssueCertificateRequest) =>
    request<Certificate>(`${org(orgId)}/certificates`, { method: "POST", body: JSON.stringify(body) }),
  verifyCertificate: (certNo: string, hash?: string) =>
    request<CertificateVerification>(
      `/api/v1/certificates/${encodeURIComponent(certNo)}/verify${hash ? `?h=${encodeURIComponent(hash)}` : ""}`,
      {},
      false,
    ),
};
