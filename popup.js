async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const setMessage = (msg) => document.getElementById("status").textContent = msg;

const updateElements = () => {
  chrome.storage.sync.get(['errorMsg', "lastInterceptedCookie", "lastInterceptedTime", "alistUrl", "alistUser"], ({ errorMsg, lastInterceptedCookie, lastInterceptedTime, alistUrl, alistUser }) => {
    document.getElementById("errorMsg").textContent = errorMsg || "";
    document.getElementById("cookieStr").textContent = lastInterceptedCookie || "N/A";
    document.getElementById("cookieTime").textContent = lastInterceptedTime || "";
    document.getElementById("alistUrl").value = alistUrl || "";
    document.getElementById("alistUsername").value = alistUser || "admin";
  });
};

chrome.storage.sync.onChanged.addListener(updateElements);

document.addEventListener("DOMContentLoaded", () => {
  updateElements();

  // Save backend URL
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const alistUrl = document.getElementById("alistUrl").value;
    const alistUsername = document.getElementById("alistUsername").value;
    const alistPassword = document.getElementById("alistPassword").value;
    const alistHash = await sha256(`${alistPassword}-https://github.com/alist-org/alist`);

    const hashUrl = new URL('/api/auth/login/hash', alistUrl).href;
    fetch(hashUrl, {
      method: 'POST',
      body: `{"username":"${alistUsername}","password":"${alistHash}"}`,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      }
    }).then(async resp => {
      if (!resp.ok) {
        setMessage("resp: " + resp.statusText);
        return;
      }

      const json = await resp.json();
      if (json.code != 200) {
        setMessage("alist err: " + json.message);
        return;
      }

      chrome.storage.sync.set({ alistUrl, alistUsername, alistHash }, () => {
        setMessage("saved!");
      });

    }).catch(err => setMessage("err: " + err.toString()));
  });

  document.getElementById("syncBtn").addEventListener("click", async () => {
    chrome.runtime.sendMessage({ msg: "sync" });
  });

});
