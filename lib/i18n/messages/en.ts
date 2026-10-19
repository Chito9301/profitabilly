// English dictionary — the source of truth for the key structure.
// `Messages` is derived from it, and es.ts is typed with `Messages`, so
// a missing or extra key in either file is a TypeScript error.
// Translated so far: navigation (Mini-Sprint 47), public/auth pages (48),
// Customers (49) and Projects (50-51). Other pages are translated in
// later mini-sprints by adding keys here and in es.ts. Internal values
// (statuses, categories) are never translated here — only the labels
// shown to the user.
export const en = {
  nav: {
    mainLabel: "Main",
    dashboard: "Dashboard",
    projects: "Projects",
    customers: "Customers",
    feedback: "Feedback",
  },
  language: {
    label: "Language",
    english: "English",
    spanish: "Español",
  },
  common: {
    email: "Email",
    status: "Status",
    edit: "Edit",
    delete: "Delete",
    saving: "Saving…",
    deleting: "Deleting…",
    genericError: "Something went wrong. Please try again.",
    name: "Name",
    actions: "Actions",
    saveChanges: "Save changes",
    description: "Description",
    amount: "Amount",
    date: "Date",
    category: "Category",
  },
  customers: {
    title: "Customers",
    add: "Add Customer",
    editTitle: "Edit Customer",
    saveChanges: "Save changes",
    empty: "No customers yet.",
    confirmDelete: "Delete this customer? This can't be undone.",
    created: "Created",
    actions: "Actions",
    addedPrefix: "Added",
    fields: {
      name: "Name",
      company: "Company",
      phone: "Phone",
      address: "Address",
      notes: "Notes",
    },
    // Display labels only; the stored values stay "Active"/"Archived".
    status: {
      Active: "Active",
      Archived: "Archived",
    },
    messages: {
      created: "Customer added.",
      updated: "Customer updated.",
      deleted: "Customer deleted.",
    },
    errors: {
      nameRequired: "Name is required.",
      saveFailed: "Could not save the customer. Please try again.",
      updateFailed:
        "Could not update the customer. It may not exist or you may not have access to it.",
      deleteHasProjects:
        "Cannot delete this customer because it has projects associated with it.",
      deleteFailed: "Could not delete the customer. Please try again.",
      deleteNotFound:
        "Could not delete the customer. It may not exist or you may not have access to it.",
    },
  },
  projects: {
    title: "Projects",
    add: "Add Project",
    editTitle: "Edit Project",
    backToProject: "Project",
    empty: "No projects yet.",
    confirmDelete: "Delete this project? This can't be undone.",
    needCustomer: "You need a customer before adding a project.",
    addCustomerLink: "Add a customer",
    addCustomerSuffix: "first.",
    fields: {
      customer: "Customer",
      selectCustomer: "Select a customer",
      revenue: "Revenue",
      costs: "Costs",
      profit: "Profit",
      margin: "Margin",
    },
    // Display labels only; the stored values stay "Active"/"Completed"/"Archived".
    status: {
      Active: "Active",
      Completed: "Completed",
      Archived: "Archived",
    },
    lifecycle: {
      accept: "Accept Project",
      accepting: "Accepting…",
      complete: "Mark as Completed",
      completing: "Marking as completed…",
    },
    messages: {
      created: "Project added.",
      updated: "Project updated.",
      deleted: "Project deleted.",
    },
    errors: {
      nameRequired: "Name is required.",
      selectCustomer: "Please select a customer.",
      invalidCustomer: "Please select a valid customer.",
      saveFailed: "Could not save the project. Please try again.",
      updateFailed:
        "Could not update the project. It may not exist or you may not have access to it.",
      acceptFailed:
        "Could not accept the project. It may not exist or you may not have access to it.",
      completeFailed:
        "Could not mark the project as completed. It may not exist, may not be Active, or you may not have access to it.",
      deleteHasEntries:
        "Cannot delete this project because it has revenue or costs associated with it.",
      deleteFailed: "Could not delete the project. Please try again.",
      deleteNotFound:
        "Could not delete the project. It may not exist or you may not have access to it.",
    },
  },
  projectDetail: {
    profitabilityCheck: {
      title: "Profitability Check",
      empty: "Add an estimated revenue to see a profitability check for this project.",
      profitable: "Estimated result: profitable.",
      loss: "Estimated result: loss.",
      breakEven: "Estimated result: break-even.",
    },
    stats: {
      estimatedRevenue: "Estimated Revenue",
      estimatedCosts: "Estimated Costs",
      estimatedProfit: "Estimated Profit",
      estimatedMargin: "Estimated Margin",
      estRevenueShort: "Est. Revenue",
      estCostsShort: "Est. Costs",
      estProfitShort: "Est. Profit",
      estMarginShort: "Est. Margin",
      projectedRevenue: "Projected Revenue",
      projectedCosts: "Projected Costs",
      projectedProfit: "Projected Profit",
    },
    sections: {
      actual: "Actual",
      estimated: "Estimated",
      comparison: "Estimated vs Actual",
      difference: "Difference",
      measure: "Measure",
      costVariance: "Cost Variance by Category",
      projectedTitle: "Projected Final Profit",
      projectedIntro: "If the remaining estimate plays out as planned, on top of what has actually happened so far.",
      actionsTitle: "Project actions",
      acceptedOn: "This project was accepted on",
    },
    buttons: {
      addRevenue: "Add Revenue",
      addCost: "Add Cost",
      addEstimatedRevenue: "Add Estimated Revenue",
      addEstimatedCost: "Add Estimated Cost",
      editRevenue: "Edit Revenue",
      editCost: "Edit Cost",
      editEstimatedRevenue: "Edit Estimated Revenue",
      editEstimatedCost: "Edit Estimated Cost",
    },
    empty: {
      revenue: "No revenue entries yet.",
      costs: "No cost entries yet.",
      estimatedRevenue: "No estimated revenue entries yet.",
      estimatedCosts: "No estimated cost entries yet.",
    },
    messages: {
      revenueCreated: "Revenue added.",
      revenueUpdated: "Revenue updated.",
      revenueDeleted: "Revenue deleted.",
      costCreated: "Cost added.",
      costUpdated: "Cost updated.",
      costDeleted: "Cost deleted.",
      estimatedRevenueCreated: "Estimated revenue added.",
      estimatedRevenueUpdated: "Estimated revenue updated.",
      estimatedRevenueDeleted: "Estimated revenue deleted.",
      estimatedCostCreated: "Estimated cost added.",
      estimatedCostUpdated: "Estimated cost updated.",
      estimatedCostDeleted: "Estimated cost deleted.",
      accepted: "Project accepted.",
      completed: "Project marked as completed.",
    },
  },
  entries: {
    confirmDelete: {
      revenue: "Delete this revenue entry? This can't be undone.",
      cost: "Delete this cost entry? This can't be undone.",
      estimatedRevenue: "Delete this estimated revenue? This can't be undone.",
      estimatedCost: "Delete this estimated cost? This can't be undone.",
    },
    categories: {
      Materials: "Materials",
      Labor: "Labor",
      Equipment: "Equipment",
      Subcontractor: "Subcontractor",
      Travel: "Travel",
      Other: "Other",
    },
    validation: {
      descriptionRequired: "Description is required.",
      amountRequired: "Amount is required.",
      amountInvalid: "Enter a valid amount (up to 2 decimal places).",
      amountPositive: "Amount must be greater than zero.",
      dateInvalid: "Enter a valid date.",
      categoryInvalid: "Please select a valid category.",
    },
    errors: {
      invalidProject: "Please select a valid project.",
      revenueSaveFailed: "Could not save the revenue entry. Please try again.",
      revenueUpdateFailed: "Could not update the revenue entry. It may not exist or you may not have access to it.",
      revenueDeleteFailed: "Could not delete the revenue entry. It may not exist or you may not have access to it.",
      costSaveFailed: "Could not save the cost entry. Please try again.",
      costUpdateFailed: "Could not update the cost entry. It may not exist or you may not have access to it.",
      costDeleteFailed: "Could not delete the cost entry. It may not exist or you may not have access to it.",
      estimatedRevenueSaveFailed: "Could not save the estimated revenue. Please try again.",
      estimatedRevenueUpdateFailed: "Could not update the estimated revenue. It may not exist or you may not have access to it.",
      estimatedRevenueDeleteFailed: "Could not delete the estimated revenue. It may not exist or you may not have access to it.",
      estimatedCostSaveFailed: "Could not save the estimated cost. Please try again.",
      estimatedCostUpdateFailed: "Could not update the estimated cost. It may not exist or you may not have access to it.",
      estimatedCostDeleteFailed: "Could not delete the estimated cost. It may not exist or you may not have access to it.",
    },
  },
  home: {
    tagline: "Know exactly how profitable every project or job really is.",
    getStarted: "Get Started",
    login: "Login",
  },
  auth: {
    fields: {
      email: "Email",
      password: "Password",
      fullName: "Full name",
      businessName: "Business name",
      businessType: "Business type",
      country: "Country",
      currency: "Currency",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
    },
    // Display labels only. The values stored in Supabase (and sent by
    // the form) stay the English keys of BUSINESS_TYPES.
    businessTypes: {
      Agency: "Agency",
      Consultant: "Consultant",
      Freelancer: "Freelancer",
      Construction: "Construction",
      Contractor: "Contractor",
      "Service business": "Service business",
      Other: "Other",
    },
    login: {
      title: "Log in",
      forgotPassword: "Forgot password?",
      submit: "Log in",
      submitting: "Logging in…",
      noAccount: "Don't have an account?",
      signUpLink: "Sign up",
    },
    signup: {
      title: "Create your account",
      submit: "Get Started",
      submitting: "Creating account…",
      haveAccount: "Already have an account?",
      loginLink: "Log in",
    },
    forgot: {
      title: "Reset your password",
      intro:
        "Enter the email address associated with your account and we'll send you a reset link.",
      submit: "Send reset link",
      submitting: "Sending…",
      remembered: "Remembered your password?",
      loginLink: "Log in",
    },
    reset: {
      title: "Choose a new password",
      intro: "Enter your new password below.",
      submit: "Update password",
      submitting: "Updating password…",
    },
    linkErrors: {
      recoveryLinkInvalid:
        "This password reset link is invalid or has expired. Request a new one.",
      recoverySessionExpired:
        "Your recovery session has expired. Request a new password reset link.",
    },
    errors: {
      fillAllFields: "Please fill in all fields.",
      passwordMin: "Password must be at least 6 characters.",
      enterEmailPassword: "Please enter your email and password.",
      invalidEmail: "Enter a valid email address.",
      recoveryStart: "We couldn't start password recovery. Please try again.",
      enterConfirmPassword: "Please enter and confirm your new password.",
      passwordsMismatch: "The passwords do not match.",
      incorrectCredentials: "That email or password is incorrect.",
      accountExists:
        "An account with that email already exists. Try logging in instead.",
      confirmEmail: "Please confirm your email address before logging in.",
      rateLimit: "Too many attempts. Please wait a moment and try again.",
      generic: "Something went wrong. Please try again.",
    },
    messages: {
      checkEmail: "Check your email to confirm your account, then log in.",
      profileSaveFailed:
        "Your account was created, but we couldn't save your business details. You're signed in — go to /dashboard to continue.",
      resetSent:
        "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
    },
  },
};

export type Messages = typeof en;
