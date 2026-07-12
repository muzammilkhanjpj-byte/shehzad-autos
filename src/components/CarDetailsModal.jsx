import React, { useEffect, useState } from "react";
import { 
  X, User, Phone, Calendar, 
  Tag, Gauge, Gear, GasPump, Wrench, PaintBrush, CheckCircle,
  WhatsappLogo 
} from "@phosphor-icons/react";

export default function CarDetailsModal({ car, onClose }) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!car) return null;

  // Resolve array format for backward compatibility
  const imagesArray = car.images && car.images.length > 0 
    ? car.images 
    : (car.image ? [car.image] : ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"]);

  const activeImageUrl = imagesArray[activeImgIdx] || imagesArray[0];

  // Format currency helper
  const formatPrice = (price) => {
    return "Rs. " + new Intl.NumberFormat("en-US").format(price);
  };

  // Format mileage helper
  const formatMileage = (miles) => {
    return new Intl.NumberFormat("en-US").format(miles) + " mi";
  };

  const handleContact = () => {
    if (car.ownerPhone && car.ownerPhone.trim() !== "" && car.ownerPhone !== "+92") {
      const cleanPhone = car.ownerPhone.replace(/[\s\-\(\)]/g, "");
      window.location.href = `tel:${cleanPhone}`;
    } else {
      alert("No phone contact number is listed for this vehicle.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} weight="bold" />
        </button>

        <div className="modal-image-gallery">
          <img 
            src={activeImageUrl} 
            alt="Blur Background" 
            className="modal-image-blur"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <img 
            src={activeImageUrl} 
            alt={`${car.year} ${car.make} ${car.model}`} 
            className="modal-image"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";
            }}
          />
          <div className="modal-image-overlay"></div>

          {/* Interactive Thumbnails navigation bar */}
          {imagesArray.length > 1 && (
            <div className="modal-thumbnails-container">
              {imagesArray.map((image, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`modal-thumbnail-indicator ${activeImgIdx === idx ? "active" : ""}`}
                  onClick={() => setActiveImgIdx(idx)}
                >
                  <img src={image} alt={`Angle ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-header-section">
            <div>
              <h2 className="modal-car-title">{car.make} {car.model}</h2>
              <p className="modal-car-subtitle">{car.year} &bull; {car.condition}</p>
            </div>
            <div className="modal-car-price">{formatPrice(car.price)}</div>
          </div>

          <div className="modal-grid">
            <div className="modal-left-column">
              <h3 className="modal-desc-title">Description</h3>
              <p className="modal-desc-text">{car.description}</p>

              <h3 className="modal-desc-title">Key Specifications</h3>
              <div className="specs-list-grid">
                <div className="spec-list-item">
                  <Calendar size={20} className="spec-list-icon" />
                  <div className="spec-list-info">
                    <span className="spec-list-label">Year</span>
                    <span className="spec-list-val">{car.year}</span>
                  </div>
                </div>
                
                <div className="spec-list-item">
                  <Gauge size={20} className="spec-list-icon" />
                  <div className="spec-list-info">
                    <span className="spec-list-label">Mileage</span>
                    <span className="spec-list-val">{formatMileage(car.mileage)}</span>
                  </div>
                </div>

                <div className="spec-list-item">
                  <Gear size={20} className="spec-list-icon" />
                  <div className="spec-list-info">
                    <span className="spec-list-label">Transmission</span>
                    <span className="spec-list-val">{car.transmission}</span>
                  </div>
                </div>

                <div className="spec-list-item">
                  <GasPump size={20} className="spec-list-icon" />
                  <div className="spec-list-info">
                    <span className="spec-list-label">Fuel Type</span>
                    <span className="spec-list-val">{car.fuelType}</span>
                  </div>
                </div>

                <div className="spec-list-item">
                  <Wrench size={20} className="spec-list-icon" />
                  <div className="spec-list-info">
                    <span className="spec-list-label">Engine</span>
                    <span className="spec-list-val">{car.engine || "N/A"}</span>
                  </div>
                </div>

                <div className="spec-list-item">
                  <PaintBrush size={20} className="spec-list-icon" />
                  <div className="spec-list-info">
                    <span className="spec-list-label">Color</span>
                    <span className="spec-list-val">{car.color || "N/A"}</span>
                  </div>
                </div>
              </div>

              {car.features && car.features.length > 0 && (
                <>
                  <h3 className="modal-desc-title">Features & Upgrades</h3>
                  <div className="features-tags-list">
                    {car.features.map((feature, idx) => (
                      <span key={idx} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-right-column">
              <div className="seller-glass-card">
                <h3 className="seller-header-title">
                  <div className="seller-avatar">
                    {car.ownerName ? car.ownerName.charAt(0) : "U"}
                  </div>
                  <span>Seller Info</span>
                </h3>
                
                <div className="seller-info-block">
                  {car.ownerName && (
                    <div className="seller-contact-row">
                      <User size={16} className="seller-contact-icon" />
                      <span>{car.ownerName}</span>
                    </div>
                  )}
                  
                  {car.ownerPhone && car.ownerPhone !== "+92" && (
                    <div className="seller-contact-row">
                      <Phone size={16} className="seller-contact-icon" />
                      <span>{car.ownerPhone}</span>
                    </div>
                  )}

                </div>

                <button className="btn-contact-action" onClick={handleContact}>
                  Contact Seller
                </button>

                {car.whatsapp && car.whatsapp !== "+92" && (
                  <a
                    href={`https://wa.me/${car.whatsapp.replace(/[\s\-\(\)\+]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-contact-action"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #ffffff",
                      color: "#000000",
                      marginTop: "8px",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontWeight: "700",
                    }}
                  >
                    <WhatsappLogo size={18} weight="fill" />
                    Contact on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
