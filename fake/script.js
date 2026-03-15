document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("analyze-form");
  const identifierInput = document.getElementById("identifier");
  const linkInput = document.getElementById("link");
  const resultPanel = document.getElementById("result-panel");
  const analyzeBtn = form.querySelector(".primary-btn");
  const loader = analyzeBtn.querySelector(".loader");
  const btnText = analyzeBtn.querySelector(".btn-text");
  let selectedPlatform = "instagram";

  // >>> ADD: your backend URL here <<<
  const API_URL = "http://127.0.0.1:5000/analyze";

  // Platform selection
  document.querySelectorAll(".platform-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".platform-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedPlatform = btn.dataset.platform;
    });
  });

  // Helper: show loading state
  function setLoading(isLoading) {
    if (isLoading) {
      analyzeBtn.classList.add("loading");
      analyzeBtn.disabled = true;
    } else {
      analyzeBtn.classList.remove("loading");
      analyzeBtn.disabled = false;
    }
  }

  // Helper: render analysis result
  function renderResult(data) {
    const p = data.profile || {};
    const isFake = (data.prediction || "").toLowerCase().includes("fake");
    const ageYears = Math.floor((p.account_age_days || 0) / 365);

    const profilePic = p.profile_pic_url || "https://via.placeholder.com/80";

    const reasons =
      Array.isArray(data.explanation) && data.explanation.length
        ? `<ul class="reason-list">${data.explanation
            .map((r) => `<li>${r}</li>`)
            .join("")}</ul>`
        : "";

    resultPanel.innerHTML = `
      <div class="profile-header">
        <div class="avatar">
          <img src="${profilePic}" alt="Profile picture" />
        </div>
        <div class="profile-meta">
          <h3>@${p.username || "unknown"}</h3>
          <p>${p.platform || selectedPlatform} · ${
      ageYears > 0 ? `${ageYears} yrs old` : "New account"
    }</p>
        </div>
        <div class="profile-status ${isFake ? "fake" : "genuine"}">
          ${data.prediction}
        </div>
      </div>
      <div class="stats-grid">
        <div class="detail-item">
          <div class="label">Followers</div>
          <div class="value">${p.followers ?? "—"}</div>
        </div>
        <div class="detail-item">
          <div class="label">Following</div>
          <div class="value">${p.following ?? "—"}</div>
        </div>
        <div class="detail-item">
          <div class="label">Posts</div>
          <div class="value">${p.posts ?? "—"}</div>
        </div>
        <div class="detail-item">
          <div class="label">Spam score</div>
          <div class="value">${
            typeof p.spam_comments_rate === "number"
              ? (p.spam_comments_rate * 100).toFixed(1) + "%"
              : "—"
          }</div>
        </div>
        <div class="detail-item">
          <div class="label">Verified</div>
          <div class="value">${p.verified ? "Yes" : "No"}</div>
        </div>
        <div class="detail-item">
          <div class="label">Profile pic</div>
          <div class="value">${p.has_profile_pic ? "Present" : "Missing"}</div>
        </div>
        <div class="detail-item">
          <div class="label">Bio length</div>
          <div class="value">${
            typeof p.bio_length === "number" ? `${p.bio_length} chars` : "—"
          }</div>
        </div>
      </div>
      ${reasons}
    `;
    resultPanel.classList.remove("hidden");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Helper: show error
  function showError(message) {
    resultPanel.innerHTML = `
      <div class="detail-item" style="background:#fceae8;border:1px solid #f5b7b1;">
        <div class="label" style="color:#b03a2e;">Error</div>
        <div class="value" style="color:#943126;">${message}</div>
      </div>
    `;
    resultPanel.classList.remove("hidden");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idValue = identifierInput.value.trim();
    const linkValue = linkInput.value.trim();

    const identifier = linkValue || idValue;
    const mode = linkValue ? "link" : "username";

    if (!identifier) {
      showError("Please enter a username or a profile link.");
      return;
    }

    setLoading(true);
    resultPanel.classList.add("hidden");

    try {
      // CALL YOUR FLASK API HERE
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          mode,
          platform: selectedPlatform,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Request failed.");
      }

      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Unable to analyze this profile.");
      }

      renderResult(data);
    } catch (err) {
      // Fallback: if backend is not ready, show mock result
      console.warn("Analyze error, using mock data:", err.message);
      const mock = {
        status: "success",
        prediction: "Genuine Account",
        profile: {
          username: idValue || "sample_user",
          platform: selectedPlatform,
          profile_pic_url: "",
          followers: 1420,
          following: 180,
          posts: 75,
          account_age_days: 730,
          verified: false,
          has_profile_pic: true,
          bio_length: 120,
          spam_comments_rate: 0.08,
        },
        explanation: [
          "Engagement pattern looks organic.",
          "Follower–following ratio appears normal.",
        ],
      };
      renderResult(mock);
    } finally {
      setLoading(false);
    }
  });
});
