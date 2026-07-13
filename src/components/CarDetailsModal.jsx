import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  X, User, Phone, Calendar, 
  Gauge, Gear, GasPump, Wrench, PaintBrush,
  WhatsappLogo, CaretLeft, CaretRight 
} from "@phosphor-icons/react";

export default function CarDetailsModal({ car, onClose }) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const galleryRef = useRef(null);

  // Fullscreen touch state
  const fsTouchStartX = useRef(0);
  const fsTouchEndX = useRef(0);

  // Double-tap detection
  const lastTapTime = useRef(0);

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
      const cleanPhone = car.ownerPhone.replace(/[\s\-()\+]/g, "");
      window.location.href = `tel:${cleanPhone}`;
    } else {
      alert("No phone contact number is listed for this vehicle.");
    }
  };

  // Navigate images
  const goNext = useCallback(() => {
    setActiveImgIdx((prev) => (prev + 1) % imagesArray.length);
  }, [imagesArray.length]);

  const goPrev = useCallback(() => {
    setActiveImgIdx((prev) => (prev - 1 + imagesArray.length) % imagesArray.length);
  }, [imagesArray.length]);

  // --- Gallery Touch/Swipe Handlers ---
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    const diffX = Math.abs(touchEndX.current - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    // If horizontal movement is dominant, it's a swipe
    if (diffX > diffY && diffX > 10) {
      isSwiping.current = true;
      e.preventDefault(); // Prevent vertical scroll during horizontal swipe
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      goNext();
    } else if (diff < -threshold) {
      goPrev();
    }
    isSwiping.current = false;
  };

  // --- Double-tap / Double-click to Fullscreen ---
  const handleImageInteraction = (e) => {
    // Desktop: double-click
    if (e.type === "dblclick") {
      setFullscreenOpen(true);
      return;
    }
    // Mobile: double-tap
    if (e.type === "touchend" && !isSwiping.current) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        e.preventDefault();
        setFullscreenOpen(true);
      }
      lastTapTime.current = now;
    }
  };

  // --- Fullscreen Touch Handlers ---
  const handleFsTouchStart = (e) => {
    fsTouchStartX.current = e.touches[0].clientX;
    fsTouchEndX.current = e.touches[0].clientX;
  };

  const handleFsTouchMove = (e) => {
    fsTouchEndX.current = e.touches[0].clientX;
  };

  const handleFsTouchEnd = () => {
    const diff = fsTouchStartX.current - fsTouchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      goNext();
    } else if (diff < -threshold) {
      goPrev();
    }
  };

  // --- Keyboard navigation ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") {
        if (fullscreenOpen) setFullscreenOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, fullscreenOpen, onClose]);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} weight="bold" />
          </button>

          <div 
            className="modal-image-gallery"
            ref={galleryRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => { handleTouchEnd(); handleImageInteraction(e); }}
            onDoubleClick={handleImageInteraction}
          >
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
              draggable={false}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";
              }}
            />
            <div className="modal-image-overlay"></div>

            {/* Slide Arrow Buttons (visible on desktop, hidden on mobile) */}
            {imagesArray.length > 1 && (
              <>
                <button 
                  className="gallery-arrow gallery-arrow-left" 
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  aria-label="Previous image"
                >
                  <CaretLeft size={22} weight="bold" />
                </button>
                <button 
                  className="gallery-arrow gallery-arrow-right" 
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  aria-label="Next image"
                >
                  <CaretRight size={22} weight="bold" />
                </button>
              </>
            )}

            {/* Dot indicators for mobile + Thumbnail navigation */}
            {imagesArray.length > 1 && (
              <>
                {/* Dot indicators (mobile) */}
                <div className="gallery-dots">
                  {imagesArray.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`gallery-dot ${activeImgIdx === idx ? "active" : ""}`}
                      onClick={() => setActiveImgIdx(idx)}
                      aria-label={`Image ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Thumbnail strip (desktop) */}
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
              </>
            )}

            {/* Image counter badge */}
            {imagesArray.length > 1 && (
              <div className="gallery-counter">
                {activeImgIdx + 1} / {imagesArray.length}
              </div>
            )}

            {/* Double-tap hint (mobile only) */}
            <div className="gallery-tap-hint">Double-tap to fullscreen</div>
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
                      href={`https://wa.me/${car.whatsapp.replace(/[\s\-()+]/g, "")}`}
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

      {/* ==================== FULLSCREEN IMAGE VIEWER ==================== */}
      {fullscreenOpen && (
        <div 
          className="fullscreen-viewer" 
          onClick={() => setFullscreenOpen(false)}
          onTouchStart={handleFsTouchStart}
          onTouchMove={handleFsTouchMove}
          onTouchEnd={handleFsTouchEnd}
        >
          <button 
            className="fullscreen-close-btn" 
            onClick={() => setFullscreenOpen(false)}
            aria-label="Close fullscreen"
          >
            <X size={24} weight="bold" />
          </button>

          {/* Counter */}
          {imagesArray.length > 1 && (
            <div className="fullscreen-counter">
              {activeImgIdx + 1} / {imagesArray.length}
            </div>
          )}

          {/* Main fullscreen image */}
          <img
            src={activeImageUrl}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="fullscreen-image"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";
            }}
          />

          {/* Arrow navigation in fullscreen */}
          {imagesArray.length > 1 && (
            <>
              <button 
                className="fullscreen-arrow fullscreen-arrow-left"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Previous image"
              >
                <CaretLeft size={28} weight="bold" />
              </button>
              <button 
                className="fullscreen-arrow fullscreen-arrow-right"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Next image"
              >
                <CaretRight size={28} weight="bold" />
              </button>
            </>
          )}

          {/* Dot indicators in fullscreen */}
          {imagesArray.length > 1 && (
            <div className="fullscreen-dots">
              {imagesArray.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`fullscreen-dot ${activeImgIdx === idx ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setActiveImgIdx(idx); }}
                  aria-label={`Image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
