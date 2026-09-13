import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";

import Image from "next/image";
import SliderBtns from "./SliderBtns";

const Slider = () => {
  return (
    <Swiper className="bg-white shadow-custom w-full max-w-[630px] h-[200px]">
      {/* slide 1 */}
      <SwiperSlide>
        <div className="px-12 md:pl-[60px] flex items-center gap-9 h-full">
          {/* avatar img */}
          <div className="relative hidden md:block">
            <Image
              src="/assets/img/testimonials/avatar.jpg"
              width={80}
              height={80}
              alt=""
              className="rounded-full"
            />
          </div>
          {/* text */}
          <div>
            <p className="max-w-[420px] italic mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <h4 className="font-bold">John Doe</h4>
            <p>CEO, Company</p>
          </div>
        </div>
      </SwiperSlide>
      {/* slide 2 */}
      <SwiperSlide>
        <div className="px-12 md:pl-[60px] flex items-center gap-9 h-full">
          <div className="relative hidden md:block">
            <Image
              src="/assets/img/testimonials/avatar.jpg"
              width={80}
              height={80}
              alt=""
              className="rounded-full"
            />
          </div>
          <div>
            <p className="max-w-[420px] italic mb-6">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            <h4 className="font-bold">Jane Smith</h4>
            <p>Designer, Agency</p>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  );
};

export default Slider;