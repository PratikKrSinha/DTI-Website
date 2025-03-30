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
  where,
  deleteDoc
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
// Wait for DOM Content Loaded
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  // --------------------------
  // Auth State + Load User Portfolios
  // --------------------------
  onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed. User:", user);
    if (user) {
      // Optionally, load user details if needed:
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        console.log("User data:", userDocSnap.data());
      } catch (error) {
        console.error("Error fetching user data:", error);
        showNotification("Error loading user data", "error");
      }
      // Load portfolios created by this user (regardless of location)
      loadMyPortfolios(user.uid);
    } else {
      console.warn("No authenticated user found.");
      // Optionally, redirect to login if not in debug mode
      window.location.href = "index.html";
    }
  });

  // --------------------------
  // Sign Out Functionality (if needed)
  // --------------------------
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      signOut(auth)
        .then(() => {
          showNotification("Signed out successfully!", "success");
          setTimeout(() => { window.location.href = "index.html"; }, 1500);
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          showNotification("Error signing out: " + error.message, "error");
        });
    });
  }

  // --------------------------
  // Delete Account Functionality (if needed)
  // --------------------------
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const user = auth.currentUser;
      if (user) {
        deleteUser(user)
          .then(() => {
            showNotification("Account deleted successfully!", "success");
            setTimeout(() => { window.location.href = "index.html"; }, 1500);
          })
          .catch((error) => {
            console.error("Error deleting account:", error);
            showNotification("Error deleting account: " + error.message, "error");
          });
      } else {
        showNotification("No authenticated user.", "error");
      }
    });
  }
});

// --------------------------
// Load Portfolios Created by the Current User
// --------------------------
async function loadMyPortfolios(userId) {
  const grid = document.getElementById("portfoliosGrid");
  try {
    const portfoliosQuery = query(
      collection(db, "portfolios"),
      where("uid", "==", userId)
    );
    const portfoliosSnapshot = await getDocs(portfoliosQuery);
    const portfoliosList = portfoliosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Clear current grid contents
    grid.innerHTML = "";

    if (portfoliosList.length > 0) {
      portfoliosList.forEach((portfolio) => {
        // Create a card element for each portfolio
        const card = document.createElement("article");
        card.className = "entity-card";
        card.innerHTML = `
          <div class="card-header">
            <img src="${portfolio.imageUrl || 'default.jpg'}" alt="${portfolio.businessName} image" class="card-image">
          </div>
          <div class="card-body">
            <h3 class="entity-name">${portfolio.businessName}</h3>
            <p class="entity-location"><i class="fas fa-map-marker-alt"></i> ${portfolio.location}</p>
            <div class="entity-tags">
              ${portfolio.wasteTypes.map(type => `<span class="tag">${type}</span>`).join("")}
            </div>
            <p class="entity-description">${portfolio.additionalInfo || "No description available."}</p>
          </div>
          <div class="card-footer">
            <button class="action-button edit" data-id="${portfolio.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="action-button delete" data-id="${portfolio.id}"><i class="fas fa-trash-alt"></i> Delete</button>
          </div>
        `;

        // Delete button functionality
        const deleteBtn = card.querySelector(".action-button.delete");
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm("Are you sure you want to delete this portfolio?")) {
            try {
              await deleteDoc(doc(db, "portfolios", portfolio.id));
              showNotification("Portfolio deleted successfully!", "success");
              // Reload the portfolios after deletion
              loadMyPortfolios(userId);
            } catch (error) {
              console.error("Error deleting portfolio:", error);
              showNotification("Error deleting portfolio: " + error.message, "error");
            }
          }
        });

        // Edit button functionality – redirect to an edit page (implement that page separately)
        const editBtn = card.querySelector(".action-button.edit");
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // Redirect to edit page with portfolio ID as query parameter
          window.location.href = `edit_portfolio.html?id=${portfolio.id}`;
        });

        grid.appendChild(card);
      });
    } else {
      // Show empty state if no portfolios are found
      grid.innerHTML = `
        <div class="empty-state" id="emptyState">
          <i class="fas fa-leaf empty-icon"></i>
          <h3 class="empty-title">No Entities Found</h3>
          <p class="empty-text">You haven't created any portfolios yet!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching portfolios:", error);
    grid.innerHTML = `
      <div class="empty-state" id="emptyState">
        <i class="fas fa-leaf empty-icon"></i>
        <h3 class="empty-title">No Entities Found</h3>
        <p class="empty-text">Be the first to create a portfolio in your area!</p>
      </div>
    `;
    showNotification("Error loading portfolios.", "error");
  }
}
