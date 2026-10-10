/**
 * Avatar utilities for club members
 */

export const AVATAR_PRESETS = [
  { id: "adventurer", label: "Nhân vật thể thao (Adventurer)" },
  { id: "lorelei", label: "Phong cách Anime/Manga (Lorelei)" },
  { id: "micah", label: "Hình hoạ tối giản (Micah)" },
  { id: "notionists", label: "Phong cách Notion (Notionists)" },
  { id: "bottts", label: "Robot dễ thương (Bottts)" },
];

/**
 * Returns a high-res deterministic avatar URL for a member.
 * If member.avatar_url is present, it will be returned.
 * Otherwise, generates a customized Dicebear avatar based on name and gender.
 */
export function getMemberAvatarUrl(member: {
  name: string;
  gender?: "male" | "female";
  avatar_url?: string;
}): string {
  if (member.avatar_url && member.avatar_url.trim()) {
    return member.avatar_url.trim();
  }

  const cleanSeed = encodeURIComponent(member.name.trim().toLowerCase());
  
  // Soft, harmonious background colors based on gender
  const bgColors =
    member.gender === "female"
      ? "ffd5dc,ffdfbf,fce7f3,ede9fe"
      : "b6e3f4,c0aede,d1d4f9,dcfce7";

  return `https://api.dicebear.com/7.x/adventurer/png?seed=${cleanSeed}&backgroundColor=${bgColors}`;
}
