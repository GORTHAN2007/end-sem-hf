# Orbit & Observer: SmartCity AI Citizen Dashboard

Welcome to the **Orbit & Observer** project! This is a professional-grade, modern React web application built as an interactive dashboard. It allows users to track the International Space Station (ISS) in real-time, stay updated with the latest spaceflight news, and interact with a context-aware AI Chatbot powered by Mistral-7B.

![Orbit & Observer](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC) ![Vite](https://img.shields.io/badge/Vite-latest-646CFF)

## 🚀 Key Features

### 1. Live ISS Tracking
* **Real-time Map:** Plots the exact current coordinates of the ISS using Leaflet.js and dynamically updates a 15-position trajectory path.
* **Speed Calculation:** Calculates the real-time speed of the ISS (km/h) across trajectory points using the Haversine formula.
* **Speed Trend Visualization:** Displays a live, dynamic Chart.js line graph of the ISS's speed over the last 30 positions.
* **Astronaut Data:** Displays a live feed of the astronauts currently onboard the ISS.

### 2. Spaceflight News Dashboard
* **Live News Feed:** Fetches the absolute latest articles and blogs from the completely free **Spaceflight News API**.
* **Analytics:** Features a dynamic Chart.js Doughnut chart detailing the distribution of articles vs. blogs.
* **Robust Filtering:** Users can search dynamically through news descriptions and sort results alphabetically by source or chronologically by date.
* **Dynamic Grid Layout:** Fully responsive masonry-style grid that guarantees no overlapping or hidden content.

### 3. Context-Aware AI Chatbot
* **Hugging Face Integration:** Uses the powerful `Mistral-7B-Instruct-v0.2` via the Hugging Face Inference Router.
* **Data Context Injection:** The chatbot is "Dashboard-Aware." It receives real-time injected data about the ISS coordinates, speed, onboard astronauts, and the latest news articles in its system prompt.
* **Strict Constraints:** Programmed to only answer queries based *strictly* on the dashboard data it is provided, preventing hallucinations.

### 4. Modern UI & UX
* **Dynamic Theming:** Seamless Light and Dark mode toggling via Tailwind CSS v4 custom variants.
* **Responsive Design:** Completely mobile-friendly.

---

## 🛠️ Technology Stack

* **Core:** React (Vite)
* **Styling:** Tailwind CSS v4
* **Icons:** Lucide React
* **Mapping:** Leaflet & React-Leaflet
* **Charting:** Chart.js & React-Chartjs-2
* **APIs:**
  * [Open-Notify](http://api.open-notify.org/) (ISS Location & Astronauts)
  * [Nominatim](https://nominatim.openstreetmap.org/) (Reverse Geocoding)
  * [Spaceflight News API v4](https://api.spaceflightnewsapi.net/v4/) (Articles & Blogs)
  * [Hugging Face Router API](https://router.huggingface.co/v1/chat/completions) (Mistral-7B Inference)

---

## 📸 Usage Tips
* **Refresh Dashboard Data:** To ensure you're getting live analytics, simply click the "Refresh All" button in the Latest News section or the "Refresh" button in the ISS Tracker section. 
* **Chatting with AI:** Try asking the AI questions like: *"How fast is the ISS going right now?"*, *"Who is currently in space?"*, or *"Summarize the latest Arstechnica article."*

## 📝 License
This project is for educational purposes. Feel free to fork and explore!
