document.getElementById("identifyBtn").addEventListener("click", async () => {
  const imageInput = document.getElementById("imageInput");
  const resultBox = document.getElementById("resultMessage");

  if (!imageInput.files.length) {
    resultBox.classList.remove("text-success");
    resultBox.classList.add("text-danger");
    resultBox.innerText = "⚠️ Please upload an image first!";
    return;
  }

  const formData = new FormData();
  formData.append("image", imageInput.files[0]);

  // Show loading state
  resultBox.classList.remove("text-danger", "text-success");
  resultBox.innerHTML = "🔍 Analyzing image... Please wait.";

  try {
    const response = await fetch("/identify-waste", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      resultBox.classList.add("text-danger");
      resultBox.innerText = "❌ AI Error: " + data.error;
      return;
    }

    /// -------------------------
    /// EXPECTED JSON FROM GEMINI:
    /// {
    ///   "category": "plastic",
    ///   "confidence": "92%",
    ///   "description": "This looks like a plastic bottle..."
    /// }
    /// -------------------------

    let output;

    try {
      output = JSON.parse(data.result); // Try parse Gemini JSON
    } catch {
      // Fallback if Gemini returns plain text
      output = {
        category: data.result,
        confidence: "Not Available",
        description: "AI could not generate a detailed explanation."
      };
    }

    resultBox.classList.add("text-success");
    resultBox.innerHTML = `
      🟢 <strong>Waste Identified!</strong><br><br>
      <strong>Category:</strong> ${output.category}<br>
      <strong>Confidence:</strong> ${output.confidence}<br>
      <strong>Description:</strong><br>${output.description}
    `;

  } catch (err) {
    console.error(err);
    resultBox.classList.add("text-danger");
    resultBox.innerText = "❌ Something went wrong. Please try again.";
  }
});
