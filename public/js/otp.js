document
  .getElementById("otp-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get the passcode from the form
    const formData = new FormData(event.target);
    const otp = formData.get("passcode")?.trim();

    try {
      const response = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return alert("Failed to verify passcode.");
      }

      if (data.redirectUrl) {
        return (window.location.href = data.redirectUrl);
      }
    } catch (error) {
      return alert("Failed to verify passcode.");
    }
  });
