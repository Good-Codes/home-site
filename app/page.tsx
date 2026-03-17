// page.tsx
import React from 'react';
import Hero from "../components/hero"
import About from '../components/about';
import Footer from '../components/footer';


export default function Page() {
  return (
    <main>
      <Hero />
      <About />
      <Footer />
    </main>
  );
}