# Twogether - A Collaborative App for Couples

This is a React-based web application designed to help couples connect through a structured, playful, and collaborative set of activities.

## Features

- **Anonymous Sign-In:** Users are automatically given a unique anonymous ID.
- **Couple Up:** Users can create a new couple by inviting a partner with their User ID, or join an existing couple.
- **Test Mode:** A special mode for developers to act as both partners to test activities.
- **Structured Couple Journey:** Activities now run as a guided sequence rather than random-only start.
- **Interactive Activities:** Includes:
  - 3D Coin Toss
  - Relationship Check-In
  - Collaborative Story Writing
  - Gratitude Exchange
  - Duet Harmonies (two versions)
  - Scripted Scene Voice Acting
- **Journey Journal:** A keepsake journal that saves the results and memories from every completed activity.
- **Real-time Updates:** Built with Firebase Firestore for seamless real-time collaboration.
- **Automated Tests:** Unit tests cover journey flow configuration plus activity turn/completion behavior.

## Project Setup

### Prerequisites

- Node.js and npm (or yarn) installed.
- A Firebase account.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd twogether-app
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    - Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    - Add a new Web App to your project and copy the values from the `firebaseConfig` object.
    - Create a `.env.local` (or `.env`) file in the project root containing:
      ```
      REACT_APP_FIREBASE_API_KEY=your_api_key
      REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
      REACT_APP_FIREBASE_PROJECT_ID=your_project_id
      REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
      REACT_APP_FIREBASE_APP_ID=your_app_id
      ```
    - In the Firebase Console, enable **Anonymous Authentication** and **Firestore Database** (in Production mode).
    - Update your **Firestore Security Rules** with the rules provided in the setup guide.

4.  **Run the application:**
    ```sh
    npm start
    ```
    The app will be available at `http://localhost:3000`.

### Validation Commands

- **Run tests once (CI mode):**
  ```sh
  npm run test:ci
  ```
- **Run full verification (tests + production build):**
  ```sh
  npm run verify
  ```

## File Structure

-   `/public`: Contains the main `index.html` file.
-   `/src`: Contains all the React source code.
    -   `/activities`: Individual components for each mini-game.
    -   `/components`: Reusable components like Modals and Icons.
    -   `/contexts`: React Context providers for Firebase and Couple data.
    -   `/pages`: Top-level components for each "page" of the app (Home, Activities, Journal).
    -   `App.js`: The main app component that handles routing.
    -   `index.js`: The entry point of the React app.
