// page.tsx
import React from 'react';
import Hero from "../components/hero"
import Services from '@/components/services';
import AboutLink from '@/components/about-link';


export default function Page() {
  return (
    <main>
      <Hero />
      <Services />
      <AboutLink />
    </main>
  );
}