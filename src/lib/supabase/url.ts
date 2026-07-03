/**
 * The Supabase dashboard shows the API URL with a `/rest/v1/` suffix in
 * some places; the client needs the bare project URL. Normalize so a
 * copy-paste of either form works.
 */
export function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/(rest|auth|realtime|storage)\/v1\/?$/, "")
    .replace(/\/+$/, "");
}
