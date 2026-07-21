import type { Metadata } from "next";
import HomeSearch from "./HomeSearch";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-text">
          Find veterinary clinical trials
        </h1>
        <p className="mt-2 text-muted max-w-3xl">
          Search recruiting studies for dogs, cats, horses, and other animals
          across more than 30 veterinary schools and research institutions.
        </p>
      </section>
      <HomeSearch />
    </>
  );
}
