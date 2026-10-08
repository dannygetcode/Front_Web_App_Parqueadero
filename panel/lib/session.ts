/** Nombre de la cookie httpOnly con el JWT del admin (nunca se lee desde el navegador). */
export const SESSION_COOKIE = "cupo_session";

/** Caducidad por defecto: igual a la del token del backend (4 h). */
export const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
