"use client";

import { Link as ScrollLink } from "react-scroll";
import { RiArrowRightUpLine } from "react-icons/ri";

// components
import Logo from "./Logo";
import NavMobile from "./NavMobile";

const links = [
  {
    name: "home",
    path: "home",
  },
  {
    name: "about",
    path: "about",
  },
  {
    name: "services",
    path: "services",
  },
  {
    name: "projects",
    path: "projects",
  },
  {
    name: "contact",
    path: "contact",
  },
];

const Header = () => {
  return (
    <header className="py-8">
      <div className="container mx-auto flex items-center justify-between">
        <Logo />
        <div className="hidden lg:flex items-center gap-x-10">
          {links.map((link, index) => (
            <ScrollLink
              key={index}
              to={link.path}
              smooth={true}
              duration={500}
              offset={-70}
              className="cursor-pointer hover:text-primary transition"
            >
              {link.name}
            </ScrollLink>
          ))}
          <a
            href="#"
            className="flex items-center gap-x-2 bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-hover transition"
          >
            Get in touch <RiArrowRightUpLine />
          </a>
        </div>
        <div className="lg:hidden">
          <NavMobile />
        </div>
      </div>
    </header>
  );
};

export default Header;