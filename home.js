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
  getDocs 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// --------------------------
// Firebase Configuration
// --------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCRwnxodEX2oy0RVVfAkNPA2xTRCfEXfUk",
  authDomain: "login-ecowaste.firebaseapp.com",
  projectId: "login-ecowaste",
  storageBucket: "login-ecowaste.firebasestorage.app",
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
// Wait for DOM Content Loaded
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  // --------------------------
  // Auth State + Load Entities
  // --------------------------
  const DEBUG = true; // Set to false to enable redirect for unauthenticated users

  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed. User:", user);
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        console.log("User data from Firestore:", userDocSnap.data());
        loadEntities();
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
  // Load Entities from Firestore
  // --------------------------
  async function loadEntities() {
    const entitiesMessage = document.getElementById("entitiesMessage");
    const grid = document.querySelector(".entities-grid");

    try {
      const entitiesCol = collection(db, "entities");
      const entitiesSnapshot = await getDocs(entitiesCol);
      const entitiesList = entitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      grid.innerHTML = ""; // Clear existing content

      if (entitiesList.length === 0) {
        entitiesMessage.innerHTML =
          "<p>No entities available at this moment. Create your portfolio to be featured here.</p>";
      } else {
        entitiesMessage.innerHTML = ""; // Clear message if entities are available
        entitiesList.forEach((entity) => {
          const card = document.createElement("div");
          card.className = "entity-card";
          card.tabIndex = 0; // Make card focusable
          card.setAttribute("role", "button");
          card.setAttribute("aria-label", `View details for ${entity.name}`);

          card.innerHTML = `
            <img src="${entity.imageUrl || "default.jpg"}" alt="${entity.name} image">
            <div class="entity-info">
              <h3>${entity.name}</h3>
              <p>${entity.description || "No description available."}</p>
            </div>
          `;
          // Click handler to redirect to detailed view
          card.addEventListener("click", () => {
            window.location.href = `entity_detail.html?id=${entity.id}`;
          });
          grid.appendChild(card);
        });
      }
    } catch (error) {
      console.error("Error fetching entities:", error);
      entitiesMessage.innerHTML =
        "<p>Error loading entities. Please try again later.</p>";
      showNotification("Error loading entities.", "error");
    }
  }

  // --------------------------
  // Location Search (Using OpenStreetMap Nominatim API)
  // --------------------------
  const locationInput = document.getElementById("locationInput");
  const suggestionsDiv = document.getElementById("suggestions");

  if (locationInput && suggestionsDiv) {
    locationInput.addEventListener("input", async function () {
      const query = this.value.trim();
      if (query.length > 2) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=IN&limit=5`;
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
              // Optionally, store or use the location information as needed.
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
