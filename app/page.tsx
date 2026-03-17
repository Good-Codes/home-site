// page.tsx
import React from 'react';
import Hero from "../components/hero"
import About from '../components/about';


export default function Page() {
  return (
    <main>
      <Hero />
      <About />
    </main>
  );
}