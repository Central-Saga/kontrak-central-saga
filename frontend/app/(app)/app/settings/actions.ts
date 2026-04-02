"use server";

import { redirect } from "next/navigation";

import { getFirstAuthValidationMessage, isAuthError } from "@/lib/auth/errors";
import { buildSessionExpiredRedirectPath } from "@/lib/auth/navigation";
import { updateCurrentUserPassword, updateCurrentUserProfile, uploadCurrentUserAvatar } from "@/lib/auth/backend";
import { getSessionToken } from "@/lib/auth/session";

const allowedImageTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

function appendMessage(path: string, type: "error" | "status", value: string) {
  const searchParams = new URLSearchParams();
  searchParams.set(type, value);
  return `${path}?${searchParams.toString()}`;
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNullableString(formData: FormData, key: string) {
  const value = readString(formData, key);

  return value ? value : null;
}

function translateAuthValidationMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase();

  if (normalizedMessage.includes("username") && normalizedMessage.includes("taken")) {
    return "Username sudah digunakan akun lain.";
  }

  if (normalizedMessage.includes("email") && normalizedMessage.includes("taken")) {
    return "Email sudah digunakan akun lain.";
  }

  if (normalizedMessage.includes("valid email")) {
    return "Gunakan alamat email yang valid.";
  }

  if (normalizedMessage.includes("name") && normalizedMessage.includes("required")) {
    return "Nama akun wajib diisi.";
  }

  if (normalizedMessage.includes("email") && normalizedMessage.includes("required")) {
    return "Email akun wajib diisi.";
  }

  if (normalizedMessage.includes("username") && normalizedMessage.includes("required")) {
    return "Username wajib diisi.";
  }

  if (normalizedMessage.includes("current password") && normalizedMessage.includes("incorrect")) {
    return "Password saat ini tidak sesuai.";
  }

  if (normalizedMessage.includes("password is incorrect")) {
    return "Password saat ini tidak sesuai.";
  }

  if (normalizedMessage.includes("provided password") && normalizedMessage.includes("incorrect")) {
    return "Password saat ini tidak sesuai.";
  }

  if (normalizedMessage.includes("current password") && normalizedMessage.includes("required")) {
    return "Masukkan password saat ini terlebih dahulu.";
  }

  if (normalizedMessage.includes("password confirmation") && normalizedMessage.includes("required")) {
    return "Konfirmasi password baru wajib diisi.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("confirmation")) {
    return "Konfirmasi password baru belum cocok.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("required")) {
    return "Password baru wajib diisi.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("least 8 characters")) {
    return "Password baru minimal delapan karakter.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("letters")) {
    return "Password baru harus mengandung huruf.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("mixed case")) {
    return "Password baru harus memakai kombinasi huruf besar dan huruf kecil.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("numbers")) {
    return "Password baru harus mengandung angka.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("symbols")) {
    return "Password baru harus mengandung simbol.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("different")) {
    return "Password baru tidak boleh sama dengan password saat ini.";
  }

  return message;
}

function getAuthActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
  notFoundMessage?: string,
) {
  if (isAuthError(error) && error.code === "unauthorized") {
    return buildSessionExpiredRedirectPath();
  }

  if (isAuthError(error) && error.status === 404 && notFoundMessage) {
    return notFoundMessage;
  }

  if (isAuthError(error) && error.status === 422) {
    return translateAuthValidationMessage(getFirstAuthValidationMessage(error));
  }

  if (isAuthError(error)) {
    return translateAuthValidationMessage(error.message);
  }

  return fallbackMessage;
}

async function readRequiredSessionToken() {
  const token = await getSessionToken();

  if (!token) {
    redirect(buildSessionExpiredRedirectPath());
  }

  return token;
}

export async function updateAccountProfileAction(redirectPath: string, formData: FormData) {
  let nextPath = appendMessage(redirectPath, "status", "profile_updated");
  const name = readString(formData, "name");
  const email = readString(formData, "email");
  const username = readNullableString(formData, "username");

  if (!name) {
    nextPath = appendMessage(redirectPath, "error", "Nama akun wajib diisi.");
    redirect(nextPath);
  }

  if (!email) {
    nextPath = appendMessage(redirectPath, "error", "Email akun wajib diisi.");
    redirect(nextPath);
  }

  const token = await readRequiredSessionToken();

  try {
    await updateCurrentUserProfile(token, {
      email,
      name,
      username,
    });
  } catch (error) {
    const message = getAuthActionErrorMessage(
      error,
      "Profil akun belum berhasil diperbarui. Silakan coba beberapa saat lagi.",
    );

    if (message === buildSessionExpiredRedirectPath()) {
      redirect(message);
    }

    nextPath = appendMessage(redirectPath, "error", message);
  }

  redirect(nextPath);
}

export async function updateAccountPasswordAction(redirectPath: string, formData: FormData) {
  let nextPath = appendMessage(redirectPath, "status", "password_updated");
  const currentPassword = readString(formData, "current_password");
  const password = readString(formData, "password");
  const passwordConfirmation = readString(formData, "password_confirmation");

  if (!currentPassword) {
    nextPath = appendMessage(redirectPath, "error", "Masukkan password saat ini terlebih dahulu.");
    redirect(nextPath);
  }

  if (!password) {
    nextPath = appendMessage(redirectPath, "error", "Password baru wajib diisi.");
    redirect(nextPath);
  }

  if (password.length < 8) {
    nextPath = appendMessage(redirectPath, "error", "Password baru minimal delapan karakter.");
    redirect(nextPath);
  }

  if (!passwordConfirmation) {
    nextPath = appendMessage(redirectPath, "error", "Konfirmasi password baru wajib diisi.");
    redirect(nextPath);
  }

  if (password !== passwordConfirmation) {
    nextPath = appendMessage(redirectPath, "error", "Konfirmasi password baru belum cocok.");
    redirect(nextPath);
  }

  const token = await readRequiredSessionToken();

  try {
    await updateCurrentUserPassword(token, {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    });
  } catch (error) {
    const message = getAuthActionErrorMessage(
      error,
      "Password belum berhasil diperbarui. Silakan coba beberapa saat lagi.",
    );

    if (message === buildSessionExpiredRedirectPath()) {
      redirect(message);
    }

    nextPath = appendMessage(redirectPath, "error", message);
  }

  redirect(nextPath);
}

export async function updateProfilePhotoAction(redirectPath: string, formData: FormData) {
  let nextPath = appendMessage(redirectPath, "status", "avatar_updated");

  const avatar = formData.get("avatar");

  if (!(avatar instanceof File) || avatar.size === 0) {
    nextPath = appendMessage(redirectPath, "error", "Pilih file foto profil terlebih dahulu.");
    redirect(nextPath);
  }

  if (!allowedImageTypes.has(avatar.type)) {
    nextPath = appendMessage(redirectPath, "error", "Gunakan berkas gambar JPG, PNG, WEBP, atau GIF.");
    redirect(nextPath);
  }

  const token = await readRequiredSessionToken();

  try {
    await uploadCurrentUserAvatar(token, avatar);
  } catch (error) {
    const message = getAuthActionErrorMessage(
      error,
      "Foto profil belum berhasil diperbarui. Silakan coba beberapa saat lagi.",
      "Fitur pembaruan foto profil belum tersedia di server.",
    );

    if (message === buildSessionExpiredRedirectPath()) {
      nextPath = message;
    } else {
      nextPath = appendMessage(redirectPath, "error", message);
    }
  }

  redirect(nextPath);
}
