import Image from "next/image";
import Link from "next/link";

import {
  RiMapPin2Fill,
  RiPhoneFill,
  RiMailFill,
  RiArrowRightLine,
} from "react-icons/ri";

import Socials from "./Socials";

import { motion } from "framer-motion";
import { fadeIn } from "@/variants";

const Footer = () => {
  return (
    <motion.footer
      variants={fadeIn("up", 0.1)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.1 }}
      className="pt-24 bg-neutral-900 text-white"
    >
      <div className="container mx-auto">
        <div className="flex flex-col xl:flex-row text-center xl:text-left gap-y-12">
          <div className="w-[45%] mx-auto flex flex-col items-center xl:items-start">
            <Link href="#">
              <Image
                src="/assets/logo.svg"
                width={200}
                height={50}
                alt=""
              />
            </Link>
            <p className="max-w-sm mb-8">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <Socials />
          </div>
          <div className="xl:ml-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-10 xl:gap-x-20">
              <div>
                <h3 className="h3 text-white mb-4">Services</h3>
                <ul className="flex flex-col gap-y-4">
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Construction
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Renovation
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Architecture
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Interior Design
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="h3 text-white mb-4">Contact</h3>
                <ul className="flex flex-col gap-y-4">
                  <li className="flex items-center gap-x-2">
                    <RiMapPin2Fill />
                    <span>123 Street, City</span>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <RiPhoneFill />
                    <span>+123 456 7890</span>
                  </li>
                  <li className="flex items-center gap-x-2">
                    <RiMailFill />
                    <span>info@urbanbuild.com</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="h3 text-white mb-4">About</h3>
                <ul className="flex flex-col gap-y-4">
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Our Story
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Mission
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition">
                      Team
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="h3 text-white mb-4">Newsletter</h3>
                <div className="flex flex-col gap-y-4">
                  <p>Subscribe to our newsletter</p>
                  <form className="flex gap-x-2">
                    <input
                      type="text"
                      placeholder="Your email"
                      className="input"
                    />
                    <button type="submit">
                      <RiArrowRightLine />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center pt-12">
          <p>
            &copy; {new Date().getFullYear()} UrbanBuild. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;