// lib/team-data.ts
// Shared team member data — imported by both the team grid and individual bio pages.

export type TeamMember = {
  slug: string;   // URL-friendly identifier, e.g. "katlego-thubisi"
  name: string;
  role: string;
  bio: string;
  image: string;
};

export const team: TeamMember[] = [
  {
    slug: "katlego-thubisi",
    name: "Katlego Thubisi",
    role: "Founder & Lead Engineer",
    bio: "Full‑stack architect with 12 years of experience turning ambitious ideas into production‑ready products.",
    image: "/team/katlego.jpg",
  },
  {
    slug: "masego-dipela",
    name: "Masego Dipela",
    role: "Senior Designer",
    bio: "Design‑system thinker who obsesses over typography, spacing, and user delight in every interaction.",
    image: "/team/masego.jpg",
  },
  {
    slug: "pierre-van-zyl",
    name: "Pierre Van Zyl",
    role: "Frontend Developer",
    bio: "React and Next.js specialist focused on performance, accessibility, and pixel‑perfect interfaces.",
    image: "/team/pierre.jpg",
  },
  {
    slug: "emmanuel-ayisi",
    name: "Emmanuel Ayisi",
    role: "Backend Developer",
    bio: "API guru with a knack for scalable architectures, database optimization, and clean code.",
    image: "/team/emmanuel.jpg",
  },
  {
    slug: "benjamin-taylor",
    name: "Benjamin Taylor",
    role: "Intern",
    bio: "Intern with a passion for learning and a fresh perspective on modern web development trends.",
    image: "/team/benjamin.jpg",
  },
  {
    slug: "kokie-molepo",
    name: "Kokie Molepo",
    role: "Intern",
    bio: "Intern who brings enthusiasm, creativity, and a willingness to dive into new challenges headfirst.",
    image: "/team/kokie.jpg",
  },
  {
    slug: "eric-russell",
    name: "Eric Russell",
    role: "Intern",
    bio: "Intern with a background in design, eager to bridge the gap between aesthetics and functionality in web products.",
    image: "/team/eric.jpg",
  },
  {
    slug: "sophie-chen",
    name: "Sophie Chen",
    role: "Intern",
    bio: "Intern with a strong interest in frontend development, excited to contribute to real projects and grow her skills.",
    image: "/team/sophie.jpg",
  },
];
