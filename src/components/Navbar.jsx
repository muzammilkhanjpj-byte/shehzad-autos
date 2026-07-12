import React from "react";
import { Car, Storefront, ChartBar, PlusCircle, SignOut, User } from "@phosphor-icons/react";

export default function Navbar({ activeTab, setActiveTab, currentUser, onSignOut }) {
  // Get initials from user name or email
  const getUserInitials = () => {
    if (!currentUser) return "";
    if (currentUser.name) {
      const parts = currentUser.name.split(" ");
      if (parts.length > 1) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return currentUser.name.charAt(0).toUpperCase();
    }
    return currentUser.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar-container">
      <div className="nav-logo" onClick={() => setActiveTab("browse")}>
        <img src="/logo.png" alt="Shehzad Autos Logo" className="nav-logo-img" />
        <span className="nav-logo-text">SHEHZAD AUTOS</span>
      </div>
      
      <div className="nav-links">
        <button 
          className={`nav-item ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          <Storefront size={18} weight={activeTab === "browse" ? "fill" : "regular"} />
          <span>Browse</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === "add" ? "active" : ""}`}
          onClick={() => setActiveTab("add")}
        >
          <PlusCircle size={18} weight={activeTab === "add" ? "fill" : "regular"} />
          <span>Sell Car</span>
        </button>
        
        {currentUser && (
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <ChartBar size={18} weight={activeTab === "dashboard" ? "fill" : "regular"} />
            <span>Dashboard</span>
          </button>
        )}

        {/* Auth details in navigation */}
        {currentUser ? (
          <div className="nav-user-container">
            {/* Profile Avatar */}
            <div 
              className="nav-avatar"
              title={`Logged in as ${currentUser.name || currentUser.email}`}
            >
              {getUserInitials()}
            </div>
            
            {/* Sign Out Button */}
            <button 
              className="nav-item nav-signout-btn" 
              onClick={onSignOut}
              title="Sign Out"
            >
              <SignOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            className={`nav-item nav-signin-btn ${activeTab === "auth" ? "active" : ""}`}
            onClick={() => setActiveTab("auth")}
          >
            <User size={18} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
