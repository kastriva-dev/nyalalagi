import Image from "next/image";
import Link from "next/link";
import Pretitle from "./Pretitle";

import { RiArrowRightUpLine, RiCheckboxCircleFill } from "react-icons/ri";

const workData = [
  {
    img: "/assets/img/work/restoration.jpg",
    name: "restoration",
    description: "Your short description",
    href: "",
  },
  {
    img: "/assets/img/work/construction.jpg",
    name: "construction",
    description: "Your short description",
    href: "",
  },
  {
    img: "/assets/img/work/renovation.jpg",
    name: "renovation",
    description: "Your short description",
    href: "",
  },
  {
    img: "/assets/img/work/consulting.jpg",
    name: "consulting",
    description: "Your short description",
    href: "",
  },
];

const Work = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto">
        <Pretitle text="Our Work" />
        <h2 className="h2 text-center mb-12">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {workData.map((work, index) => (
            <div key={index} className="group">
              <div className="relative overflow-hidden rounded-lg mb-4">
                <Image
                  src={work.img}
                  width={400}
                  height={300}
                  alt={work.name}
                  className="transform group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Link
                    href={work.href}
                    className="flex items-center gap-x-2 text-white hover:text-primary transition"
                  >
                    View Project <RiArrowRightUpLine />
                  </Link>
                </div>
              </div>
              <h3 className="h3 mb-2">{work.name}</h3>
              <p className="text-gray-600">{work.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Work;