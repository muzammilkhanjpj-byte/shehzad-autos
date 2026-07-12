import React from "react";
import { 
  Car, Pencil, Trash, 
  Check, Plus, SmileySad, PhoneCall 
} from "@phosphor-icons/react";

export default function Dashboard({ cars, onEditCar, onDeleteCar, onMarkSold, onMarkAvailable, onAddNewListing }) {
  
  // Calculate analytics
  const totalListings = cars.length;

  // Format currency helper
  const formatPrice = (price) => {
    return "Rs. " + new Intl.NumberFormat("en-US").format(price);
  };

  return (
    <div className="dashboard-view-container">
      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-glow-accent"></div>
          <div>
            <div className="metric-label">Total Listings</div>
            <div className="metric-number">{totalListings}</div>
          </div>
          <div className="metric-icon-box">
            <Car size={24} weight="duotone" />
          </div>
        </div>

      </div>
      {/* Main Listings Card */}
      <div className="dashboard-listings-card">
        <div className="dashboard-header">
          <h2 className="dashboard-header-title">Manage Listed Cars</h2>
          <button className="btn-add-listing-cta" onClick={onAddNewListing}>
            <Plus size={16} weight="bold" />
            <span>List Another Car</span>
          </button>
        </div>

        {cars.length === 0 ? (
          <div className="empty-state">
            <SmileySad size={48} className="empty-state-icon" />
            <div className="empty-state-text">You don't have any cars listed.</div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
              Start listing your sports, luxury or electric cars on OctaneDrive.
            </p>
            <button className="btn-card-primary" onClick={onAddNewListing} style={{ display: "inline-flex", width: "auto" }}>
              Add a Car Now
            </button>
          </div>
        ) : (
          <div className="listings-table-container">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Price</th>
                  <th>Specs</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car.id}>
                    <td>
                      <div className="table-car-cell">
                        <img 
                          src={(car.images && car.images.length > 0 ? car.images[0] : null) || car.image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"} 
                          alt={`${car.make} ${car.model}`}
                          className="table-car-img"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                        <div>
                          <div className="table-car-name">{car.year} {car.make} {car.model}</div>
                          <div className="table-car-meta">Color: {car.color || "N/A"} &bull; {car.condition}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="table-price-cell">{formatPrice(car.price)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px" }}>
                        <div>{car.transmission}</div>
                        <div style={{ color: "var(--color-text-muted)" }}>{car.fuelType}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px" }}>
                        <div style={{ fontWeight: 500, color: "#fff" }}>{car.ownerName}</div>
                        <div style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <PhoneCall size={12} />
                          <span>{car.ownerPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {car.status === "Sold" ? (
                        <span style={{ 
                          background: "var(--color-success-glow)", 
                          color: "var(--color-success)", 
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          padding: "4px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase"
                        }}>
                          Sold
                        </span>
                      ) : (
                        <span style={{ 
                          background: "rgba(255, 255, 255, 0.03)", 
                          color: "var(--color-text-secondary)", 
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          padding: "4px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase"
                        }}>
                          Available
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        {car.status !== "Sold" ? (
                          <button 
                            className="btn-table-action sold" 
                            title="Mark as Sold"
                            onClick={() => onMarkSold(car.id)}
                          >
                            <Check size={14} />
                            <span style={{ marginLeft: "4px" }}>Sold</span>
                          </button>
                        ) : (
                          <button 
                            className="btn-table-action" 
                            title="Revert to Available"
                            onClick={() => onMarkAvailable(car.id)}
                            style={{ border: "1px solid rgba(251, 191, 36, 0.3)", color: "#fbbf24" }}
                          >
                            <span style={{ marginLeft: "4px" }}>Available</span>
                          </button>
                        )}
                        <button 
                          className="btn-table-action edit" 
                          title="Edit Listing"
                          onClick={() => onEditCar(car)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          className="btn-table-action delete" 
                          title="Delete Listing"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove the listing for ${car.year} ${car.make} ${car.model}?`)) {
                              onDeleteCar(car.id);
                            }
                          }}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
