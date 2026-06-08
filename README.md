# EcoPulse | Carbon Footprint Awareness & Tracking Platform

EcoPulse is a state-of-the-art, highly interactive single-page application (SPA) designed to empower individuals to understand, track, and reduce their carbon footprint. By combining real-time calculations with personalized recommendations and gamified habit building, EcoPulse turns complex environmental science into actionable micro-habits.

## 🎯 Chosen Challenge Vertical
**The Everyday Eco-Conscious Citizen**
This solution is tailored for urban and suburban individuals who want to balance transport, household utility bills, diet choices, and shopping habits to decrease their net carbon impact. 

---

## 💡 System Design & Approach

EcoPulse is built on a responsive, serverless, front-end architecture designed for lightning-fast loads and modern aesthetics:
*   **Reactive UI**: Built using semantic HTML5 and vanilla JavaScript. Slider and select dropdown inputs update the calculation engine instantly.
*   **Vibrant Visuals**: Custom SVG gauges and CSS layout transitions visualize the carbon breakdown (Transit, Energy, Lifestyle).
*   **Gamified Habitation**:
    *   **Action Checklist**: Users commit to mid-to-long-term habit adjustments and see potential annual CO₂e reductions in real-time.
    *   **Daily Green Ledger**: A logbook where users record daily eco-actions, earn "Eco-Points," and build a daily streak.
*   **Local Persistence**: All settings, committed actions, and ledger entries are synchronized with `localStorage` so user data persists across page refreshes.

---

## 🧮 Emission Calculation Logic & Formulas

The platform utilizes carbon emission conversion factors sourced from standard averages provided by the **EPA (US Environmental Protection Agency)** and **DEFRA (UK Department for Environment, Food & Rural Affairs)**. 

All outputs are converted to **Metric Tons of CO₂ equivalent (Tons CO₂e) per year**.

### 1. Transportation Formula
*   **Car Emissions**: 
    $$\text{Annual Miles} = \text{Weekly Miles} \times 52$$
    $$\text{CO}_2\text{ (Tons)} = \frac{\text{Annual Miles} \times 0.38 \times \text{Fuel Modifier}}{1000}$$
    *   *Fuel Modifiers*: Medium Petrol = $1.0$, Large SUV = $1.35$, Hybrid = $0.45$, Electric = $0.15$.
*   **Public Transit**: 
    $$\text{CO}_2\text{ (Tons)} = \frac{\text{Weekly Hours} \times 25 \text{ mph} \times 52 \times 0.08\text{ kg/mile}}{1000}$$
*   **Flights**: 
    $$\text{CO}_2\text{ (Tons)} = \frac{\text{Flights/Year} \times 350\text{ kg CO}_2}{1000}$$

### 2. Home Energy Formula
Emissions from home utilities are calculated based on monthly costs, normalized by the household occupant count:
$$\text{Electricity CO}_2\text{ (Tons)} = \frac{(\text{Monthly Bill} \times 12 \times 0.35\text{ kg/\$} \times \text{Grid Modifier})}{\text{Household Size} \times 1000}$$
*   *Grid Modifiers*: Standard Mix = $1.0$, 50% Green Mix = $0.5$, 100% Renewable/Solar = $0.05$.
$$\text{Natural Gas CO}_2\text{ (Tons)} = \frac{(\text{Monthly Bill} \times 12 \times 0.60\text{ kg/\$})}{\text{Household Size} \times 1000}$$

### 3. Diet & Lifestyle Formula
*   **Diet**: Set annual carbon cost based on consumption profile:
    *   *Meat Lover*: $2.9\text{ Tons}$
    *   *Average Meat Eater*: $1.7\text{ Tons}$
    *   *Vegetarian*: $1.1\text{ Tons}$
    *   *Vegan*: $0.65\text{ Tons}$
*   **Waste**: Set annual carbon cost based on recycling practices:
    *   *High (No sorting)*: $0.8\text{ Tons}$
    *   *Medium (Average sorting)*: $0.4\text{ Tons}$
    *   *Low (Zero waste/Compost)*: $0.15\text{ Tons}$
*   **Shopping**: 
    $$\text{CO}_2\text{ (Tons)} = \frac{\text{Monthly Spend} \times 12 \times 0.15\text{ kg/\$}}{1000}$$

---

## 📝 Key Assumptions Made
1.  **Public Transit Speed**: Assumed an average commuting transit speed of $25\text{ mph}$ to map transit hours to transit miles.
2.  **Average Flight Duration**: Assumed average flights represent standard continental roundtrips generating $350\text{ kg}$ of CO₂ per flight.
3.  **Cost-to-Energy Mapping**: Assumed average utility pricing to map monthly spending direct to consumption ($0.35\text{ kg per \$}$ electricity, $0.60\text{ kg per \$}$ natural gas).
4.  **Carbon Sequestration**: Assumed a mature tree absorbs approximately $22\text{ kg}$ ($0.022\text{ Tons}$) of CO₂ per year for offset visualization.

---

## 🚀 How to Run Locally

1.  **Clone the Repository**:
    ```bash
    git clone <YOUR_PUBLIC_REPOSITORY_LINK>
    cd carbon-footprints
    ```
2.  **Run with Local Dev Server**:
    Use any basic HTTP server. For example, using Python:
    ```bash
    python -m http.server 8000
    ```
    Or Node.js `http-server`:
    ```bash
    npx http-server public
    ```
3.  Open `http://localhost:8000` in your web browser.
