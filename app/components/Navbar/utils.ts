export const formatLink = (text: string): string => {
  if (typeof text !== "string") return "/";

  const cleaned = text
    .replace(/[<>\"'`]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return cleaned ? `/${cleaned}` : "/";
};
