import React from "react";
import { Storefront, ChartBar, PlusCircle, SignOut, User } from "@phosphor-icons/react";

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
    <>
      {/* Top Header Layer */}
      <header className="navbar-top-layer">
        <div className="nav-logo" onClick={() => setActiveTab("browse")}>
          <img src="/logo.png" alt="Shehzad Autos Logo" className="nav-logo-img" />
          <span className="nav-logo-text">SHEHZAD AUTOS</span>
        </div>
        
        {/* Desktop Links (hidden on mobile/tablet) */}
        <div className="nav-links-desktop">
          <button 
            className={`nav-item ${activeTab === "browse" ? "active" : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            <Storefront size={18} weight={activeTab === "browse" ? "fill" : "regular"} />
            <span>Browsing</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <PlusCircle size={18} weight={activeTab === "add" ? "fill" : "regular"} />
            <span>Seller</span>
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
        </div>

        {/* User Auth Info (Top Right) */}
        <div className="nav-auth-top">
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
      </header>

      {/* Bottom Sticky Navigation Layer (visible only on mobile/tablet) */}
      <nav className="navbar-bottom-layer">
        <button 
          className={`bottom-nav-item ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          <Storefront size={22} weight={activeTab === "browse" ? "fill" : "regular"} />
          <span>Browsing</span>
        </button>
        
        <button 
          className={`bottom-nav-item ${activeTab === "add" ? "active" : ""}`}
          onClick={() => setActiveTab("add")}
        >
          <PlusCircle size={22} weight={activeTab === "add" ? "fill" : "regular"} />
          <span>Seller</span>
        </button>
        
        <button 
          className={`bottom-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <ChartBar size={22} weight={activeTab === "dashboard" ? "fill" : "regular"} />
          <span>Dashboard</span>
        </button>
      </nav>
    </>
  );
}

