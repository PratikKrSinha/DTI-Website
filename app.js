// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
  getAuth, 
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// Initialize Firebase, Authentication, and Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set authentication persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

// --------------------------
// UI Helper Functions
// --------------------------
function showLoading() {
  const overlay = document.getElementById("loadingOverlay");
  overlay?.classList.remove("hidden");
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  overlay?.classList.add("hidden");
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }
    button.innerHTML = `<span class="button-spinner"></span> Loading...`;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

const buttonSpinnerStyle = document.createElement('style');
buttonSpinnerStyle.innerHTML = `
  .button-spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 3px solid #fff;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(buttonSpinnerStyle);

function showNotification(message, type = "success") {
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "1000";
    document.body.appendChild(container);
  }
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.backgroundColor = type === "success" ? "#4caf50" : "#f44336";
  notification.style.color = "#fff";
  notification.style.padding = "15px";
  notification.style.marginTop = "10px";
  notification.style.borderRadius = "5px";
  notification.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.3)";
  notification.style.opacity = "0.95";
  container.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

function showError(message) {
  let errorDiv = document.getElementById("errorMessage");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.id = "errorMessage";
    errorDiv.style.backgroundColor = "#f8d7da";
    errorDiv.style.color = "#721c24";
    errorDiv.style.padding = "1rem";
    errorDiv.style.marginBottom = "1rem";
    errorDiv.style.borderRadius = "5px";
    errorDiv.style.textAlign = "center";
    const container = document.querySelector(".auth-container") || document.body;
    container.insertBefore(errorDiv, container.firstChild);
  }
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }, 4000);
}

function redirectToHome() {
  setTimeout(() => {
    window.location.href = "home.html";
  }, 400);
}

// --------------------------
// Password Validation & Strength Meter
// --------------------------
function validatePassword(password) {
  const lengthRegex = /.{8,}/;
  const uppercaseRegex = /[A-Z]/;
  const numberRegex = /\d/;
  const specialRegex = /[!@#$%^&*]/;
  return (
    lengthRegex.test(password) &&
    uppercaseRegex.test(password) &&
    numberRegex.test(password) &&
    specialRegex.test(password)
  );
}

function updateStrengthMeter(password) {
  const meter = document.querySelector("#signupForm .strength-meter .strength-fill");
  if (!meter) return;
  
  if (password.length === 0) {
    meter.style.width = "0%";
    meter.style.backgroundColor = "transparent";
    return;
  }
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;
  
  const percentage = (score / 4) * 100;
  meter.style.width = percentage + "%";
  
  let color = "red";
  if (score === 0) {
    color = "transparent";
  } else if (score === 1) {
    color = "red";
  } else if (score === 2) {
    color = "yellow";
  } else if (score >= 3) {
    color = "green";
  }
  meter.style.backgroundColor = color;
}

// --------------------------
// Firebase Authentication Handlers
// --------------------------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const signupButton = signupForm.querySelector('button[type="submit"]');
    setButtonLoading(signupButton, true);
    
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    
    if (!validatePassword(password)) {
      setButtonLoading(signupButton, false);
      showError("Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.");
      return;
    }
    
    showLoading();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user)
          .then(() => {
            showNotification("Verification email sent! Please verify your email before signing in.", "success");
          })
          .catch((error) => {
            console.error("Error sending verification email:", error);
          });
        return setDoc(doc(db, "users", user.uid), {
          fullName: fullName,
          email: email,
          createdAt: new Date()
        });
      })
      .then(() => {
        hideLoading();
        setButtonLoading(signupButton, false);
        signOut(auth);
        showForm("signin");
      })
      .catch((error) => {
        hideLoading();
        setButtonLoading(signupButton, false);
        console.error("Sign up error:", error);
        let message = "An error occurred. Please try again later.";
        if (error.code === "auth/email-already-in-use") {
          message = "An account with this email already exists.";
        } else if (error.code === "auth/invalid-email") {
          message = "The email address is badly formatted.";
        }
        showError(message);
      });
  });
}

const signinForm = document.getElementById("signinForm");
if (signinForm) {
  signinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const signinButton = signinForm.querySelector('button[type="submit"]');
    setButtonLoading(signinButton, true);
    
    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value;
    showLoading();
    
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        hideLoading();
        setButtonLoading(signinButton, false);
        if (!userCredential.user.emailVerified) {
          showError("Please verify your email address before signing in.");
          signOut(auth);
          return;
        }
        showNotification("Successfully logged in!", "success");
        redirectToHome();
      })
      .catch((error) => {
        hideLoading();
        setButtonLoading(signinButton, false);
        console.error("Sign in error:", error);
        let message = error.message || "An error occurred. Please try again later.";
        if (error.code === "auth/invalid-email") {
          message = "The email address is badly formatted.";
        } else if (error.code === "auth/user-not-found") {
          message = "No account found with this email.";
        } else if (error.code === "auth/wrong-password") {
          message = "Incorrect password. Please try again.";
        }
        showError(message);
      });
  });
}

const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
  forgotForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const forgotButton = forgotForm.querySelector('button[type="submit"]');
    setButtonLoading(forgotButton, true);
    
    const email = document.getElementById("forgotEmail").value.trim();
    showLoading();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        hideLoading();
        setButtonLoading(forgotButton, false);
        showNotification("Password reset email sent successfully!", "success");
      })
      .catch((error) => {
        hideLoading();
        setButtonLoading(forgotButton, false);
        console.error("Forgot password error:", error);
        let message = error.message || "An error occurred. Please try again later.";
        if (error.code === "auth/invalid-email") {
          message = "The email address is badly formatted.";
        } else if (error.code === "auth/user-not-found") {
          message = "No account found with this email.";
        }
        showError(message);
      });
  });
}

const googleSignUpButton = document.getElementById("googleSignUp");
if (googleSignUpButton) {
  googleSignUpButton.addEventListener("click", () => {
    showLoading();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        if (result._tokenResponse?.isNewUser) {
          return setDoc(doc(db, "users", result.user.uid), {
            fullName: result.user.displayName || "",
            email: result.user.email,
            createdAt: new Date()
          });
        }
      })
      .then(() => {
        hideLoading();
        showNotification("Successfully signed up with Google!", "success");
        redirectToHome();
      })
      .catch((error) => {
        hideLoading();
        console.error("Google Sign-Up error:", error);
        showError(error.message);
      });
  });
}

const googleSignInButton = document.getElementById("googleSignIn");
if (googleSignInButton) {
  googleSignInButton.addEventListener("click", () => {
    showLoading();
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        hideLoading();
        showNotification("Successfully signed in with Google!", "success");
        redirectToHome();
      })
      .catch((error) => {
        hideLoading();
        console.error("Google Sign-In error:", error);
        showError(error.message);
      });
  });
}

function showForm(formType) {
  const forms = document.querySelectorAll(".form");
  forms.forEach((form) => {
    form.classList.add("hidden");
    form.querySelectorAll("input").forEach((input) => (input.value = ""));
  });
  const targetForm = document.getElementById(`${formType}Form`);
  if (targetForm) {
    targetForm.classList.remove("hidden");
    setTimeout(() => {
      targetForm.querySelector("input")?.focus();
    }, 300);
  }
}
window.showForm = showForm;

function initTogglePassword() {
  const toggleButtons = document.querySelectorAll(".toggle-password");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", initTogglePassword);

document.addEventListener("DOMContentLoaded", () => {
  const signupPasswordInput = document.getElementById("signupPassword");
  if (signupPasswordInput) {
    signupPasswordInput.addEventListener("input", function() {
      updateStrengthMeter(this.value);
    });
  }
});

const spinnerStyle = document.createElement("style");
spinnerStyle.innerHTML = `
  #loadingOverlay.hidden { display: none; }
  .spinner {
    border: 12px solid #f3f3f3;
    border-top: 12px solid var(--primary-color);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);
