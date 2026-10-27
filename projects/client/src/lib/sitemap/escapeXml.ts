const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** `text`, safe inside an XML element or attribute. */
export const escapeXml = (text: string): string => text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
