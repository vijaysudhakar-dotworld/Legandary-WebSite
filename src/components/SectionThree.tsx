import React from "react";

const SectionThree: React.FC = () => {

  return (
    <section
      id="section-three"
      className="relative bg-fade md:bg-transparent min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center snap-section py-10 md:py-0"
    >
      {/* 1. Center Heading - Responsive sizing and positioning */}
      <div className="relative z-0 mb-6 md:mb-0 md:absolute md:top-[15%] left-0 right-0 text-center px-4">
        <h2 className="font-montserrat text-primary text-5xl lg:text-7xl xl:text-9xl font-extrabold tracking-tight">
          INNOVATIVE SPACE
        </h2>
      </div>

      {/* 2. Content wrapper for text boxes */}
      <div className="relative md:absolute inset-0 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center px-4 md:px-8">
        
        {/* Left card - Stack on mobile, positioned on desktop */}
        <div 
          className="w-full md:w-1/3 mb-6 md:mb-0 md:absolute md:bottom-[10%] md:left-0"
          style={{ maxWidth: '400px' }}
        >
          <div className="backdrop-blur-sm bg-white/40 border border-white/50 shadow-xl rounded-2xl p-5 md:p-6">
            <p className="text-gray-700 font-semibold text-sm md:text-base leading-relaxed">
              With smart construction and careful planning, we create
              innovative spaces that enhance comfort and efficiency. Every
              project is built to adapt, evolve, and stand out with lasting
              quality.
            </p>
          </div>
        </div>

        {/* Spacer div for mobile layout - keeps cards separated */}
        <div className="md:hidden h-4"></div>

        {/* Right card - Stack on mobile, positioned on desktop */}
        <div 
          className="w-full md:w-1/3 md:absolute md:bottom-[30%] md:right-0"
          style={{ maxWidth: '400px' }}
        >
          <div className="backdrop-blur-sm bg-white/40 border border-white/50 shadow-xl rounded-2xl p-5 md:p-6">
            <p className="text-gray-700 font-semibold text-sm md:text-base leading-relaxed">
              At Legendary Builders, we create spaces that inspire. Through
              smart design and thoughtful engineering, we build modern,
              functional environments where every element has purpose and
              harmony.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionThree;