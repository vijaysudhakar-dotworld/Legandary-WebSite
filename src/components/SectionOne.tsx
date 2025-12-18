import React  from "react";


const SectionOne: React.FC = () => {

  const baseButtonClasses =
    "px-8 py-3 rounded-xl font-bold transition-all duration-200 ease-in-out shadow-md hover:shadow-lg hover:scale-[1.03]  cursor-pointer";
  const primaryButtonClasses = `bg-primary text-white border-3 border-gray-800/10  ${baseButtonClasses} hover:bg-primary/90`;
  const secondaryButtonClasses = `bg-white text-primary border-3 border-gray-800/10 ${baseButtonClasses} hover:bg-primary/10 hover:border-primary/90`;

  

  return (
    <section
      id="section-one"
      className="bg-overlay text-center md:text-start md:bg-transparent relative h-screen w-full flex flex-col justify-center px-8 md:px-24 z-10 font-common snap-section"
    >
      <div
        
        className="flex flex-col items-center sm:items-start pointer-events-auto select-none lg:w-[60%] xl:w-[50%] md:mt-5 2xl:mt-10"
      >
        <div className="relative lg:-translate-y-4">
          <h1 className="hero-animate font-stylish text-5xl md:text-7xl 3xl:text-8xl text-primary">
            Legendary Builders
          </h1>

          <p className="hero-animate text-gray-900 lg:text-gray-800 text-xl 3xl:text-2xl my-5">
            Built with precision, designed with purpose. Discover a modern
            living experience shaped around quality, comfort, and smarter
            spaces.
          </p>

          <div className="hero-animate flex flex-col sm:flex-row items-center sm:items-start gap-4 w-[90%] md:w-full mt-8 md:mt-4 max-w-md mx-auto sm:mx-0 mb-5">
            {/* BOOK NOW Button */}
            <button
              className={`w-full text-sm 2xl:text-md ${primaryButtonClasses}`} onClick={() => {
                window.open("https://www.legendary.in/contact-us/", "_blank");
              }}
            >
              BOOK NOW
            </button>

            {/* EXPLORE WEBSITE Button */}
            <button
              className={`w-full text-sm 2xl:text-md ${secondaryButtonClasses}`} onClick={() => {
                window.open("https://www.legendary.in/", "_blank");
              }}
            >
              EXPLORE WEBSITE
            </button>
          </div>
        </div>

        <img
          src="birds.png"
          className="hero-animate absolute bottom-0 opacity-30 w-120 hidden md:block"
          alt=""
        />
      </div>
    </section>
  );
};

export default SectionOne;
