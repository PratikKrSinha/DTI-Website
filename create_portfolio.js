// Import Firebase modules (ensure your script is loaded as type="module")
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase configuration (with corrected storageBucket)
const firebaseConfig = {
  apiKey: "AIzaSyCRwnxodEX2oy0RVVfAkNPA2xTRCfEXfUk",
  authDomain: "login-ecowaste.firebaseapp.com",
  projectId: "login-ecowaste",
  storageBucket: "login-ecowaste.appspot.com",
  messagingSenderId: "113898663795",
  appId: "1:113898663795:web:920c7e261d25f3adeedf06"
};

// Initialize Firebase, Firestore, and Auth
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Handle the portfolio creation form submission
document.getElementById('portfolioForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Gather form data
  const businessName = document.getElementById('businessName').value.trim();
  const location = document.getElementById('location').value.trim();
  const pincode = document.getElementById('pincode').value.trim();
  const avgPayment = document.getElementById('avgPayment').value.trim();
  const additionalInfo = document.getElementById('additionalInfo').value.trim();

  // Gather selected waste types from checkboxes
  const wasteTypes = Array.from(document.querySelectorAll('input[name="wasteType"]:checked'))
                          .map(checkbox => checkbox.value);

  // Basic validation
  if (!businessName || !location || !pincode || !avgPayment || wasteTypes.length === 0) {
    showNotification("Please fill in all required fields.", "error");
    return;
  }

  // Check that the user is authenticated
  const user = auth.currentUser;
  if (!user) {
    showNotification("User is not authenticated.", "error");
    return;
  }

  // Create a portfolio object to be saved in Firestore (include user UID)
  const portfolioData = {
    businessName,
    location,
    pincode,
    wasteTypes,
    avgPayment: parseFloat(avgPayment),
    additionalInfo,
    uid: user.uid,  // Add the UID of the authenticated user
    createdAt: serverTimestamp() // Use server timestamp for consistency
  };

  try {
    // Save portfolio data to Firestore in the "portfolios" collection
    const docRef = await addDoc(collection(db, "portfolios"), portfolioData);
    console.log("Portfolio created with ID:", docRef.id);

    // Show notification that the portfolio was published
    showNotification("Portfolio published successfully!", "success");

    // Redirect to home page after a short delay (1.5 seconds)
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1500);
  } catch (error) {
    console.error("Error adding document:", error);
    showNotification("Failed to publish portfolio.", "error");
  }
});

// Notification function (toast-style)
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  container.appendChild(notification);

  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.remove();
  }, 4000);
}
