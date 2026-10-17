import { request } from "./client";
import type { AuthResult, Enrollment, Me, SignupRequest } from "./types";

export const authApi = {
  signup: (body: SignupRequest) =>
    request<AuthResult>("/api/v1/auth/signup", { method: "POST", body: JSON.stringify(body) }, false),
  login: (email: string, password: string, organizationId?: string) =>
    request<AuthResult>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password, organizationId }) },
      false,
    ),
  verifyMfa: (mfaToken: string, code: string) =>
    request<AuthResult>("/api/v1/auth/mfa/verify", { method: "POST", body: JSON.stringify({ mfaToken, code }) }, false),
  forgotPassword: async (email: string) => {
    await request<void>("/api/v1/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }, false);
  },
  resetPassword: async (token: string, newPassword: string) => {
    await request<void>(
      "/api/v1/auth/password/reset",
      { method: "POST", body: JSON.stringify({ token, newPassword }) },
      false,
    );
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await request<void>("/api/v1/auth/password/change", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  me: () => request<Me>("/api/v1/auth/me"),
  mfaEnroll: () => request<Enrollment>("/api/v1/auth/mfa/enroll", { method: "POST" }),
  mfaConfirm: (code: string) =>
    request<AuthResult>("/api/v1/auth/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) }),
};
