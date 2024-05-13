"use strict";

// To avoid repetitive DOM searches, DOM elements are found and stored once:

const $body = $("body");

const $storiesLoadingMsg = $("#stories-loading-msg");
const $allStoriesList = $("#all-stories-list");
const $favoritedStories = $("#favorited-stories");
const $ownStories = $("#my-stories");
const $storiesContainer = $("#stories-container");

// A selector that locates all three story lists
const $storiesLists = $(".stories-list");

const $loginForm = $("#login-form");
const $signupForm = $("#signup-form");

const $submitForm = $("#submit-form");

const $navSubmitStory = $("#nav-submit-story");
const $navLogin = $("#nav-login");
const $navUserProfile = $("#nav-user-profile");
const $navLogOut = $("#nav-logout");

const $userProfile = $("#user-profile");

/** This function aids in simplifying the display process for individual components by hiding almost all page elements. After calling this, specific components can selectively display what they need. */

function hidePageComponents() {
  const components = [
    $storiesLists,
    $submitForm,
    $loginForm,
    $signupForm,
    $userProfile,
  ];
  components.forEach((component) => component.hide());
}

/** Main function to initialize the application. */

async function start() {
  console.debug("start");

  // Checks for a remembered logged-in user and logs in if credentials are in localStorage
  await checkForRememberedUser();
  await getAndShowStoriesOnStart();

  // Updates the UI if a logged-in user exists
  if (currentUser) updateUIOnUserLogin();
}

// Initiates the app once the DOM is fully loaded

console.warn(
  "HEY STUDENT: This program generates numerous debug messages in the console. If you don't see the message 'start' below, you're missing these helpful debug messages. In your browser console, navigate to the menu 'Default Levels' and include 'Verbose'."
);
$(start);
