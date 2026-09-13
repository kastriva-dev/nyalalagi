"use client";
import { useRef } from "react";
import { useInView } from "framer-motion";
import CountUp from "react-countup";

const statsData = [
  {
    endCountNum: 99,
    endCountText: "%",
    text: "Client Satisfaction",
  },
  {
    endCountNum: 800,
    endCountText: "+",
    text: "Successful Projects",
  },
  {
    endCountNum: 32,
    endCountText: "k",
    text: "Happy Clients",
  },
  {
    endCountNum: 26,
    endCountText: "+",
    text: "Years Experience",
  },
];

const Stats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-12 bg-gray-100">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold mb-2">
                {isInView ? (
                  <CountUp
                    start={0}
                    end={stat.endCountNum}
                    duration={3}
                    delay={0.5}
                  />
                ) : (
                  '0'
                )}
                {stat.endCountText}
              </div>
              <p className="text-gray-600">{stat.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;