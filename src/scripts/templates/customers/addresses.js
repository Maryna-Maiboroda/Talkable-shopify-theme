/**
 * Customer Addresses Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the Customer Addresses
 * template.
 *
 * @namespace customerAddresses
 */

const query = 'query countries($locale: SupportedLocale!) {' +
  '  countries(locale: $locale) {' +
  '    name' +
  '    code' +
  '    labels {' +
  '      address1' +
  '      address2' +
  '      city' +
  '      company' +
  '      country' +
  '      firstName' +
  '      lastName' +
  '      phone' +
  '      postalCode' +
  '      zone' +
  '    }' +
  '    formatting {' +
  '      edit' +
  '    }' +
  '    zones {' +
  '      name' +
  '      code' +
  '    }' +
  '  }' +
  '}';

const GRAPHQL_ENDPOINT = 'https://country-service.shopifycloud.com/graphql';

function loadCountries(locale) {
  const response = fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      query,
      operationName: 'countries',
      variables: {
        locale: toSupportedLocale(locale),
      },
    }),
  });

  return response
    .then((res) => { return res.json(); })
    .then((countries) => { return countries.data.countries; });
}

const DEFAULT_LOCALE = 'EN';
const SUPPORTED_LOCALES = [
  'DA',
  'DE',
  'EN',
  'ES',
  'FR',
  'IT',
  'JA',
  'NL',
  'PT',
  'PT_BR',
];

function toSupportedLocale(locale) {
  const supportedLocale = locale.replace(/-/, '_').toUpperCase();

  if (SUPPORTED_LOCALES.indexOf(supportedLocale) !== -1) {
    return supportedLocale;
  } else if (SUPPORTED_LOCALES.indexOf(supportedLocale.substring(0, 2)) !== -1) {
    return supportedLocale.substring(0, 2);
  } else {
    return DEFAULT_LOCALE;
  }
}

