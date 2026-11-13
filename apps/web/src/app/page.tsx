import { HomeContent, type HomeAnnouncement } from "@/components/home-content";

async function getAnnouncements(): Promise<HomeAnnouncement[]> {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:4000";
    const res = await fetch(`${apiUrl}/announcements`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.announcements ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const announcements = await getAnnouncements();

  return <HomeContent announcements={announcements} />;
}
