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
 * Mapping of club members who have dedicated profile pictures in /profile_pic/
 */
export const MEMBER_PROFILE_PICS: Record<
  string,
  { url: string; objectPosition?: string }
> = {
  // Đạt 99 (Times square night portrait)
  "mem-dat-99": { url: "/profile_pic/dat99.jpg", objectPosition: "center 75%" },
  "dat 99": { url: "/profile_pic/dat99.jpg", objectPosition: "center 75%" },
  "đạt 99": { url: "/profile_pic/dat99.jpg", objectPosition: "center 75%" },
  "dat99": { url: "/profile_pic/dat99.jpg", objectPosition: "center 75%" },

  // Hà Linh (Sunny street portrait)
  "mem-ha-linh": { url: "/profile_pic/halinh.jpg", objectPosition: "center 45%" },
  "ha linh": { url: "/profile_pic/halinh.jpg", objectPosition: "center 45%" },
  "hà linh": { url: "/profile_pic/halinh.jpg", objectPosition: "center 45%" },
  "halinh": { url: "/profile_pic/halinh.jpg", objectPosition: "center 45%" },

  // Meo (Watermelon hat portrait)
  "mem-meo": { url: "/profile_pic/meo.jpg", objectPosition: "center 25%" },
  "meo": { url: "/profile_pic/meo.jpg", objectPosition: "center 25%" },

  // Thảo Linh / tlinh (Evening dress portrait)
  "mem-thao-linh": { url: "/profile_pic/thaolinh.jpg", objectPosition: "center 25%" },
  "thao linh": { url: "/profile_pic/thaolinh.jpg", objectPosition: "center 25%" },
  "thảo linh": { url: "/profile_pic/thaolinh.jpg", objectPosition: "center 25%" },
  "tlinh": { url: "/profile_pic/thaolinh.jpg", objectPosition: "center 25%" },
  "thaolinh": { url: "/profile_pic/thaolinh.jpg", objectPosition: "center 25%" },

  // Trần (Black leather jacket portrait)
  "mem-tran": { url: "/profile_pic/tran.jpg", objectPosition: "center 28%" },
  "tran": { url: "/profile_pic/tran.jpg", objectPosition: "center 28%" },
  "trần": { url: "/profile_pic/tran.jpg", objectPosition: "center 28%" },

  // Xuân Anh (Graduation portrait)
  "mem-xuan-anh": { url: "/profile_pic/xuananh.jpg", objectPosition: "35% 25%" },
  "xuan anh": { url: "/profile_pic/xuananh.jpg", objectPosition: "35% 25%" },
  "xuân anh": { url: "/profile_pic/xuananh.jpg", objectPosition: "35% 25%" },
  "xuananh": { url: "/profile_pic/xuananh.jpg", objectPosition: "35% 25%" },
};

/**
 * Returns a high-res deterministic avatar URL for a member.
 * If member.avatar_url is present, it will be returned.
 * If a custom profile picture exists in MEMBER_PROFILE_PICS, it will be returned.
 * Otherwise, generates a customized Dicebear adventurer avatar based on name and gender.
 */
export function getMemberAvatarUrl(member: {
  id?: string;
  name: string;
  gender?: "male" | "female";
  avatar_url?: string;
}): string {
  if (member.avatar_url && member.avatar_url.trim()) {
    return member.avatar_url.trim();
  }

  // Check known profile pictures by member id
  if (member.id && MEMBER_PROFILE_PICS[member.id.toLowerCase()]) {
    return MEMBER_PROFILE_PICS[member.id.toLowerCase()].url;
  }

  // Check known profile pictures by member name
  const cleanName = member.name.trim().toLowerCase();
  if (MEMBER_PROFILE_PICS[cleanName]) {
    return MEMBER_PROFILE_PICS[cleanName].url;
  }

  const cleanSeed = encodeURIComponent(cleanName);

  // Soft, harmonious background colors based on gender
  const bgColors =
    member.gender === "female"
      ? "ffd5dc,ffdfbf,fce7f3,ede9fe"
      : "b6e3f4,c0aede,d1d4f9,dcfce7";

  return `https://api.dicebear.com/7.x/adventurer/png?seed=${cleanSeed}&backgroundColor=${bgColors}`;
}

/**
 * Returns the optimal CSS objectPosition for the member's profile picture if defined.
 */
export function getMemberAvatarPosition(member: {
  id?: string;
  name: string;
}): string | undefined {
  if (member.id && MEMBER_PROFILE_PICS[member.id.toLowerCase()]) {
    return MEMBER_PROFILE_PICS[member.id.toLowerCase()].objectPosition;
  }
  const cleanName = member.name.trim().toLowerCase();
  return MEMBER_PROFILE_PICS[cleanName]?.objectPosition;
}
