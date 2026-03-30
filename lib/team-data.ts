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
    bio: "Pierre van Zyl is a senior software developer with over six years of experience building backend systems, financial platforms, and business integrations. His work focuses on designing reliable systems that handle complex business logic, financial transactions, and high-integrity data workflows. He has extensive experience working on trading platforms, financial integrations, and enterprise software, including order matching systems, financial transaction processing, API integrations, and accounting platform integrations such as Sage. Alongside his professional work, he continues to expand his expertise through formal computer science studies focused on networking, databases, and distributed systems, strengthening his practical experience with strong theoretical foundations. His core strengths include backend development, financial systems, API design, database modeling, systems architecture, debugging distributed behavior, and automated testing for system reliability.",
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
    role: "Software Developer",
    bio: "Benjamin Taylor is a software developer with a growing focus on web development and a strong interest in building clean, maintainable, and user-friendly applications. He is dedicated to expanding his technical skills across both front-end and full-stack development, with a particular emphasis on learning, adaptability, and thoughtful problem-solving. In addition to his work in software, Benjamin brings a creative perspective shaped by his background in photography and music education. These experiences have strengthened his attention to detail, communication skills, and ability to approach challenges with both structure and creativity. His combination of technical curiosity and creative discipline supports his development as a well-rounded contributor in the tech industry.",
    image: "/benjamin.jpg",
  },
  {
    slug: "kokie-molepo",
    name: "Kokeletso Molepo",
    role: "Software Developer",
    bio: "Kokeletso Molepo is a software developer with a strong drive for continuous growth and self-improvement. As a disciplined and goal-oriented individual, Kokeletso takes pride in consistency, commitment, and the ability to follow through on objectives with focus and determination. With a passion for problem-solving and skill development, Kokeletso has built a solid foundation in web and programming technologies, including HTML, CSS, JavaScript, Python, and C. This technical background is further supported by certifications in Responsive Web Design and JavaScript Algorithms and Data Structures, reflecting both capability and dedication to mastering core development principles. Kokeletso approaches challenges with curiosity and a structured mindset, steadily building expertise and striving to contribute meaningfully within the software development field.",
    image: "/kokie.jpg",
  },
  {
    slug: "eric-russell",
    name: "Eric Russell",
    role: "Software Developer",
    bio: "Eric Russell is a software developer who values careful planning, attention to detail, and well-defined guidelines in his work. He has a strong passion for computer hardware, with solid knowledge of specifications, system functionality, and the assembly process, and enjoys understanding how components interact within a system. He has a foundational background in Python programming, supporting his analytical thinking and problem-solving abilities. Eric has completed the learning material for the CompTIA A+ Core 1 certification and is currently preparing to sit for the exam, demonstrating his commitment to building a strong technical foundation. Known for being dependable, curious, and disciplined in his approach, Eric is committed to continuous learning and actively seeks opportunities to grow within the IT field. He aims to build a career in technology where he can apply his knowledge, gain hands-on experience, and develop into a skilled and well-rounded professional.",
    image: "/eric.jpg",
  },
];
