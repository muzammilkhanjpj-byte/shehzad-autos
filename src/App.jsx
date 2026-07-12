import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CarCard from "./components/CarCard";
import CarDetailsModal from "./components/CarDetailsModal";
import CarForm from "./components/CarForm";
import Dashboard from "./components/Dashboard";
import Auth from "./components/Auth";
import { INITIAL_CARS } from "./data/mockData";
import { supabase } from "./utils/supabaseClient";
import { MagnifyingGlass, Funnel, ArrowClockwise, Crown, CircleNotch } from "@phosphor-icons/react";

const generateUuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function App() {
  // Tab State: 'browse' | 'dashboard' | 'add' | 'auth'
  const [activeTab, setActiveTab] = useState("browse");

  // Current logged in user session (synced with Supabase)
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Keep a ref of activeTab to avoid stale closures in auth useEffect
  const activeTabRef = React.useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Global cars list state
  const [cars, setCars] = useState([]);

  // Fetch cars from Supabase on mount and resolve signed URLs
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Gather all storage image paths
          const allPaths = [];
          data.forEach((car) => {
            if (Array.isArray(car.images)) {
              car.images.forEach((path) => {
                if (path && !path.startsWith("http") && !path.startsWith("data:")) {
                  allPaths.push(path);
                }
              });
            }
          });

          let signedUrlsMap = {};
          if (allPaths.length > 0) {
            const { data: signedData, error: signedError } = await supabase.storage
              .from("app-files")
              .createSignedUrls(allPaths, 7200); // 2 hours

            if (signedError) throw signedError;
            if (signedData) {
              signedData.forEach((item) => {
                if (item.signedUrl) {
                  signedUrlsMap[item.path] = item.signedUrl;
                }
              });
            }
          }

          // Map signed URLs to display state, keeping storagePaths for updates/deletes
          const resolvedCars = data.map((car) => {
            const resolvedImages = (car.images || []).map((path) => {
              if (path.startsWith("http") || path.startsWith("data:")) {
                return path;
              }
              return signedUrlsMap[path] || path;
            });

            return {
              ...car,
              images: resolvedImages,
              storagePaths: car.images || []
            };
          });

          setCars(resolvedCars);
        } else {
          // Fallback to mock data if DB is connected but empty
          setCars(INITIAL_CARS);
        }
      } catch (error) {
        console.error("Error fetching cars from Supabase, falling back to mock data:", error);
        setCars(INITIAL_CARS);
      }
    };
    fetchCars();
  }, []);

  // Listen to Supabase Auth State changes
  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        const localUser = localStorage.getItem("mock_user");
        if (localUser) {
          try {
            setCurrentUser(JSON.parse(localUser));
          } catch (e) {
            console.error("Error reading local mock user", e);
          }
        }
      }
      setAuthLoading(false);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        // Redirect to dashboard on successful login/signup
        if (
          event === "SIGNED_IN" && 
          (activeTabRef.current === "auth" || activeTabRef.current === "dashboard" || activeTabRef.current === "add")
        ) {
          setActiveTab("dashboard");
        }
      } else {
        const localUser = localStorage.getItem("mock_user");
        if (localUser) {
          try {
            setCurrentUser(JSON.parse(localUser));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Syncing is handled by Supabase queries on mount and transaction actions

  // Selection states
  const [selectedCar, setSelectedCar] = useState(null);
  const [editingCar, setEditingCar] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("All");
  const [fuelFilter, setFuelFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("All");
  
  // Find max price dynamically from current inventory
  const maxPriceInInventory = cars.length > 0 ? Math.max(...cars.map(c => c.price)) : 50000000;
  const [priceRange, setPriceRange] = useState(maxPriceInInventory);

  // Sync price range if cars list changes significantly
  useEffect(() => {
    setPriceRange((prev) => Math.max(prev, maxPriceInInventory));
  }, [maxPriceInInventory]);

  // Reset filters helper
  const handleResetFilters = () => {
    setSearchQuery("");
    setTransmissionFilter("All");
    setFuelFilter("All");
    setConditionFilter("All");
    setPriceRange(maxPriceInInventory);
  };

  const handleMockLogin = (email, name) => {
    const mockUser = {
      id: "mock-user-123",
      email: email,
      name: name,
      user_metadata: {
        name: name
      },
      isMock: true
    };
    localStorage.setItem("mock_user", JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    setActiveTab("dashboard");
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    localStorage.removeItem("mock_user");
    setCurrentUser(null);
    setEditingCar(null);
    setActiveTab("browse");
  };

  // Add new listing handler
  const handleCreateListing = async (newCarData, imageBlobs = []) => {
    if (!currentUser) return;
    
    const carId = `car-${Date.now()}`;
    const uploadedImages = [];

    // Bypass for local mock user
    if (currentUser.isMock) {
      const mockCar = {
        ...newCarData,
        id: carId,
        images: newCarData.images,
        status: "Available",
        userId: currentUser.id,
        ownerName: newCarData.ownerName || "Shehzad",
        ownerPhone: newCarData.ownerPhone || "+923213938892",
        whatsapp: newCarData.whatsapp || "+923213805808",
        storagePaths: []
      };
      setCars((prev) => [mockCar, ...prev]);
      setActiveTab("browse");
      return;
    }

    try {
      // 1. Upload new image blobs to Supabase Storage
      for (let i = 0; i < newCarData.images.length; i++) {
        const image = newCarData.images[i];
        
        if (image.startsWith("data:image/")) {
          const match = imageBlobs.find((b) => b.preview === image);
          if (match && match.blob) {
            const fileExt = "jpg";
            const fileName = `${generateUuid()}.${fileExt}`;
            const filePath = `${currentUser.id}/listings/${carId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("app-files")
              .upload(filePath, match.blob, {
                contentType: "image/jpeg",
                upsert: true
              });

            if (uploadError) throw uploadError;
            uploadedImages.push(filePath);
          }
        } else {
          uploadedImages.push(image);
        }
      }

      // 2. Prepare the database car record
      const newCar = {
        ...newCarData,
        id: carId,
        images: uploadedImages,
        status: "Available",
        userId: currentUser.id,
        ownerName: "Shehzad",
        ownerPhone: "+923213938892",
        whatsapp: "+923213805808"
      };
      delete newCar.ownerEmail;

      // 3. Insert record into database
      const { data: dbData, error: dbError } = await supabase
        .from("cars")
        .insert([newCar])
        .select();

      if (dbError) throw dbError;

      // 4. Resolve signed URLs for the newly created item
      if (dbData && dbData[0]) {
        const savedCar = dbData[0];
        const resolvedImages = [];
        
        for (const path of savedCar.images || []) {
          if (path.startsWith("http") || path.startsWith("data:")) {
            resolvedImages.push(path);
          } else {
            const { data: signedData } = await supabase.storage
              .from("app-files")
              .createSignedUrl(path, 7200);
            
            resolvedImages.push(signedData?.signedUrl || path);
          }
        }

        const carWithSignedUrls = {
          ...savedCar,
          images: resolvedImages,
          storagePaths: savedCar.images || []
        };

        setCars((prev) => [carWithSignedUrls, ...prev]);
      }
      
      setActiveTab("browse");
    } catch (error) {
      console.error("Error creating listing with storage:", error);
      alert("Failed to save listing: " + error.message);
    }
  };

  // Edit listing handler
  const handleUpdateListing = async (updatedCarData, imageBlobs = []) => {
    const carId = updatedCarData.id;
    const uploadedImages = [];

    // Bypass for local mock user
    if (currentUser?.isMock) {
      const mockCar = {
        ...updatedCarData,
        images: updatedCarData.images,
        storagePaths: []
      };
      setCars((prev) => 
        prev.map((car) => (car.id === carId ? mockCar : car))
      );
      setEditingCar(null);
      setActiveTab("dashboard");
      return;
    }

    try {
      // 1. Upload any new image blobs to Supabase Storage
      for (let i = 0; i < updatedCarData.images.length; i++) {
        const image = updatedCarData.images[i];
        
        if (image.startsWith("data:image/")) {
          const match = imageBlobs.find((b) => b.preview === image);
          if (match && match.blob) {
            const fileExt = "jpg";
            const fileName = `${generateUuid()}.${fileExt}`;
            const filePath = `${currentUser.id}/listings/${carId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("app-files")
              .upload(filePath, match.blob, {
                contentType: "image/jpeg",
                upsert: true
              });

            if (uploadError) throw uploadError;
            uploadedImages.push(filePath);
          }
        } else {
          const indexInState = editingCar.images.indexOf(image);
          if (indexInState !== -1 && editingCar.storagePaths && editingCar.storagePaths[indexInState]) {
            uploadedImages.push(editingCar.storagePaths[indexInState]);
          } else {
            uploadedImages.push(image);
          }
        }
      }

      // 2. Delete old images removed during edit
      if (editingCar && editingCar.storagePaths) {
        const deletedPaths = editingCar.storagePaths.filter(
          (path) => !uploadedImages.includes(path) && !path.startsWith("http")
        );
        if (deletedPaths.length > 0) {
          await supabase.storage.from("app-files").remove(deletedPaths);
        }
      }

      // 3. Update car details in database
      const updatedCar = {
        ...updatedCarData,
        images: uploadedImages,
        ownerName: "Shehzad",
        ownerPhone: "+923213938892",
        whatsapp: "+923213805808"
      };
      delete updatedCar.ownerEmail;
      delete updatedCar.storagePaths;

      const { error: dbError } = await supabase
        .from("cars")
        .update(updatedCar)
        .eq("id", carId);

      if (dbError) throw dbError;

      // 4. Re-resolve signed URLs for display state
      const resolvedImages = [];
      for (const path of uploadedImages) {
        if (path.startsWith("http") || path.startsWith("data:")) {
          resolvedImages.push(path);
        } else {
          const { data: signedData } = await supabase.storage
            .from("app-files")
            .createSignedUrl(path, 7200);
          
          resolvedImages.push(signedData?.signedUrl || path);
        }
      }

      const updatedCarWithSignedUrls = {
        ...updatedCar,
        images: resolvedImages,
        storagePaths: uploadedImages
      };

      setCars((prev) => 
        prev.map((car) => (car.id === carId ? updatedCarWithSignedUrls : car))
      );
      setEditingCar(null);
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error updating listing with storage:", error);
      alert("Failed to update listing: " + error.message);
    }
  };

  // Delete listing handler
  const handleDeleteListing = async (id) => {
    const carToDelete = cars.find((c) => c.id === id);

    // Bypass for local mock user
    if (currentUser?.isMock) {
      setCars((prev) => prev.filter((car) => car.id !== id));
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from("cars")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // Delete images from storage
      if (carToDelete && carToDelete.storagePaths) {
        const cleanPaths = carToDelete.storagePaths.filter(
          (path) => path && !path.startsWith("http") && !path.startsWith("data:")
        );
        if (cleanPaths.length > 0) {
          await supabase.storage.from("app-files").remove(cleanPaths);
        }
      }

      setCars((prev) => prev.filter((car) => car.id !== id));
    } catch (error) {
      console.error("Error deleting listing from Supabase:", error);
      alert("Failed to delete listing. Only the owner can delete this listing.");
    }
  };

  // Mark as sold / available handler
  const handleMarkSold = async (id) => {
    // Bypass for local mock user
    if (currentUser?.isMock) {
      setCars((prev) => 
        prev.map((car) => car.id === id ? { ...car, status: "Sold" } : car)
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("cars")
        .update({ status: "Sold" })
        .eq("id", id);

      if (error) throw error;

      setCars((prev) => 
        prev.map((car) => car.id === id ? { ...car, status: "Sold" } : car)
      );
    } catch (error) {
      console.error("Error marking listing as sold in Supabase:", error);
      alert("Failed to update status. Only the owner can modify this listing.");
    }
  };

  const handleMarkAvailable = async (id) => {
    // Bypass for local mock user
    if (currentUser?.isMock) {
      setCars((prev) => 
        prev.map((car) => car.id === id ? { ...car, status: "Available" } : car)
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("cars")
        .update({ status: "Available" })
        .eq("id", id);

      if (error) throw error;

      setCars((prev) => 
        prev.map((car) => car.id === id ? { ...car, status: "Available" } : car)
      );
    } catch (error) {
      console.error("Error marking listing as available in Supabase:", error);
      alert("Failed to update status. Only the owner can modify this listing.");
    }
  };

  // Trigger form into edit mode
  const handleStartEdit = (car) => {
    setEditingCar(car);
    setActiveTab("add");
  };

  // Filter listings for the browse page (global view)
  const filteredCars = cars.filter((car) => {
    const matchesSearch = 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTransmission = transmissionFilter === "All" || car.transmission === transmissionFilter;
    const matchesFuel = fuelFilter === "All" || car.fuelType === fuelFilter;
    const matchesCondition = conditionFilter === "All" || car.condition === conditionFilter;
    const matchesPrice = car.price <= priceRange;
    const matchesStatus = car.status !== "Sold";
    
    return matchesSearch && matchesTransmission && matchesFuel && matchesCondition && matchesPrice && matchesStatus;
  });

  // Filter dashboard listings (user owned items only)
  const userCars = currentUser ? cars.filter((car) => car.userId === currentUser.id) : [];

  // Protect tabs that require authentication
  const shouldShowAuth = (activeTab === "dashboard" || activeTab === "add") && !currentUser;

  // Render glowing loader screen while determining session state
  if (authLoading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center", 
        backgroundColor: "#060608",
        color: "var(--color-text-secondary)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(100px)", width: "300px", height: "300px", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)" }}></div>
        <CircleNotch size={48} style={{ animation: "spin 1s linear infinite", color: "var(--color-pink)", marginBottom: "20px" }} />
        <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "16px", fontWeight: 500, letterSpacing: "0.05em" }}>Loading Shehzad Autos...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Map user data for navbar presentation
  const navUser = currentUser ? {
    email: currentUser.email,
    name: currentUser.user_metadata?.name || currentUser.email
  } : null;

  return (
    <div className="app-container">
      {/* Visual background glows */}
      <div className="glow-sphere glow-sphere-1"></div>
      <div className="glow-sphere glow-sphere-2"></div>

      {/* Floating navigation */}
      <Navbar 
        activeTab={shouldShowAuth ? "auth" : activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "add") {
            setEditingCar(null); // Clear edit status when moving away
          }
        }} 
        currentUser={navUser}
        onSignOut={handleSignOut}
      />

      <main className="main-content">
        {/* Protected auth screen trigger */}
        {shouldShowAuth && (
          <Auth 
            onCancel={() => setActiveTab("browse")}
            onMockLogin={handleMockLogin}
          />
        )}

        {/* Guest Auth tab view */}
        {!shouldShowAuth && activeTab === "auth" && (
          <Auth 
            onCancel={() => setActiveTab("browse")}
            onMockLogin={handleMockLogin}
          />
        )}

        {/* VIEW: ADD & EDIT FORM */}
        {!shouldShowAuth && activeTab === "add" && (
          <CarForm
            onSubmit={editingCar ? handleUpdateListing : handleCreateListing}
            onCancel={() => {
              setEditingCar(null);
              setActiveTab(editingCar ? "dashboard" : "browse");
            }}
            initialCar={editingCar || {
              ownerName: "Shehzad",
              ownerPhone: "+923213938892",
              whatsapp: "+923213805808",
              make: "",
              model: "",
              year: new Date().getFullYear(),
              price: "",
              mileage: "",
              transmission: "Automatic",
              fuelType: "Petrol",
              images: [],
              description: "",
              condition: "Used",
              location: "",
              keywords: []
            }}
          />
        )}

        {/* VIEW: DASHBOARD */}
        {!shouldShowAuth && activeTab === "dashboard" && (
          <Dashboard
            cars={userCars}
            onEditCar={handleStartEdit}
            onDeleteCar={handleDeleteListing}
            onMarkSold={handleMarkSold}
            onMarkAvailable={handleMarkAvailable}
            onAddNewListing={() => {
              setEditingCar(null);
              setActiveTab("add");
            }}
          />
        )}

        {/* VIEW: BROWSE CATALOG */}
        {!shouldShowAuth && activeTab === "browse" && (
          <>
            {/* Hero Headers */}
            <section className="hero-section">
              <span className="hero-badge">
                <Crown size={14} weight="duotone" />
                <span>Next-Gen Automotive Exchange</span>
              </span>
              <h1 className="hero-title">
                Find Your Next <span className="title-gradient">Octane Machine</span>
              </h1>
            </section>

            {/* Filter Card */}
            <section className="search-filter-card">
              <div className="search-bar-wrapper">
                <MagnifyingGlass size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by brand, model, features, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filters-grid">
                <div className="filter-group">
                  <span className="filter-label">Transmission</span>
                  <div className="filter-buttons">
                    {["All", "Automatic", "Manual"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTransmissionFilter(t)}
                        className={`filter-btn ${transmissionFilter === t ? "active" : ""}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Fuel Type</span>
                  <select
                    value={fuelFilter}
                    onChange={(e) => setFuelFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="All">All Fuels</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="filter-group">
                  <span className="filter-label">Condition</span>
                  <select
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="All">All Conditions</option>
                    <option value="New">New</option>
                    <option value="Certified Pre-Owned">Certified Pre-Owned</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div className="filter-actions-row">
                <div className="slider-wrapper" style={{ flex: 1, minWidth: "240px" }}>
                  <div className="slider-header">
                    <span>Max Price Limit</span>
                    <span className="slider-value">
                      {`Rs. ${new Intl.NumberFormat("en-US").format(priceRange)}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max={Math.max(50000000, maxPriceInInventory)}
                    step="100000"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="range-input"
                  />
                </div>
                
                <button 
                  onClick={handleResetFilters} 
                  className="filter-btn"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <ArrowClockwise size={14} />
                  <span>Reset Filters</span>
                </button>
              </div>
            </section>

            {/* Cars Grid */}
            {filteredCars.length === 0 ? (
              <div className="empty-state" style={{ margin: "40px 0" }}>
                <Funnel size={48} className="empty-state-icon" />
                <div className="empty-state-text">No vehicles match your filters.</div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
                  Try resetting your search query, price limit slider, or category dropdowns.
                </p>
              </div>
            ) : (
              <section className="cars-grid">
                {filteredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car}
                    onViewDetails={setSelectedCar}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {/* Detailed Modal Overlay */}
      {selectedCar && (
        <CarDetailsModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </div>
  );
}
