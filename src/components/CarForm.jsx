import React, { useState, useEffect, useRef } from "react";
import { Plus, ArrowLeft, CloudArrowUp, Trash, MapPin } from "@phosphor-icons/react";

const convertNumberToPKRWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return "";
  const val = Math.floor(Number(num));
  
  if (val < 1000) {
    return `${val}`;
  }
  
  const crore = Math.floor(val / 10000000);
  const lac = Math.floor((val % 10000000) / 100000);
  const thousand = Math.floor((val % 100000) / 1000);
  const remainder = val % 1000;
  
  let parts = [];
  if (crore > 0) parts.push(`${crore} Crore`);
  if (lac > 0) parts.push(`${lac} Lac`);
  if (thousand > 0) parts.push(`${thousand} Thousand`);
  if (remainder > 0) parts.push(`${remainder}`);
  
  return parts.join(" ");
};

export default function CarForm({ onSubmit, onCancel, initialCar }) {

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    mileage: "",
    transmission: "Automatic",
    fuelType: "Petrol",
    images: [],
    description: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    condition: "Used",
    engine: "",
    color: "",
    featuresText: "",
    location: "",
    keywords: [],
    whatsapp: "",
  });

  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [imageBlobs, setImageBlobs] = useState([]);
  const fileInputRef = useRef(null);

  // If initialCar is provided (editing mode), populate the form
  useEffect(() => {
    if (initialCar) {
      const imagesArray = initialCar.images 
        ? initialCar.images 
        : (initialCar.image ? [initialCar.image] : []);
        
      setFormData((prev) => ({
        ...prev,
        ...initialCar,
        images: imagesArray,
        featuresText: initialCar.features ? initialCar.features.join(", ") : "",
        ownerPhone: initialCar.ownerPhone || "",
        whatsapp: initialCar.whatsapp || "",
        location: initialCar.location || "",
        keywords: initialCar.keywords || [],
      }));
    }
  }, [initialCar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  // File picker handler
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  };

  // Handle multiple uploaded files
  const handleMultipleFiles = (files) => {
    const remainingSlots = 6 - formData.images.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, images: "You can only upload up to 6 images." }));
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setErrors((prev) => ({ ...prev, images: "" }));

    filesToProcess.forEach((file) => {
      // 1. Validate File Type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, images: "Only image files are allowed." }));
        return;
      }


      // 3. Process with Canvas (Async resize, 16:9 center-crop, and compress)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setFormData((prev) => {
            if (prev.images.length >= 6) return prev;

            const isCover = prev.images.length === 0;
            const maxDim = isCover ? 1200 : 1600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            // Create Canvas
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            // Draw full image to canvas preserving original aspect ratio
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG format at 0.85 quality
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);

            canvas.toBlob((blob) => {
              if (blob) {
                setImageBlobs((prevBlobs) => [...prevBlobs, {
                  preview: compressedBase64,
                  blob: blob
                }]);
              }
            }, "image/jpeg", 0.85);

            return {
              ...prev,
              images: [...prev.images, compressedBase64]
            };
          });
        };
        img.onerror = () => {
          setErrors((prev) => ({ ...prev, images: `Failed to load image "${file.name}".` }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const previewToRemove = formData.images[indexToRemove];
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
    setImageBlobs((prevBlobs) => prevBlobs.filter((item) => item.preview !== previewToRemove));
    // Clear limit error if any
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.make.trim()) newErrors.make = "Make is required (e.g. Porsche)";
    if (!formData.model.trim()) newErrors.model = "Model is required (e.g. 911)";
    if (!formData.year || formData.year < 1886 || formData.year > new Date().getFullYear() + 2) {
      newErrors.year = "Enter a valid model year";
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = "Enter a valid positive price";
    }
    if (formData.mileage === "" || Number(formData.mileage) < 0) {
      newErrors.mileage = "Enter a valid mileage (0 or more)";
    }
    // Removed seller details validation since seller details section is removed from the form.

    if (!formData.images || formData.images.length === 0) {
      newErrors.images = "Please upload at least one image of your vehicle";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const featuresList = formData.featuresText
        ? formData.featuresText
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f.length > 0)
        : [];

      const finalCarData = {
        ...formData,
        price: Number(formData.price),
        mileage: Number(formData.mileage),
        year: Number(formData.year),
        features: featuresList,
      };
      delete finalCarData.featuresText;

      await onSubmit(finalCarData, imageBlobs);
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-section-title">
        <button 
          type="button" 
          className="btn-table-action" 
          onClick={onCancel}
          style={{ width: "32px", height: "32px", borderRadius: "50%", padding: 0 }}
        >
          <ArrowLeft size={16} />
        </button>
        <h2>{initialCar ? "Add New Car" : "List Your Car for Sale"}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Vehicle Information */}
        <h3 style={{ fontSize: "16px", color: "var(--color-pink)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Vehicle Information
        </h3>
        
        <div className="form-grid">
          <div className="filter-group">
            <label className="input-label" htmlFor="make">Make *</label>
            <input
              id="make"
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              placeholder="e.g. Porsche, Tesla, BMW"
              className="text-input"
            />
            {errors.make && <span style={{ color: "#ef4444", fontSize: "12px" }}>{errors.make}</span>}
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="model">Model *</label>
            <input
              id="model"
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="e.g. 911 Carrera S, Model S"
              className="text-input"
            />
            {errors.model && <span style={{ color: "#ef4444", fontSize: "12px" }}>{errors.model}</span>}
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="year">Year *</label>
            <input
              id="year"
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="e.g. 2023"
              className="text-input"
            />
            {errors.year && <span style={{ color: "#ef4444", fontSize: "12px" }}>{errors.year}</span>}
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="price">Price (PKR) *</label>
            <input
              id="price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 5000000"
              className="text-input"
            />
            {formData.price && (
              <div style={{ color: "var(--color-pink)", fontSize: "12px", marginTop: "6px", fontWeight: "600", letterSpacing: "0.02em" }}>
                Rs. {new Intl.NumberFormat("en-US").format(formData.price)} ({convertNumberToPKRWords(formData.price)})
              </div>
            )}
            {errors.price && <span style={{ color: "#ef4444", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.price}</span>}
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="mileage">Mileage (mi) *</label>
            <input
              id="mileage"
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              placeholder="e.g. 4500"
              className="text-input"
            />
            {errors.mileage && <span style={{ color: "#ef4444", fontSize: "12px" }}>{errors.mileage}</span>}
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="condition">Condition</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="custom-select"
            >
              <option value="New">New</option>
              <option value="Certified Pre-Owned">Certified Pre-Owned</option>
              <option value="Used">Used</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="transmission">Transmission</label>
            <select
              id="transmission"
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="custom-select"
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="input-label" htmlFor="fuelType">Fuel Type</label>
            <select
              id="fuelType"
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              className="custom-select"
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div className="filter-group font-group-full">
            <label className="input-label" htmlFor="featuresText">Features & Options (Comma separated list)</label>
            <input
              id="featuresText"
              type="text"
              name="featuresText"
              value={formData.featuresText}
              onChange={handleChange}
              placeholder="e.g. Sport Chrono Package, Air Suspension, Heated Seats, AWD"
              className="text-input"
            />
          </div>

          <div className="filter-group font-group-full">
            <label className="input-label" htmlFor="description">Detailed Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the vehicle condition, history, maintenance, upgrades, etc."
              className="textarea-input"
            ></textarea>
          </div>
        </div>

          {/* Location */}
          <div className="filter-group font-group-full">
            <label className="input-label" htmlFor="location">
              <MapPin size={14} weight="duotone" style={{ marginRight: 4, verticalAlign: "middle" }} />
              Location (City / Area)
            </label>
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Karachi, Lahore, Islamabad"
              className="text-input"
            />
          </div>

          {/* Keywords */}


        {/* Media / Images */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "32px", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", color: "var(--color-pink)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Vehicle Gallery (Upload up to 6 images)
          </h3>
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {formData.images.length} / 6 files uploaded
          </span>
        </div>
        
        <div style={{ marginBottom: "24px" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            disabled={formData.images.length >= 6}
            style={{ display: "none" }}
          />

          {/* Grid of uploaded thumbnails */}
          {formData.images.length > 0 && (
            <div className="upload-gallery-grid" style={{ marginBottom: "16px" }}>
              {formData.images.map((image, idx) => (
                <div key={idx} className="upload-preview-card" style={{ height: "130px" }}>
                  <img 
                    src={image} 
                    alt={`Preview ${idx + 1}`} 
                    className="upload-preview-img"
                  />
                  <button 
                    type="button" 
                    className="btn-remove-upload"
                    style={{ top: "8px", right: "8px", padding: "6px 8px", borderRadius: "50%" }}
                    onClick={() => handleRemoveImage(idx)}
                    title="Remove Image"
                  >
                    <Trash size={12} weight="bold" />
                  </button>
                  <span style={{ 
                    position: "absolute", 
                    bottom: "8px", 
                    left: "8px", 
                    fontSize: "10px", 
                    background: "rgba(0,0,0,0.6)", 
                    padding: "2px 6px", 
                    borderRadius: "6px",
                    color: "var(--color-text-secondary)"
                  }}>
                    {idx === 0 ? "Cover" : `#${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Dotted Upload zone (only visible if less than 6 files) */}
          {formData.images.length < 6 && (
            <div 
              className={`upload-drop-zone ${dragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <div className="upload-icon">
                <CloudArrowUp size={36} weight="duotone" />
              </div>
              <div className="upload-text-main">
                Drag & drop vehicle photo here, or <span style={{ color: "var(--color-pink)", textDecoration: "underline" }}>browse files</span>
              </div>
              <div className="upload-text-sub">
                Supports PNG, JPG, or WebP format
              </div>
            </div>
          )}

          {errors.images && <span style={{ color: "#ef4444", fontSize: "12px", display: "block", marginTop: "8px" }}>{errors.images}</span>}

          {/* Recommended Upload Guidelines */}
          <div style={{
            marginTop: "16px",
            background: "rgba(255, 255, 255, 0.01)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            fontSize: "12px"
          }}>
            <div style={{ fontWeight: 600, color: "#fff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "var(--color-pink)", fontWeight: "bold" }}>&bull;</span>
              <span>Recommended Image Specifications (Aspect Ratio: 16:9)</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "600", fontSize: "10px", letterSpacing: "0.05em" }}>
              <div>Purpose</div>
              <div>Recommended Size</div>
              <div>Aspect Ratio</div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", color: "var(--color-text-secondary)" }}>
                <div style={{ color: "#fff", fontWeight: 600 }}>Listing Cover Image</div>
                <div style={{ color: "var(--color-pink)", fontWeight: 600 }}>1200 &times; 675 px</div>
                <div style={{ color: "var(--color-pink)", fontWeight: 600 }}>16:9 ⭐ Recommended</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", color: "var(--color-text-secondary)" }}>
                <div>High Quality</div>
                <div>1600 &times; 900 px</div>
                <div>16:9</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", color: "var(--color-text-secondary)" }}>
                <div>Mobile Optimized</div>
                <div>800 &times; 450 px</div>
                <div>16:9</div>
              </div>
            </div>
          </div>
        </div>


        <div className="form-actions">
          <button 
            type="button" 
            className="btn-form-cancel" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-form-submit"
            disabled={isSubmitting}
          >
            <Plus size={18} weight="bold" style={{ display: isSubmitting ? "none" : "inline-block" }} />
            <span>{isSubmitting ? "Submitting..." : (initialCar ? "Update Listing" : "Post Listing")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
