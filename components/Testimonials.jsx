import Image from "next/image";
import Button from "./Button";
import Pretitle from "./Pretitle";
import Slider from "./Slider";

import { motion } from "framer-motion";
import { fadeIn } from "@/variants";

const testimonials = [
  {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    name: "John Doe",
    position: "CEO, Company",
    img: "/assets/img/testimonials/avatar.jpg",
  },
  {
    text: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    name: "Jane Smith",
    position: "Designer, Agency",
    img: "/assets/img/testimonials/avatar.jpg",
  },
  {
    text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    name: "Mike Johnson",
    position: "Developer, Studio",
    img: "/assets/img/testimonials/avatar.jpg",
  },
];

const Testimonials = () => {
  return (
    <section className="pt-16 xl:pt-32">
      <div className="container mx-auto">
        <div className="flex flex-col xl:flex-row relative">
          {/* text */}
          <motion.div
            variants={fadeIn("right", 0.2)}
            initial="hidden"
            whileInView={"show"}
            viewport={{ once: false, amount: 0.2 }}
            className="w-full xl:w-[45%]"
          >
            <Pretitle text="Testimonials" />
            <h2 className="h2 mb-12">What Our Clients Say</h2>
          </motion.div>
          {/* slider */}
          <motion.div
            variants={fadeIn("left", 0.4)}
            initial="hidden"
            whileInView={"show"}
            viewport={{ once: false, amount: 0.2 }}
            className="w-full xl:w-[55%]"
          >
            <Slider>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="py-8 px-12">
                  <Image
                    src="/assets/img/testimonials/quote.svg"
                    width={40}
                    height={40}
                    alt="quote"
                    className="mb-6"
                  />
                  <p className="text-lg italic mb-8">{testimonial.text}</p>
                  <div className="flex items-center">
                    <Image
                      src={testimonial.img}
                      width={60}
                      height={60}
                      alt={testimonial.name}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-bold">{testimonial.name}</h4>
                      <p>{testimonial.position}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;