import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
  getAuth, 
  signOut, 
  deleteUser, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// --------------------------
// Firebase Configuration
// --------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCRwnxodEX2oy0RVVfAkNPA2xTRCfEXfUk",
  authDomain: "login-ecowaste.firebaseapp.com",
  projectId: "login-ecowaste",
  storageBucket: "login-ecowaste.appspot.com",  // Corrected storageBucket format
  messagingSenderId: "113898663795",
  appId: "1:113898663795:web:920c7e261d25f3adeedf06"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --------------------------
// Notification (Toast)
// --------------------------
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  if (!container) return;
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  container.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// --------------------------
// Global Variable to Store Current Pincode
// --------------------------
let currentPincode = null;

// --------------------------
// Empty State Markup (Preserved)
// --------------------------
const emptyStateMarkup = `
  <div class="empty-state" id="entitiesMessage">
    <i class="fas fa-leaf empty-icon"></i>
    <h3 class="empty-title">No Entities Found</h3>
    <p class="empty-text">Be the first to create a portfolio in your area!</p>
  </div>
`;

// --------------------------
// Wait for DOM Content Loaded
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  // --------------------------
  // Auth State + Load Portfolios
  // --------------------------
  const DEBUG = true; // Set to false for redirect if unauthenticated

  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed. User:", user);
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        console.log("User data from Firestore:", userDocSnap.data());
        // If a valid pincode is already set, load portfolios
        if (currentPincode) {
          loadPortfolios();
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showNotification("Error loading user data", "error");
      }
    } else {
      console.warn("No authenticated user found.");
      if (!DEBUG) {
        setTimeout(() => {
          if (!auth.currentUser) {
            window.location.href = "index.html";
          }
        }, 1000);
      } else {
        console.log("DEBUG mode active: Not redirecting despite null user.");
      }
    }
  });

  // --------------------------
  // Sign Out Functionality
  // --------------------------
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Logout button clicked.");
      signOut(auth)
        .then(() => {
          console.log("Sign-out successful.");
          showNotification("Signed out successfully!", "success");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          showNotification("Error signing out: " + error.message, "error");
        });
    });
  } else {
    console.error("Logout button not found in the DOM.");
  }

  // --------------------------
  // Delete Account Functionality
  // --------------------------
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Delete Account button clicked.");
      const user = auth.currentUser;
      if (user) {
        deleteUser(user)
          .then(() => {
            console.log("Account deletion successful.");
            showNotification("Account deleted successfully!", "success");
            setTimeout(() => {
              window.location.href = "index.html";
            }, 1500);
          })
          .catch((error) => {
            console.error("Error deleting account:", error);
            showNotification("Error deleting account: " + error.message, "error");
          });
      } else {
        showNotification("No authenticated user.", "error");
      }
    });
  } else {
    console.error("Delete Account button not found in the DOM.");
  }

  // --------------------------
  // Load Portfolios from Firestore Based on Pincode
  // --------------------------
  async function loadPortfolios() {
    const grid = document.querySelector(".entities-grid");

    // If no valid pincode is set, show the preserved empty state markup.
    if (!currentPincode) {
      grid.innerHTML = emptyStateMarkup;
      return;
    }

    try {
      // Query portfolios where the pincode field matches currentPincode
      const portfoliosQuery = query(
        collection(db, "portfolios"),
        where("pincode", "==", currentPincode)
      );
      const portfoliosSnapshot = await getDocs(portfoliosQuery);
      const portfoliosList = portfoliosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Clear the grid for fresh data
      grid.innerHTML = "";

      if (portfoliosList.length > 0) {
        portfoliosList.forEach((portfolio) => {
          // Create a card for each portfolio
          const card = document.createElement("article");
          card.className = "entity-card";
          card.tabIndex = 0;
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", `View details for ${portfolio.businessName}`);
          card.innerHTML = `
            <div class="card-header">
              <img src="default.jpg" alt="${portfolio.businessName} image" class="card-image">
            </div>
            <div class="card-body">
              <h3 class="entity-name">${portfolio.businessName}</h3>
              <p class="entity-location"><i class="fas fa-map-marker-alt"></i> ${portfolio.location}</p>
              <div class="entity-tags">
                ${portfolio.wasteTypes.map(type => `<span class="tag">${type}</span>`).join("")}
              </div>
              <p class="entity-description">${portfolio.additionalInfo || "No description available."}</p>
            </div>
          `;
          card.addEventListener("click", () => {
            window.location.href = `entity_detail.html?id=${portfolio.id}`;
          });
          grid.appendChild(card);
        });
      } else {
        // If no portfolios match the current pincode, show the empty state markup.
        grid.innerHTML = emptyStateMarkup;
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      grid.innerHTML = emptyStateMarkup;
      showNotification("Error loading portfolios.", "error");
    }
  }

  // --------------------------
  // Location Search (Using OpenStreetMap Nominatim API)
  // --------------------------
  const locationInput = document.getElementById("locationInput");
  const suggestionsDiv = document.getElementById("suggestions");

  if (locationInput && suggestionsDiv) {
    locationInput.addEventListener("input", async function () {
      const queryStr = this.value.trim();
      if (queryStr.length > 2) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&countrycodes=IN&limit=5`;
          const response = await fetch(url);
          const data = await response.json();

          // Clear previous suggestions
          suggestionsDiv.innerHTML = "";

          data.forEach((place) => {
            const option = document.createElement("div");
            option.textContent = place.display_name;
            option.addEventListener("click", () => {
              locationInput.value = place.display_name;
              suggestionsDiv.innerHTML = "";
              showNotification(`Location set to: ${place.display_name}`, "success");

              // Try to extract a 6-digit pincode from the display name
              const postcodeMatch = place.display_name.match(/\b\d{6}\b/);
              if (postcodeMatch) {
                currentPincode = postcodeMatch[0];
                console.log("Extracted PIN code:", currentPincode);
                // Load portfolios after setting the pincode
                loadPortfolios();
              } else {
                currentPincode = null;
                showNotification("No valid 6-digit PIN code found in the selected location.", "error");
                // Clear the grid if no valid pincode is found
                document.querySelector(".entities-grid").innerHTML = emptyStateMarkup;
              }
            });
            suggestionsDiv.appendChild(option);
          });
        } catch (error) {
          console.error("Error fetching location suggestions:", error);
        }
      } else {
        // Clear suggestions if query is too short
        suggestionsDiv.innerHTML = "";
      }
    });
  } else {
    console.error("Location elements not found in the DOM.");
  }
});
