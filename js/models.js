"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: represents a single story within the system
 */

class Story {
  /** Constructs an instance of Story using provided data:
   *   - {storyId, title, author, url, username, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Extracts the hostname from the URL and returns it. */

  getHostName() {
    return new URL(this.url).host;
  }
}

/******************************************************************************
 * List of Story instances: utilized by UI to display story lists in the DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generates a new StoryList which:
   *
   *  - requests data from the API
   *  - constructs an array of Story instances
   *  - forms a single StoryList instance from that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note the presence of the `static` keyword: this indicates that getStories is
    // **not** an instance method. Instead, it's a method called directly on the
    // class itself. Why doesn't it make sense for getStories to be an
    // instance method?

    // Requests the /stories endpoint (no authentication required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // Converts plain story objects from the API into instances of the Story class
    const stories = response.data.stories.map((story) => new Story(story));

    // Constructs an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to the API, constructs a Story instance, and adds it to the story list.
   * - user: the current User instance who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, { title, author, url }) {
    const token = user.loginToken;
    const response = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: { token, story: { title, author, url } },
    });

    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);

    return story;
  }

  /** Deletes a story from the API and removes it from the story lists.
   *
   * - user: the current User instance
   * - storyId: the ID of the story to remove
   */

  async removeStory(user, storyId) {
    const token = user.loginToken;
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: user.loginToken },
    });

    // Filters out the story whose ID we are removing
    this.stories = this.stories.filter((story) => story.storyId !== storyId);

    // Performs the same operation for the user's list of stories and their favorites
    user.ownStories = user.ownStories.filter((s) => s.storyId !== storyId);
    user.favorites = user.favorites.filter((s) => s.storyId !== storyId);
  }
}

/******************************************************************************
 * User: represents a user within the system (solely used for the current user)
 */

class User {
  /** Constructs a user instance from user data object and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor(
    { username, name, createdAt, favorites = [], ownStories = [] },
    token
  ) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // Instantiates Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // Stores the login token on the user for easy access in API calls.
    this.loginToken = token;
  }

  /** Registers a new user in the API, constructs a User instance, and returns it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** Logs in a user via the API, constructs a User instance, and returns it.
   *
   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      response.data.token
    );
  }

  /** Automatically logs in a user with stored credentials (token & username).
   *   - token: user's login token
   *   - username: user's username
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories,
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** Adds a story to the list of user favorites and updates the API
   * - story: a Story instance to add to favorites
   */

  async addFavorite(story) {
    this.favorites.push(story);
    await this._addOrRemoveFavorite("add", story);
  }

  /** Removes a story from the list of user favorites and updates the API
   * - story: the Story instance to remove from favorites
   */

  async removeFavorite(story) {
    this.favorites = this.favorites.filter((s) => s.storyId !== story.storyId);
    await this._addOrRemoveFavorite("remove", story);
  }

  /** Updates API with favorite/not-favorite.
   *   - newState: "add" or "remove"
   *   - story: Story instance to make favorite / not favorite
   * */

  async _addOrRemoveFavorite(newState, story) {
    const method = newState === "add" ? "POST" : "DELETE";
    const token = this.loginToken;
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: method,
      data: { token },
    });
  }

  /** Returns true/false if given Story instance is a favorite of this user. */

  isFavorite(story) {
    return this.favorites.some((s) => s.storyId === story.storyId);
  }
}
