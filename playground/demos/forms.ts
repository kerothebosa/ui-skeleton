// @ts-nocheck
import {
  fetchJson,
  renderComparePanels,
  setNodeText,
  toQuery,
  withNoPackageLoad
} from "./common.ts";

const formBody = (mode = "") => `
  <h4>${mode}</h4>
  <form data-form="${mode}" class="form-grid">
    <label>
      Full name
      <input name="name" required placeholder="Ada Lovelace" />
    </label>
    <label>
      Email
      <input name="email" type="email" required placeholder="ada@example.com" />
    </label>
    <label>
      Country
      <select name="country" required>
        <option value="">Select country...</option>
      </select>
    </label>
    <label>
      City
      <select name="city" required disabled>
        <option value="">Select city...</option>
      </select>
    </label>
    <label>
      Postal code
      <input name="postalCode" required placeholder="10001" />
    </label>
  </form>
  <p data-role="${mode}-email-status">Email check: idle</p>
  <p data-role="${mode}-submit-status">Submit: idle</p>
`;

export const mountFormsDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Form workflow with async dependent fields and submission checks in both labs.",
    code: "FRM-CMP-03",
    controlsHtml: `
      <div class="control-grid">
        <button type="button" data-action="validate">FRM-VAL-14</button>
        <button type="button" data-action="submit">FRM-SUB-24</button>
        <button type="button" data-action="slow-submit">FRM-SLOW-34</button>
        <button type="button" data-action="force-error">FRM-ERR-44</button>
        <button type="button" data-action="telemetry">FRM-TLM-54</button>
      </div>
    `,
    withSurfaceId: "forms-with-surface",
    withoutSurfaceId: "forms-without-surface",
    withBodyHtml: formBody("with"),
    withoutBodyHtml: formBody("without")
  });

  const listeners = [];
  const withForm = mountNode.querySelector('[data-form="with"]');
  const withoutForm = mountNode.querySelector('[data-form="without"]');
  const withEmailStatus = mountNode.querySelector('[data-role="with-email-status"]');
  const withoutEmailStatus = mountNode.querySelector('[data-role="without-email-status"]');
  const withSubmitStatus = mountNode.querySelector('[data-role="with-submit-status"]');
  const withoutSubmitStatus = mountNode.querySelector('[data-role="without-submit-status"]');

  const addListener = (node = null, eventName = "", handler = () => {}) => {
    if (!node || !eventName) {
      return;
    }
    node.addEventListener(eventName, handler);
    listeners.push(() => {
      node.removeEventListener(eventName, handler);
    });
  };

  const setSubmitStatus = (message = "") => {
    setNodeText(withSubmitStatus, `Submit: ${message}`);
    setNodeText(withoutSubmitStatus, `Submit: ${message}`);
    ctx.setGlobalStatus(message);
  };

  const populateCountries = (form = null, countries = []) => {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const countrySelect = form.querySelector('select[name="country"]');
    if (!(countrySelect instanceof HTMLSelectElement)) {
      return;
    }
    countrySelect.innerHTML = '<option value="">Select country...</option>';
    countries.forEach((country = {}) => {
      const option = document.createElement("option");
      option.value = country.code ?? "";
      option.textContent = country.name ?? country.code ?? "Unknown";
      countrySelect.append(option);
    });
  };

  const populateCities = (form = null, cities = []) => {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const citySelect = form.querySelector('select[name="city"]');
    if (!(citySelect instanceof HTMLSelectElement)) {
      return;
    }
    citySelect.innerHTML = '<option value="">Select city...</option>';
    cities.forEach((city = "") => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.append(option);
    });
    citySelect.disabled = cities.length === 0;
  };

  const applyDraft = (form = null) => {
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    const name = form.querySelector('input[name="name"]');
    const email = form.querySelector('input[name="email"]');
    const postal = form.querySelector('input[name="postalCode"]');
    if (name) name.value = "Ada Lovelace";
    if (email) email.value = "ada+lab@example.com";
    if (postal) postal.value = "10001";
  };

  const loadCountries = async () => {
    try {
      const [withData, withoutData] = await Promise.all([
        fetchJson("/api/forms/countries?delay=220"),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson("/api/forms/countries?delay=220"))
      ]);
      populateCountries(withForm, withData.countries ?? []);
      populateCountries(withoutForm, withoutData.countries ?? []);
      setSubmitStatus("Countries loaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmitStatus(`Country load failed (${message})`);
    }
  };

  const loadCities = async () => {
    if (!(withForm instanceof HTMLFormElement) || !(withoutForm instanceof HTMLFormElement)) {
      return;
    }
    const withCountry = withForm.querySelector('select[name="country"]')?.value ?? "";
    const withoutCountry = withoutForm.querySelector('select[name="country"]')?.value ?? "";
    try {
      const [withData, withoutData] = await Promise.all([
        fetchJson(`/api/forms/cities?${toQuery({ country: withCountry, delay: 420 })}`),
        withNoPackageLoad(surfaces?.withoutSurface, () =>
          fetchJson(`/api/forms/cities?${toQuery({ country: withoutCountry, delay: 420 })}`)
        )
      ]);
      populateCities(withForm, withData.cities ?? []);
      populateCities(withoutForm, withoutData.cities ?? []);
      setSubmitStatus("Cities loaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmitStatus(`City load failed (${message})`);
    }
  };

  const validateEmailPair = async () => {
    if (!(withForm instanceof HTMLFormElement) || !(withoutForm instanceof HTMLFormElement)) {
      return;
    }
    const withEmail = withForm.querySelector('input[name="email"]')?.value ?? "";
    const withoutEmail = withoutForm.querySelector('input[name="email"]')?.value ?? "";
    setNodeText(withEmailStatus, "Email check: validating");
    setNodeText(withoutEmailStatus, "Email check: validating");
    try {
      const [withResult, withoutResult] = await Promise.all([
        fetchJson(`/api/forms/validate-email?${toQuery({ email: withEmail, delay: 180 })}`),
        withNoPackageLoad(surfaces?.withoutSurface, () =>
          fetchJson(`/api/forms/validate-email?${toQuery({ email: withoutEmail, delay: 180 })}`)
        )
      ]);
      setNodeText(withEmailStatus, `Email check: ${withResult.message ?? "done"}`);
      setNodeText(withoutEmailStatus, `Email check: ${withoutResult.message ?? "done"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNodeText(withEmailStatus, `Email check failed: ${message}`);
      setNodeText(withoutEmailStatus, `Email check failed: ${message}`);
    }
  };

  const formPayload = (form = null) => {
    if (!(form instanceof HTMLFormElement)) {
      return {};
    }
    const data = new FormData(form);
    return {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      country: String(data.get("country") ?? ""),
      city: String(data.get("city") ?? ""),
      postalCode: String(data.get("postalCode") ?? "")
    };
  };

  const submitPair = async (mode = "normal") => {
    const base = mode === "slow" ? { delay: 1_550 } : { delay: 450 };
    const forced = mode === "error" ? { status: 422 } : {};
    const query = toQuery({ ...base, ...forced });
    setSubmitStatus(`Submitting (${mode})`);

    try {
      const [withResult, withoutResult] = await Promise.all([
        fetchJson(`/api/forms/submit?${query}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formPayload(withForm))
        }),
        withNoPackageLoad(surfaces?.withoutSurface, () =>
          fetchJson(`/api/forms/submit?${query}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formPayload(withoutForm))
          })
        )
      ]);
      setNodeText(withSubmitStatus, `Submit: ${withResult.message ?? "submitted"}`);
      setNodeText(withoutSubmitStatus, `Submit: ${withoutResult.message ?? "submitted"}`);
      setSubmitStatus(`Submit ${mode} complete`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmitStatus(`Submit ${mode} failed (${message})`);
      setNodeText(withSubmitStatus, `Submit: failed (${message})`);
      setNodeText(withoutSubmitStatus, `Submit: failed (${message})`);
    }
  };

  const telemetryPair = () => {
    void fetch("/api/telemetry?delay=600", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "forms-with-package", code: "FRM-TLM-W", ts: Date.now() })
    });
    void fetch("/api/telemetry?delay=600", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "forms-without-package", code: "FRM-TLM-N", ts: Date.now() })
    });
    setSubmitStatus("Telemetry sent (should not trigger form skeleton filter)");
  };

  ctx.createEnhancer({
    skeletonSelector: "#forms-with-surface",
    shouldHandleRequest: ({ url }) => {
      return url.includes("/api/forms/");
    }
  });

  addListener(mountNode.querySelector('[data-action="validate"]'), "click", () => {
    void validateEmailPair();
  });
  addListener(mountNode.querySelector('[data-action="submit"]'), "click", () => {
    void submitPair("normal");
  });
  addListener(mountNode.querySelector('[data-action="slow-submit"]'), "click", () => {
    void submitPair("slow");
  });
  addListener(mountNode.querySelector('[data-action="force-error"]'), "click", () => {
    void submitPair("error");
  });
  addListener(mountNode.querySelector('[data-action="telemetry"]'), "click", () => {
    telemetryPair();
  });
  addListener(withForm?.querySelector('select[name="country"]'), "change", () => {
    void loadCities();
  });
  addListener(withoutForm?.querySelector('select[name="country"]'), "change", () => {
    void loadCities();
  });

  applyDraft(withForm);
  applyDraft(withoutForm);
  setSubmitStatus("Forms compare ready");
  setNodeText(withEmailStatus, "Email check: idle");
  setNodeText(withoutEmailStatus, "Email check: idle");
  void loadCountries();

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    ctx.disposeEnhancer();
  };
};
