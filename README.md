# Getting Started with Fingerprint

Welcome to the Fingerprint getting started mini series. This repository contains the starting and final code to match the [Getting started with Fingerprint](https://www.youtube.com/playlist?list=PLjhozvP52rLM8nTnOmd0uZKgALygTy4Y5) mini video series.

This series is designed to help you get started with Fingerprint and understand how to use it to identify users. It uses a simple express server and a basic login to demonstrate how Fingerprint can be used to prevent account takeovers and new account fraud. The sample code is meant to be simple and easy to understand the concepts, and is not production ready.

## Prerequisites

- Node.js
- A code editor
- A Fingerprint account ([sign up here](https://dashboard.fingerprint.com/signup))

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/KeshiaRose/fp-getting-started-series.git
```

2. Install the dependencies

```bash
npm install
```

3. Update the .sample.env file with your Fingerprint API keys and save it as .env

```bash
cp .sample.env .env
```

4. Run the project

```bash
npm run dev
```

5. Open the project in your code editor and navigate to http://localhost:8080 in your browser and you're good to go!

## Final Code

The final code for the project can be found in the `final` branch.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
