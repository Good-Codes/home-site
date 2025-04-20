// page.tsx
import React from 'react';
import Hero from "../components/hero"
import About from '../components/about';
import Services from '../components/services';
import Contact from '../components/contact';

export default function Page() {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      <Contact />
    </main>
  );
}