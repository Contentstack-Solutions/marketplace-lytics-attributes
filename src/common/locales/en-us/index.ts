const localeTexts = {
  ConfigScreen: {
    title: "Lytics Attributes Configuration",
    description:
      "Configure your Lytics API connection to enable attribute browsing and selection.",
    lyticsSection: {
      title: "Lytics API Connection",
      apiTokenLabel: "Lytics API Token",
      apiTokenPlaceholder: "Enter your Lytics API token",
      apiTokenHelp:
        "Optional. When provided, editors can browse and select attributes from your Lytics account instead of typing slugs manually.",
      connectionSuccess: "Connected — found {count} attributes",
      connectionError: "Connection failed: {error}",
      connectionTesting: "Testing connection...",
    },
    defaultsSection: {
      title: "Default Values",
      enableDefaultsLabel: "Enable default values",
      enableDefaultsHelp:
        'When enabled, tokens with the syntax {{attribute|default}} will use the default value if the attribute is empty. When disabled, the default portion is ignored.',
    },
    saveHint: 'Click "Save" to apply your configuration.',
  },
  CustomField: {
    title: "Lytics Attributes",
    body: "Type content with attribute tokens using {{attribute_name}} or {{attribute_name|default}} syntax.",
    placeholder:
      "e.g. Welcome back, {{first_name|visitor}}! You have {{num_visits}} visits.",
    insertAttribute: "Insert Attribute",
    noConfig:
      "No Lytics API token configured. You can still type attribute tokens manually.",
    button: {
      text: "Learn More",
      url: "https://www.contentstack.com/docs/developers/developer-hub/custom-field-location/",
    },
  },
  AttributePicker: {
    title: "Insert Lytics Attribute",
    search: "Search attributes...",
    noResults: "No attributes match your search.",
    noAttributes: "No attributes available. Check your Lytics API token.",
    loading: "Loading attributes...",
    defaultValueLabel: "Default value (optional)",
    defaultValuePlaceholder: "Fallback if attribute is empty",
    insert: "Insert",
    cancel: "Cancel",
  },
  AppFailed: {
    Message1: "The App was loaded outside Contentstack Dashboard.",
    Message2:
      "Please navigate to Your Stack in Contentstack where you just installed the Application ",
    body: "For Assistance, please reach out to us at support@contentstack.com",
    button: {
      text: "Learn More",
      url: "https://www.contentstack.com/docs/developers/developer-hub/marketplace-app-boilerplate/",
    },
  },
};

export default localeTexts;
