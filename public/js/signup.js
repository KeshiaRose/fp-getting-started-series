document
  .getElementById("signup-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get the credentials from the form
    const formData = new FormData(event.target);
    const username = formData.get("username")?.trim();
    const password = formData.get("password");

    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return alert("Failed to create user.");
      }

      if (data.redirectUrl) {
        return (window.location.href = data.redirectUrl);
      }
    } catch (error) {
      return alert("Failed to create user.");
    }
  });
