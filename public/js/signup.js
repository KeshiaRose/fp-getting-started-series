// Load the Fingerprint library immediately when the page loads.
const fpPromise = import("https://fpjscdn.net/v3/<YOUR_PUBLIC_API_KEY>").then(
  (FingerprintJS) => FingerprintJS.load()
);

document
  .getElementById("signup-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get the credentials from the form
    const formData = new FormData(event.target);
    const username = formData.get("username")?.trim();
    const password = formData.get("password");

    // Identify the visitor when you need to
    const fp = await fpPromise;
    const result = await fp.get();
    const { sealedResult } = result;

    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Include the identification results
        body: JSON.stringify({ username, password, sealedResult }),
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
