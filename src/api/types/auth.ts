export type Role = "FOUNDER" | "CORPORATE_SECRETARY" | "BOARD_MEMBER" | "SHAREHOLDER" | "LEGAL_AUDITOR";
export type Jurisdiction = "MAINLAND_UAE" | "ADGM" | "DIFC" | "KSA";

export interface AuthResult {
  status: "OK" | "MFA_REQUIRED" | "ORG_SELECTION_REQUIRED";
  accessToken: string | null;
  refreshToken?: string | null;
  mfaToken: string | null;
  mfaEnrollmentRequired: boolean;
  organizationId: string | null;
  role: Role | null;
  displayName: string | null;
  organizations: { id: string; name: string; role: Role }[] | null;
}

export interface Enrollment {
  secret: string;
  otpauthUri: string;
}

export interface Me {
  email: string;
  organizationId: string;
  role: Role;
  mfaVerified: boolean;
  shareholderId: string | null;
}

export interface Member {
  email: string;
  displayName: string;
  role: Role;
  shareholderId: string | null;
  shareholderName: string | null;
}

export interface InviteResult {
  email: string;
  role: Role;
  temporaryPassword: string | null;
}

export interface NewCompany {
  legalNameEn: string;
  legalNameAr?: string;
  jurisdiction: Jurisdiction;
  commercialLicenseNo: string;
  baseCurrency: string;
  certificatePrefix: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  organization: {
    legalNameEn: string;
    legalNameAr?: string;
    jurisdiction: Jurisdiction;
    commercialLicenseNo: string;
    baseCurrency: string;
    certificatePrefix: string;
  };
}
