import React, { useRef } from "react";

const SectionTwo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <section
      id="section-two"
      className="relative bg-fade md:bg-transparent h-screen w-screen flex flex-col justify-center items-end px-10 md:px-20 font-common snap-section"
    >
      <div ref={containerRef} className="max-w-xl text-white md:text-primary">
        <img src="birds.png" className=" opacity-30! w-100 2xl:w-150 mb-10 md:mb-5" alt="" />
        <h1 className="font-stylish text-5xl md:text-7xl 2xl:text-8xl text-primary">
          About
        </h1>
        <p className="text-gray-900 lg:text-gray-700  text-xl 2xl:text-2xl my-5">
          Legendary Builders is dedicated to creating structures that combine
          durability, modern design, and uncompromising craftsmanship. With a
          focus on precision and quality, we take every project from concept to
          completion with care and professionalism. Our team blends experience
          with innovation to deliver homes and commercial spaces that truly
          stand out.
        </p>
        <p className="text-gray-900 lg:text-gray-700  text-xl 2xl:text-2xl my-5">
          We believe in building more than just structures—we build trust,
          long-lasting value, and a reputation for excellence that our clients
          can rely on.
        </p>
      </div>
    </section>
  );
};

export default SectionTwo;
