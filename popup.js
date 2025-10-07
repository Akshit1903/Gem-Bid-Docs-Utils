const csrfInput = document.getElementById("csrfToken");
const containsInput = document.getElementById("contains");
const keywordsInput = document.getElementById("keywords");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const callApiBtn = document.getElementById("callApi");
const status = document.getElementById("status");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const startPage = document.getElementById("startPage");
const endPage = document.getElementById("endPage");

const today = new Date();
const prior = new Date();
prior.setDate(today.getDate() - 7);
const format = (d) => d.toISOString().split("T")[0];

// Load saved values
chrome.storage.local.get(
  [
    "csrfToken",
    "contains",
    "keywords",
    "startDate",
    "endDate",
    "startPage",
    "endPage",
  ],
  (r) => {
    csrfInput.value = r.csrfToken || "";
    containsInput.value = r.contains || "defence";
    keywordsInput.value = r.keywords;
    startDateInput.value = r.startDate || format(prior);
    endDateInput.value = r.endDate || format(today);
    startPage.value = r.startPage || 1;
    endPage.value = r.endPage || 5;
  }
);

// Auto-save fields
[
  csrfInput,
  containsInput,
  keywordsInput,
  startDateInput,
  endDateInput,
  startPage,
  endPage,
].forEach((i) => {
  i.addEventListener("input", () =>
    chrome.storage.local.set({ [i.id]: i.value })
  );
});

// Call API
callApiBtn.addEventListener("click", () => {
  status.textContent = "Calling API...";
  output.textContent = "";

  chrome.runtime.sendMessage({ action: "callApi" }, (res) => {
    status.textContent = res?.message || "Done";
    if (res?.data) {
      output.textContent = JSON.stringify(res.data);
      copyBtn.style.display = "block";
    }
  });
});

copyBtn.addEventListener("click", () => {
  navigator.clipboard
    .writeText(output.textContent.trim())
    .then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Click to copy"), 1500);
    })
    .catch((err) => console.error("Failed to copy:", err));
});
