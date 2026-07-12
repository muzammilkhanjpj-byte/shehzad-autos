import React from "react";
import { Gauge, GasPump, Gear, WhatsappLogo } from "@phosphor-icons/react";

export default function CarCard({ car, onViewDetails }) {
  // Format price helper
  const formatPrice = (price) => {
    return "Rs. " + new Intl.NumberFormat("en-US").format(price);
  };

  // Format mileage helper
  const formatMileage = (miles) => {
    return new Intl.NumberFormat("en-US").format(miles) + " mi";
  };

  return (
    <div className="car-card">
      <div className="car-image-wrapper">
        <span className="car-tag-condition">{car.condition}</span>
        <img 
          src={(car.images && car.images.length > 0 ? car.images[0] : null) || car.image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"} 
          alt={`${car.year} ${car.make} ${car.model}`} 
          className="car-image"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";
          }}
        />
        <div className="car-price-badge">{formatPrice(car.price)}</div>
      </div>

      <div className="car-details-body">
        <div className="car-year-make">
          {car.year} {car.make}
        </div>
        <h3 className="car-title-model">{car.model}</h3>
        <p className="car-description-truncate">{car.description}</p>
        
        <div className="car-specs-grid">
          <div className="spec-item">
            <Gauge size={16} className="spec-icon" />
            <span className="spec-label">Mileage</span>
            <span className="spec-val">{formatMileage(car.mileage)}</span>
          </div>
          <div className="spec-item">
            <Gear size={16} className="spec-icon" />
            <span className="spec-label">Gearbox</span>
            <span className="spec-val">{car.transmission}</span>
          </div>
          <div className="spec-item">
            <GasPump size={16} className="spec-icon" />
            <span className="spec-label">Fuel</span>
            <span className="spec-val">{car.fuelType}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          <button className="btn-card-primary" style={{ flex: 1 }} onClick={() => onViewDetails(car)}>
            View Details
          </button>
          {car.whatsapp && (
            <a
              href={`https://wa.me/${car.whatsapp.replace(/[\s\-\(\)\+]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-card-primary"
              style={{
                flex: 1,
                background: "#ffffff",
                border: "1px solid #ffffff",
                color: "#000000",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontWeight: "600",
              }}
            >
              <WhatsappLogo size={16} weight="fill" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
