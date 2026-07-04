import React, { useEffect, useState } from "react";
import "./Carousel.css";
import img1 from "../../assets/img1.png";
import img2 from "../../assets/img2.png";
import img3 from "../../assets/img3.png";
import img5 from "../../assets/img5.png";

const Carousel = () => {
  const images = [img1, img2, img3, img5];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="carousel-container">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt=""
          className={`carousel-image ${index === current ? "active" : ""}`}
        />
      ))}

      {/* Dots */}
      <div className="carousel-dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === current ? "active-dot" : ""}`}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
