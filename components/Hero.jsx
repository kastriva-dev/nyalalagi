import Button from "./Button";

import { motion } from "framer-motion";
import { fadeIn } from "@/variants";

const Hero = () => {
  return (
    <section className="h-[70vh] bg-hero bg-no-repeat bg-cover bg-center relative">
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/0 via-black/50 to-black/70 z-10"></div>
      <div className="container mx-auto h-full flex items-center">
        <div className="z-20 text-white text-center xl:text-left">
          <motion.h1
            variants={fadeIn('down', 0.2)}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="h1"
          >
            Building Dreams <br />
            Into Reality
          </motion.h1>
          <motion.p
            variants={fadeIn('down', 0.3)}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="max-w-[540px] mb-8"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </motion.p>
          <motion.div
            variants={fadeIn('down', 0.4)}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            <Button text="Get Started" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;