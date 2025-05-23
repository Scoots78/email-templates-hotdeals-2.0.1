# EmailFeatured - Promotional Email Generator

This project is a Node.js application that generates HTML email templates for restaurant promotions. It allows users to select various criteria such as region, city, suburb, and featured restaurant details to create customized promotional emails. The application fetches promotion data from an external API and populates a base HTML template with this information.

## Features

- Generates dynamic HTML email templates.
- Fetches up-to-date restaurant promotions from an external API (`restauranthub.co.nz`).
- Allows users to customize featured restaurant details (name, description, image, heading, URL, etc.).
- Filters promotions based on geographical location (region, city, suburb).
- Provides an interface to select the type of promotion.
- Automatically saves generated HTML email files to the `public/email-output/` directory.
- Simple web interface for generating emails.

## Setup and Installation

To set up and run this project locally, you'll need Node.js and npm (Node Package Manager) installed on your system.

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    ```
    (Replace `<repository_url>` with the actual URL of the repository)

2.  **Navigate to the project directory:**
    ```bash
    cd emailfeatured
    ```

3.  **Install dependencies:**
    Run the following command to install the necessary packages defined in `package.json`:
    ```bash
    npm install
    ```

## Running the Application

Once the dependencies are installed, you can start the application server:

1.  **Start the server:**
    ```bash
    node app.js
    ```

2.  **Access the application:**
    Open your web browser and navigate to:
    `http://localhost:3001/`

    This will load the main interface (`public/selection.html`) where you can generate the promotional emails. The server will log "Server running at http://localhost:3001" to the console when it starts successfully.

## How to Use

1.  **Open the application:** Launch your web browser and go to `http://localhost:3001/`.
2.  **Fill in the details:** The page (`public/selection.html`) will display a form. Fill in the required information:
    *   Select Region, City, and Suburb from the dropdown menus.
    *   Choose a Promotion Type.
    *   Enter details for the Featured Restaurant:
        *   Name
        *   Description
        *   Image URL (link to an image for the featured restaurant)
        *   Heading
        *   Sub-Header
        *   URL for the featured restaurant's promotion
    *   Optionally, customize:
        *   Email Body Icon URL
        *   Title for Additional Restaurants section
        *   Number of Additional Restaurants to display
        *   Width of the Email Body Icon
        *   Padding for the Featured Image
3.  **Generate Promotions:** Click the "Generate Promotions" button (or similar, based on the actual button text in `selection.html`).
4.  **View Output:** The application will process your request, fetch relevant promotions, and generate an HTML email. You will be redirected to the generated email page.
5.  **Find Saved File:** The generated HTML file is also saved in the `public/email-output/` directory within the project. The filename is dynamically created based on the inputs (e.g., `FeaturedRestaurantName_Region_City_PromotionType.html`).

## Project Structure

Here's a brief overview of the key files and directories in the project:

```
emailfeatured/
├── app.js                      # Main Express application file, contains server logic and API endpoints.
├── package.json                # NPM package metadata, including dependencies and scripts.
├── data/
│   └── locations.json          # JSON file containing regions, cities, and suburbs data.
├── public/                     # Directory for static assets accessible by clients.
│   ├── selection.html          # The main HTML page with the form for generating promotional emails.
│   ├── email-output/           # Default directory where generated HTML email files are saved.
│   ├── images/                 # Contains images used in the project (e.g., restaurant logos).
│   └── styles.css              # CSS styles for the application.
├── template.html               # The base HTML template used for generating promotional emails.
└── README.md                   # This file.
```

## Dependencies

The main dependencies for this project are listed in the `package.json` file. Key dependencies include:

-   **Express.js**: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. Used for routing and handling HTTP requests.
-   **body-parser**: Node.js body parsing middleware. It's used to parse incoming request bodies, making it easier to handle form data. (Note: `express` now includes `bodyParser` capabilities, but it might be listed as a direct dependency if the project was set up some time ago or for explicit clarity).
-   **ipaddr.js**: A small library for working with IP addresses in Node.js.
-   **proxy-addr**: A utility for determining the "real" client IP address when behind a proxy.

You can find all dependencies by checking the `dependencies` section in the `package.json` file.