function mergeObjects() {
  const to = Object({});

  for (let index = 0; index < arguments.length; index++) {
    const nextSource = arguments[index];

    if (nextSource) {
      for (const nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

const FIELD_REGEXP = /({\w+})/g;
const LINE_DELIMITER = '_';
const INPUT_SELECTORS = {
  lastName: '[name="address[last_name]"]',
  firstName: '[name="address[first_name]"]',
  company: '[name="address[company]"]',
  address1: '[name="address[address1]"]',
  address2: '[name="address[address2]"]',
  country: '[name="address[country]"]',
  zone: '[name="address[province]"]',
  postalCode: '[name="address[zip]"]',
  city: '[name="address[city]"]',
  phone: '[name="address[phone]"]',
};


function AddressForm(rootEl, locale, options) {
  locale = locale || 'en';
  options = options || {inputSelectors: {}};
  const formElements = loadFormElements(
    rootEl,
    mergeObjects(INPUT_SELECTORS, options.inputSelectors),
  );

  validateElements(formElements);

  return loadShippingCountries(options.shippingCountriesOnly).then((
    shippingCountryCodes,
  ) => {
    return loadCountries(locale).then((countries) => {
      init(
        rootEl,
        formElements,
        filterCountries(countries, shippingCountryCodes),
      );
    });
  });
}

/**
 * Runs when countries have been loaded
 */
function init(rootEl, formElements, countries) {
  populateCountries(formElements, countries);
  const selectedCountry = formElements.country.input
    ? formElements.country.input.value
    : null;
  setEventListeners(rootEl, formElements, countries);
  handleCountryChange(rootEl, formElements, selectedCountry, countries);
}

/**
 * Handles when a country change: set labels, reorder fields, populate zones
 */
function handleCountryChange(rootEl, formElements, countryCode, countries) {
  const country = getCountry(countryCode, countries);

  setLabels(formElements, country);
  reorderFields(rootEl, formElements, country);
  populateZones(formElements, country);
}

/**
 * Sets up event listener for country change
 */
function setEventListeners(rootEl, formElements, countries) {
  formElements.country.input.addEventListener('change', (event) => {
    handleCountryChange(rootEl, formElements, event.target.value, countries);
  });
}

/**
 * Reorder fields in the DOM and add data-attribute to fields given a country
 */
const newFormat = '{firstName}{address1}_{lastName}{address2}{zip}_{company}{city}_{phone}{country}{province}';

function reorderFields(rootEl, formElements, country) {
  const formFormat = newFormat;

  const countryWrapper = formElements.country.wrapper;
  let afterCountry = false;

  getOrderedField(formFormat).forEach((row) => {
    row.forEach((line) => {
      formElements[line].wrapper.dataset.lineCount = row.length;
      formElements[line].wrapper.dataset.name = line;
      if (!formElements[line].wrapper) {
        return;
      }
      if (line === 'country') {
        afterCountry = true;
        return;
      }

      if (afterCountry) {
        rootEl.append(formElements[line].wrapper);
      } else {
        rootEl.insertBefore(formElements[line].wrapper, countryWrapper);
      }
    });
  });
}

/**
 * Update labels for a given country
 */
function setLabels(formElements, country) {
  Object.keys(formElements).forEach((formElementName) => {
    formElements[formElementName].labels.forEach((label) => {
      if (country.labels[formElementName] == 'Apartment, suite, etc.'){
        label.textContent = 'Apt';
      } else if (country.labels[formElementName] == 'Postal code'){
        label.textContent = 'Zip code';
      }else{
        label.textContent = country.labels[formElementName];
      }
    });
  });
}

/**
 * Add right countries in the dropdown for a given country
 */
function populateCountries(formElements, countries) {
  const countrySelect = formElements.country.input;
  const duplicatedCountrySelect = countrySelect.cloneNode(true);

  countries.forEach((country) => {
    const optionElement = document.createElement('option');
    optionElement.value = country.code;
    optionElement.textContent = country.name;
    if (countrySelect.dataset.default == country.name) {
      countrySelect.dataset.default = country.code;
    }
    duplicatedCountrySelect.appendChild(optionElement);
  });

  countrySelect.innerHTML = duplicatedCountrySelect.innerHTML;

  if (countrySelect.dataset.default) {
    countrySelect.value = countrySelect.dataset.default;
  }
}

/**
 * Add right zones in the dropdown for a given country
 */
function populateZones(formElements, country) {
  const zoneEl = formElements.zone;
  if (!zoneEl) {
    return;
  }

  if (country.zones.length === 0) {
    zoneEl.wrapper.dataset.ariaHidden = 'true';
    zoneEl.input.innerHTML = '';
    return;
  }

  zoneEl.wrapper.dataset.ariaHidden = 'false';

  const zoneSelect = zoneEl.input;
  const duplicatedZoneSelect = zoneSelect.cloneNode(true);
  duplicatedZoneSelect.innerHTML = '';

  country.zones.forEach((zone) => {
    const optionElement = document.createElement('option');
    optionElement.value = zone.code;
    optionElement.textContent = zone.name;
    duplicatedZoneSelect.appendChild(optionElement);
    if (zoneSelect.dataset.default == zone.name) {
      zoneSelect.dataset.default = zone.code;
    }
  });

  zoneSelect.innerHTML = duplicatedZoneSelect.innerHTML;

  if (zoneSelect.dataset.default) {
    zoneSelect.value = zoneSelect.dataset.default;
  }
}

/**
 * Will throw if an input or a label is missing from the wrapper
 */
function validateElements(formElements) {
  Object.keys(formElements).forEach((elementKey) => {
    const element = formElements[elementKey].input;
    const labels = formElements[elementKey].labels;

    if (!element) {
      return;
    }

    if (typeof element !== 'object') {
      throw new TypeError(
        `${formElements[elementKey]} is missing an input or select.`,
      );
    } else if (typeof labels !== 'object') {
      throw new TypeError(`${formElements[elementKey]} is missing a label.`);
    }
  });
}

/**
 * Given an countryCode (eg. 'CA'), will return the data of that country
 */
function getCountry(countryCode, countries) {
  countryCode = countryCode || 'CA';
  return countries.filter((country) => {
    return country.code === countryCode;
  })[0];
}

/**
 * Given a format (eg. "{firstName}{address1}_{lastName}{address2}{zip}_{company}{city}_{phone}{country}{province}")
 * will return an array of how the form needs to be formatted, eg.:
 * =>
 * [
 *   ['firstName', 'address1'],
 *   ['lastName', 'address2', 'zip'],
 *   ['company', 'city' ],
 *   ['phone', 'country', 'province']
 * ]
 */

function getOrderedField(format) {
  return format.split(LINE_DELIMITER).map((fields) => {
    const result = fields.match(FIELD_REGEXP);
    if (!result) {
      return [];
    }
    return result.map((fieldName) => {
      const newFieldName = fieldName.replace(/[{}]/g, '');


      switch (newFieldName) {
        case 'zip':
          return 'postalCode';
        case 'province':
          return 'zone';
        default:
          return newFieldName;
      }
    });
  });
}

/**
 * Given a rootEl where all `input`s, `select`s, and `labels` are nested, it
 * will returns all form elements (wrapper, input and labels) of the form.
 * See `FormElements` type for details
 */
function loadFormElements(rootEl, inputSelectors) {
  const elements = {};
  Object.keys(INPUT_SELECTORS).forEach((inputKey) => {
    const input = rootEl.querySelector(inputSelectors[inputKey]);
    elements[inputKey] = input
      ? {
        wrapper: input.parentElement,
        input,
        labels: document.querySelectorAll(`[for="${input.id}"]`),
      }
      : {};
  });

  return elements;
}

/**
 * If shippingCountriesOnly is set to true, will return the list of countries the
 * shop ships to. Otherwise returns null.
 */
function loadShippingCountries(shippingCountriesOnly) {
  if (!shippingCountriesOnly) {
    // eslint-disable-next-line no-undef
    return Promise.resolve(null);
  }

  const response = fetch(`${location.origin}/meta.json`);

  return response
    .then((res) => {
      return res.json();
    })
    .then((meta) => {
      // If ships_to_countries has * in the list, it means the shop ships to
      // all countries
      return meta.ships_to_countries.indexOf('*') !== -1
        ? null
        : meta.ships_to_countries;
    })
    .catch(() => {
      return null;
    });
}

/**
 * Only returns countries that are in includedCountryCodes
 * Returns all countries if no includedCountryCodes is passed
 */
function filterCountries(countries, includedCountryCodes) {
  if (!includedCountryCodes) {
    return countries;
  }

  return countries.filter((country) => {
    return includedCountryCodes.indexOf(country.code) !== -1;
  });
}

function scrollIt(element) {
  window.scrollTo({
    behavior: 'smooth',
    left: 0,
    top: element.offsetTop,
  });
}

const hideClass = 'hide';

const addAddressFields = document.querySelector('[data-add-fields-address]');
const addNewAddress = document.querySelector('#address_form_new');
const allEditForms = document.querySelectorAll('[data-address-form]');
const cleanForm = document.querySelector('[data-address-cancel]');

addNewAddress.addEventListener('change', () =>{
  cleanForm.classList.remove(hideClass);
});

cleanForm.addEventListener('click', () =>{
  addNewAddress.reset();
  cleanForm.classList.add(hideClass);
});


AddressForm(addAddressFields, 'en');

function initializeAddressForm(button, formId) {
  const addressForm = document.querySelector(`[data-address-form="${formId}"]`);
  const deleteForm = document.querySelector(`[data-address-delete-form="${formId}"]`);
  const addressFields = document.querySelector(`[data-fields-address="${formId}"]`);
  const cancelButton = document.querySelector(`[data-address-cancel="${formId}"]`);

  button.addEventListener('click', () => {
    addNewAddress.classList.add(hideClass);
    allEditForms.forEach((form) => {
      form.classList.add(hideClass);
    });
    addressForm.classList.remove(hideClass);
    if (window.screen.width < 768) {
      scrollIt(addressForm);
    }
  });

  cancelButton.addEventListener('click', () => {
    addNewAddress.classList.remove(hideClass);
    allEditForms.forEach((form) => {
      form.classList.add(hideClass);
    });
    const editableAddress = button.parentElement;
    if (window.screen.width < 768) {
      scrollIt(editableAddress);
    }
  });

  AddressForm(addressFields, 'en');

  if (deleteForm) {
    deleteForm.addEventListener('submit', (event) => {
      const confirmMessage = deleteForm.getAttribute('data-confirm-message');

      if (!window.confirm(confirmMessage || 'Are you sure you wish to delete this address?')) {
        event.preventDefault();
      }
    });
  }
}

const editAddressButton = document.querySelectorAll('[data-address-toggle]');

if (editAddressButton.length) {
  editAddressButton.forEach((button) => {
    const formId = button.dataset.addressToggle;
    initializeAddressForm(button, formId);
  });
}

