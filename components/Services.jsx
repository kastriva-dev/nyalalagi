"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Button from "./Button";

import {
  PiWallFill,
  PiPaintRollerFill,
  PiWrenchFill,
  PiUserGearFill,
} from "react-icons/pi";
import Pretitle from "./Pretitle";

const serviceData = [
  {
    name: "construction",
    icon: <PiWallFill />,
    title: "Construction Services",
    description: "Your short description",
    img: "/assets/img/services/thumb-1.jpg",
  },
  {
    name: "renovation",
    icon: <PiPaintRollerFill />,
    title: "Renovation Services",
    description: "Your short description",
    img: "/assets/img/services/thumb-2.jpg",
  },
  {
    name: "maintenance",
    icon: <PiWrenchFill />,
    title: "Maintenance Services",
    description: "Your short description",
    img: "/assets/img/services/thumb-3.jpg",
  },
  {
    name: "consulting",
    icon: <PiUserGearFill />,
    title: "Consulting Services",
    description: "Your short description",
    img: "/assets/img/services/thumb-4.jpg",
  },
];

const Services = () => {
  const [activeService, setActiveService] = useState(serviceData[0]);

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <Pretitle text="Our Services" />
        <h2 className="h2 text-center mb-12">What We Offer</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Tabs defaultValue={serviceData[0].name} className="w-full">
              <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {serviceData.map((service, index) => (
                  <TabsTrigger
                    key={index}
                    value={service.name}
                    onClick={() => setActiveService(service)}
                    className="flex flex-col items-center p-4 hover:bg-primary hover:text-white transition"
                  >
                    <span className="text-2xl mb-2">{service.icon}</span>
                    <span className="capitalize">{service.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {serviceData.map((service, index) => (
                <TabsContent key={index} value={service.name}>
                  <div className="flex flex-col lg:flex-row items-center">
                    <div className="lg:w-1/2 mb-8 lg:mb-0">
                      <Image
                        src={service.img}
                        width={600}
                        height={400}
                        alt={service.title}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="lg:w-1/2 lg:pl-12">
                      <h3 className="h3 mb-4">{service.title}</h3>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      <Button text="Learn more" />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
          <div>
            <div className="bg-primary p-8 rounded-lg">
              <h3 className="h3 text-white mb-6">Get a Free Quote</h3>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-3 rounded"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full p-3 rounded"
                />
                <select className="w-full p-3 rounded">
                  {serviceData.map((service, index) => (
                    <option key={index} value={service.name}>
                      {service.title}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Your Message"
                  className="w-full p-3 rounded"
                  rows={4}
                ></textarea>
                <button
                  type="submit"
                  className="bg-white text-primary px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;