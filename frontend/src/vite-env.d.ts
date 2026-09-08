/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public base URL of the backend API (public config only — never secrets). */
  readonly VITE_API_URL?: string;
  /**
   * Public WhatsApp support number in international format without "+".
   * Optional — the WhatsApp CTA renders a "coming soon" state when unset.
   */
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
