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
    bio: "Full‑stack architect with 12 years of experience turning ambitious ideas into production‑ready products.\n\nKatlego has led engineering teams across a wide range of industries, consistently delivering scalable, high‑quality solutions from concept to launch. His hands‑on approach and deep technical expertise ensure that every project is built on a solid foundation of modern best practices.",
    image: "/katlego.jpg",
  },
  {
    slug: "masego-dipela",
    name: "Masego Dipela",
    role: "Senior Designer",
    bio: "Design‑system thinker who obsesses over typography, spacing, and user delight in every interaction.\n\nMasego brings a meticulous eye for detail and a deep understanding of how design decisions impact user experience. From building cohesive design systems to crafting pixel‑perfect interfaces, she ensures that every visual element serves both form and function.",
    image: "/masego.jpg",
  },
  {
    slug: "pierre-van-zyl",
    name: "Pierre van Zyl",
    role: "Senior Software Developer | Backend & Systems Engineer | FinTech, Trading Platforms, Financial Integrations | Computer Science Graduate",
    bio: "Pierre van Zyl is a senior software developer with over six years of experience building backend systems, financial platforms, and business integrations. His work focuses on designing reliable systems that handle complex business logic, financial transactions, and high-integrity data workflows.\n\nHe has extensive experience working on trading platforms, financial integrations, and enterprise software, including order matching systems, financial transaction processing, API integrations, and accounting platform integrations such as Sage.\n\nAlongside his professional work, he continues to expand his expertise through formal computer science studies focused on networking, databases, and distributed systems, strengthening his practical experience with strong theoretical foundations.\n\nHis core strengths include backend development, financial systems, API design, database modeling, systems architecture, debugging distributed behavior, and automated testing for system reliability.",
    image: "/pierre.jpg",
  },
  {
    slug: "emmanuel-ayisi",
    name: "Emmanuel Ayisi",
    role: "Chief of Staff | C.O.S.",
    bio: "Emmanuel Ayisi is a Geoinformatician and geospatial technology professional with a strong interdisciplinary foundation spanning geospatial science, business intelligence, information systems, and sustainable development. He is recognised for applying data-driven spatial insight to complex real-world challenges, with a particular interest in distributed ledger technologies, data urbanism, and the strategic use of information to support better decision-making across business and society.\n\nHe currently serves at ENERTRAG South Africa in Cape Town, where he was promoted from Junior GIS Analyst to Geoinformatician. In this role, he has contributed to pre-feasibility site assessments across South Africa, combining digital elevation models, land-use data, resource mapping, and environmental constraint analysis to identify technically and environmentally suitable development areas.\n\nHe has also supported major regional initiatives, including the Hyphen project in Namibia, through GIS database development, feasibility support, spatial analysis, and the delivery of high-quality geospatial datasets and visual outputs for bids, tenders, and project planning. His work further includes LiDAR point-cloud processing, enterprise GIS development, systems integration, data governance, and the translation of technical geospatial insight into commercial and strategic decision-making.\n\nEarlier in his career, Emmanuel built a diverse professional foundation across operations, education, research, and civic development. He served as a Remote Junior Operations Assistant at Aqua Salveo For Life Africa, where he supported executive processes, coordinated product and business registrations across multiple African countries, and helped shape the organisation’s vision and operational systems.\n\nAs a Part-Time Lecturer at MGM Designers and Projects College, he taught Engineering Mathematics and achieved a 100% student pass rate in the August 2021 national exam session, while also contributing to policy development and institutional accreditation efforts. He also worked with Our Future Cities NPO, where he supported South Africa’s first Urban Festival focused on inclusivity, accessibility, and digital innovation, co-authored thought leadership on post-COVID city leadership, and facilitated stakeholder engagement around more equitable urban futures.\n\nEmmanuel holds a Bachelor of Science in Geomatics from the University of Cape Town, where he completed an honours thesis on residential land value modelling using geospatial techniques for the City of Cape Town, achieving a mark of 73%. His academic and professional development has been further strengthened by short courses in Power BI, Geo Apps, Project Management Foundations, and Regression Analysis Using ArcGIS.\n\nHis technical toolkit includes ArcGIS, QGIS, Excel, ENVI, AutoCAD, cloud GIS platforms, web mapping, APIs, database management, and spatial data analysis.\n\nBeyond his formal roles, Emmanuel has consistently demonstrated a commitment to leadership, mentorship, and community contribution. His involvement in academic mentorship, student leadership, health and safety representation, and social impact initiatives reflects a professional approach grounded not only in technical excellence, but also in service, collaboration, and long-term development. His broader interests in African literature, education, outdoor activity, business intelligence, and emerging technologies continue to shape a career defined by curiosity, adaptability, and meaningful impact.",
    image: "/emmanuel.jpg",
  },
  {
    slug: "benjamin-taylor",
    name: "Benjamin Taylor",
    role: "Software Developer",
    bio: "Benjamin Taylor is a software developer with a growing focus on web development and a strong interest in building clean, maintainable, and user-friendly applications. He is dedicated to expanding his technical skills across both front-end and full-stack development, with a particular emphasis on learning, adaptability, and thoughtful problem-solving.\n\nIn addition to his work in software, Benjamin brings a creative perspective shaped by his background in photography and music education. These experiences have strengthened his attention to detail, communication skills, and ability to approach challenges with both structure and creativity.\n\nHis combination of technical curiosity and creative discipline supports his development as a well-rounded contributor in the tech industry.",
    image: "/benjamin.jpg",
  },
  {
    slug: "kokie-molepo",
    name: "Kokeletso Molepo",
    role: "Software Developer",
    bio: "Kokeletso Molepo is a software developer with a strong drive for continuous growth and self-improvement. As a disciplined and goal-oriented individual, Kokeletso takes pride in consistency, commitment, and the ability to follow through on objectives with focus and determination.\n\nWith a passion for problem-solving and skill development, Kokeletso has built a solid foundation in web and programming technologies, including HTML, CSS, JavaScript, Python, and C. This technical background is further supported by certifications in Responsive Web Design and JavaScript Algorithms and Data Structures, reflecting both capability and dedication to mastering core development principles.\n\nKokeletso approaches challenges with curiosity and a structured mindset, steadily building expertise and striving to contribute meaningfully within the software development field.",
    image: "/kokie.jpg",
  },
  {
    slug: "eric-russell",
    name: "Eric Russell",
    role: "Software Developer",
    bio: "Eric Russell is a software developer who values careful planning, attention to detail, and well-defined guidelines in his work. He has a strong passion for computer hardware, with solid knowledge of specifications, system functionality, and the assembly process, and enjoys understanding how components interact within a system.\n\nHe has a foundational background in Python programming, supporting his analytical thinking and problem-solving abilities. Eric has completed the learning material for the CompTIA A+ Core 1 certification and is currently preparing to sit for the exam, demonstrating his commitment to building a strong technical foundation.\n\nKnown for being dependable, curious, and disciplined in his approach, Eric is committed to continuous learning and actively seeks opportunities to grow within the IT field. He aims to build a career in technology where he can apply his knowledge, gain hands-on experience, and develop into a skilled and well-rounded professional.",
    image: "/eric.jpg",
  },
];
