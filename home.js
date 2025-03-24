import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signOut, deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRwnxodEX2oy0RVVfAkNPA2xTRCfEXfUk",
  authDomain: "login-ecowaste.firebaseapp.com",
  projectId: "login-ecowaste",
  storageBucket: "login-ecowaste.firebasestorage.app",
  messagingSenderId: "113898663795",
  appId: "1:113898663795:web:920c7e261d25f3adeedf06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Notification function (toast-style)
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  container.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      // Use user information as needed
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    // Redirect to login page if not authenticated.
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "index.html";
      }
    }, 1000);
  }
});

// Sign Out functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      showNotification("Signed out successfully!", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    })
    .catch((error) => {
      showNotification("Error signing out: " + error.message, "error");
    });
});

// Delete Account functionality
document.getElementById("deleteAccountBtn").addEventListener("click", () => {
  const user = auth.currentUser;
  if (user) {
    deleteUser(user)
      .then(() => {
        showNotification("Account deleted successfully!", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      })
      .catch((error) => {
        showNotification("Error deleting account: " + error.message, "error");
      });
  } else {
    showNotification("No authenticated user.", "error");
  }
});
