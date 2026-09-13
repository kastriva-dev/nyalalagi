import { RiChat1Line, RiMapPin2Line, RiSmartphoneLine } from "react-icons/ri";
import Socials from "./Socials";
import Form from "./Form";

import { motion } from "framer-motion";
import { fadeIn } from "@/variants";

const Contact = () => {
  return (
    <section className="pt-16 xl:pt-32" id="contact">
      <motion.div
        variants={fadeIn("up", 0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.2 }}
        className="container mx-auto"
      >
        <div className="flex flex-col xl:flex-row">
          {/* text */}
          <div className="xl:w-[50%] flex flex-col justify-center">
            <div className="flex flex-col">
              <Pretitle text="Contact" />
              <h2 className="h2 max-w-[490px] mb-6">Get in Touch With Us</h2>
              <p className="subtitle max-w-[490px]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            {/* info */}
            <div className="flex flex-col gap-y-4 xl:gap-y-10 mt-6 xl:mt-12">
              <div className="flex items-center gap-x-6">
                <div className="w-[52px] h-[52px] bg-primary text-white rounded-md flex items-center justify-center">
                  <RiMapPin2Line size={24} />
                </div>
                <div>
                  <h4 className="h4 mb-2">Our Location</h4>
                  <p>123 Street, City</p>
                </div>
              </div>
              <div className="flex items-center gap-x-6">
                <div className="w-[52px] h-[52px] bg-primary text-white rounded-md flex items-center justify-center">
                  <RiSmartphoneLine size={24} />
                </div>
                <div>
                  <h4 className="h4 mb-2">Phone Number</h4>
                  <p>+123 456 7890</p>
                </div>
              </div>
              <div className="flex items-center gap-x-6">
                <div className="w-[52px] h-[52px] bg-primary text-white rounded-md flex items-center justify-center">
                  <RiChat1Line size={24} />
                </div>
                <div>
                  <h4 className="h4 mb-2">Email Address</h4>
                  <p>info@urbanbuild.com</p>
                </div>
              </div>
            </div>
            {/* socials */}
            <Socials containerStyles="mt-12" iconStyles="w-9 h-9 border border-primary rounded-full flex justify-center items-center hover:bg-primary hover:text-white transition-all" />
          </div>
          {/* form */}
          <div className="xl:w-[50%]">
            <Form />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Contact;