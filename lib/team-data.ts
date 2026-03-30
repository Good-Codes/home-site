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
    image: "/katlego.jpg",
  },
  {
    slug: "masego-dipela",
    name: "Masego Dipela",
    role: "Senior Designer",
    bio: "Design‑system thinker who obsesses over typography, spacing, and user delight in every interaction.",
    image: "/masego.jpg",
  },
  {
    slug: "pierre-van-zyl",
    name: "Pierre van Zyl",
    role: "Senior Software Developer | Backend & Systems Engineer | FinTech, Trading Platforms, Financial Integrations | Computer Science Graduate",
    bio: "Pierre van Zyl is a software developer with over six years of experience building backend systems, financial platforms, and business integrations. His work focuses on designing reliable systems that handle complex business logic, financial transactions, and high-integrity data workflows. He has extensive experience working on trading platforms, financial integrations, and enterprise software, including order matching systems, financial transaction processing, API integrations, and accounting platform integrations such as Sage. Alongside his professional work, he continues to expand his expertise through formal computer science studies focused on networking, databases, and distributed systems, strengthening his practical experience with strong theoretical foundations. His core strengths include backend development, financial systems, API design, database modeling, systems architecture, debugging distributed behavior, and automated testing for system reliability.",
    image: "/pierre.jpg",
  },
  {
    slug: "emmanuel-ayisi",
    name: "Emmanuel Ayisi",
    role: "Backend Developer",
    bio: "API guru with a knack for scalable architectures, database optimization, and clean code.",
    image: "/emmanuel.jpg",
  },
  {
    slug: "benjamin-taylor",
    name: "Benjamin Taylor",
    role: "Intern",
    bio: "Intern with a passion for learning and a fresh perspective on modern web development trends.",
    image: "/benjamin.jpg",
  },
  {
    slug: "kokie-molepo",
    name: "Kokie Molepo",
    role: "Intern",
    bio: "Intern who brings enthusiasm, creativity, and a willingness to dive into new challenges headfirst.",
    image: "/kokie.jpg",
  },
  {
    slug: "eric-russell",
    name: "Eric Russell",
    role: "Intern",
    bio: "I am a motivated software development intern with a strong interest in building efficient and user-focused applications. Currently gaining hands-on experience in a fast-paced development environment, I am developing my skills in coding, problem-solving, and collaboration. I am passionate about learning new technologies and contributing to innovative projects.",
    image: "/eric.jpg",
  },
];
