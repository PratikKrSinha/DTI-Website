// Handle the portfolio creation form submission
document.getElementById('portfolioForm').addEventListener('submit', function(e) {
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
  
    // Create a portfolio object (this can later be sent to your backend/database)
    const portfolioData = {
      businessName,
      location,
      pincode,
      wasteTypes,
      avgPayment: parseFloat(avgPayment),
      additionalInfo,
      createdAt: new Date().toISOString()
    };
  
    console.log("Portfolio Data:", portfolioData);
  
    // Show success notification and redirect (simulate saving process)
    showNotification("Portfolio created successfully!", "success");
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1500);
  });
  
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
  