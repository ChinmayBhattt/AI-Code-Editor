// ─── Editor Types ────────────────────────────────────────────────────────────

export interface EditorTab {
  id: string;
  fileId: string;
  path: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean; // Has unsaved changes
  cursorPosition?: CursorPosition;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface EditorSettings {
  fontSize: number;
  theme: "vs-dark" | "vs-light" | "hc-black";
  minimap: boolean;
  wordWrap: "on" | "off" | "wordWrapColumn";
  lineNumbers: "on" | "off" | "relative";
  tabSize: number;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
  autoClosingBrackets: "always" | "never" | "languageDefined";
  smoothScrolling: boolean;
  cursorBlinking: "blink" | "smooth" | "phase" | "expand" | "solid";
  cursorSmoothCaretAnimation: "on" | "off";
  renderWhitespace: "none" | "all" | "boundary" | "selection" | "trailing";
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  theme: "vs-dark",
  minimap: true,
  wordWrap: "on",
  lineNumbers: "on",
  tabSize: 2,
  formatOnSave: true,
  bracketPairColorization: true,
  autoClosingBrackets: "always",
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  renderWhitespace: "none",
};
