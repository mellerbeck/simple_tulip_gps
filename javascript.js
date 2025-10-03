(function () {
  const $ = (id) => document.getElementById(id);
  const coordsText = $("coordsText");
  const statusEl = $("status");
  const enableBtn = $("enableBtn");

  // no rounding
  const fmt = (v) => (v == null ? "—" : String(v));
  const setStatus = (t) => (statusEl.textContent = t || "");
  const show = (el, on) => (el.style.display = on ? "" : "none");

  // Optional Tulip prop
  function getProp(name, fallback) {
    try {
      if (typeof getValue === "function") {
        const v = getValue(name);
        return typeof v === "undefined" ? fallback : v;
      }
    } catch (_) {}
    return fallback;
  }

  let watchId = null;

  function updateUI(lat, lon, acc) {
    coordsText.textContent = `lat: ${fmt(lat)}  lon: ${fmt(lon)}${
      acc != null ? `  ±${fmt(acc)}m` : ""
    }`;
  }

  function fire(lat, lon, acc) {
    if (typeof fireEvent === "function") {
      const payload = `lat:${lat} lon:${lon} accuracy:${
        acc ?? ""
      } ts:${new Date().toISOString()}`;
      fireEvent("CoordsChanged", payload); // plain string (not JSON)
    }
  }

  function onGeoOK(pos) {
    const { latitude, longitude, accuracy } = pos.coords || {};
    updateUI(latitude, longitude, accuracy);
    fire(latitude, longitude, accuracy);
    setStatus("");
  }

  function onGeoErr(err) {
    setStatus(
      "Geolocation error: " +
        (err && err.message ? err.message : String(err || "unknown"))
    );
    show(enableBtn, true);
  }

  function startWatch() {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation not supported.");
      return;
    }
    const opts = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 };
    navigator.geolocation.getCurrentPosition(onGeoOK, onGeoErr, opts);
    if (watchId === null) {
      watchId = navigator.geolocation.watchPosition(onGeoOK, onGeoErr, opts);
    }
    show(enableBtn, false);
    setStatus("Listening for location…");
  }

  function init() {
    show(enableBtn, false);
    enableBtn.addEventListener("click", startWatch);

    const autostart = !!getProp("autostart", true);
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation not supported.");
      return;
    }

    if (!autostart) {
      show(enableBtn, true);
      setStatus("Click Enable Location to begin.");
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((res) => {
          if (res.state === "granted" || res.state === "prompt") {
            startWatch();
          } else {
            show(enableBtn, true);
            setStatus(
              "Location permission denied. Click Enable after allowing."
            );
          }
        })
        .catch(startWatch);
    } else {
      startWatch();
    }
  }

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
