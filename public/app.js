// ==========================================
// EcoPulse Application Logic & State
// ==========================================

// Global Application State
let state = {
  // Input Values
  inputs: {
    driveMiles: 120,
    carType: 'medium-petrol',
    transitHours: 4,
    flightsYear: 2,
    electricityBill: 80,
    energySource: 'standard',
    gasBill: 50,
    householdSize: 2,
    diet: 'medium-meat',
    waste: 'medium',
    shoppingSpend: 150
  },
  // Selected Action Plan reduction checkboxes
  committedActions: [],
  // Daily Green Ledger entries
  ledger: [],
  // Gamification metrics
  points: 0,
  streak: 0,
  lastLoggedDate: null
};

// Static Recommendation Action Items
const RECOMMENDATIONS = [
  { id: 'act-carpool', title: 'Carpool or work remotely 2 days/week', reduction: 1.2, category: 'transit' },
  { id: 'act-thermostat', title: 'Lower thermostat by 2°F in winter / raise in summer', reduction: 0.5, category: 'energy' },
  { id: 'act-meatless', title: 'Commit to "Meatless Mondays" (reduce meat by 15%)', reduction: 0.3, category: 'lifestyle' },
  { id: 'act-coldwash', title: 'Wash clothes in cold water & air dry', reduction: 0.2, category: 'energy' },
  { id: 'act-leds', title: 'Upgrade all home bulbs to smart LEDs', reduction: 0.15, category: 'energy' },
  { id: 'act-flight', title: 'Replace 1 short-haul flight with train travel', reduction: 0.35, category: 'transit' },
  { id: 'act-zerowaste', title: 'Compost kitchen scraps & eliminate single-use plastics', reduction: 0.3, category: 'lifestyle' }
];

// ==========================================
// Initialization & Startup
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  injectSvgGradients();
  setupEventListeners();
  renderRecommendations();
  calculateEmissions();
  renderLedger();
});

// Load state from LocalStorage
function loadState() {
  const saved = localStorage.getItem('ecopulse_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge saved state over default state structure
      state = { ...state, ...parsed };
      
      // Update DOM values to match loaded inputs
      document.getElementById('input-drive-miles').value = state.inputs.driveMiles;
      document.getElementById('select-car-type').value = state.inputs.carType;
      document.getElementById('input-transit-hours').value = state.inputs.transitHours;
      document.getElementById('input-flights-year').value = state.inputs.flightsYear;
      document.getElementById('input-electricity').value = state.inputs.electricityBill;
      document.getElementById('select-energy-source').value = state.inputs.energySource;
      document.getElementById('input-gas').value = state.inputs.gasBill;
      document.getElementById('select-home-size').value = state.inputs.householdSize;
      document.getElementById('select-diet').value = state.inputs.diet;
      document.getElementById('select-waste').value = state.inputs.waste;
      document.getElementById('input-shopping').value = state.inputs.shoppingSpend;

      // Update text indicators
      document.getElementById('val-drive-miles').textContent = state.inputs.driveMiles;
      document.getElementById('val-transit-hours').textContent = state.inputs.transitHours;
      document.getElementById('val-flights-year').textContent = state.inputs.flightsYear;
      document.getElementById('val-electricity').textContent = `$${state.inputs.electricityBill}`;
      document.getElementById('val-gas').textContent = `$${state.inputs.gasBill}`;
      document.getElementById('val-shopping').textContent = `$${state.inputs.shoppingSpend}`;
    } catch (e) {
      console.error('Error parsing saved state:', e);
    }
  }
}

// Save state to LocalStorage
function saveState() {
  localStorage.setItem('ecopulse_state', JSON.stringify(state));
  // Update header widgets
  document.getElementById('total-points').textContent = state.points;
  document.getElementById('streak-count').textContent = state.streak;
}

// Dynamically inject the SVG color gradient definition
function injectSvgGradients() {
  const svg = document.querySelector('.circular-chart');
  if (svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="green-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
  }
}

// ==========================================
// Calculation Engine
// ==========================================
function calculateEmissions() {
  const i = state.inputs;

  // 1. TRANSPORT CALCULATION (Annual Tons CO2e)
  // Car travel: annual miles = weekly * 52. Modified by fuel/efficiency standard
  let carModifier = 1.0;
  if (i.carType === 'large-petrol') carModifier = 1.35;
  if (i.carType === 'hybrid') carModifier = 0.45;
  if (i.carType === 'electric') carModifier = 0.15;
  
  const annualCarMiles = i.driveMiles * 52;
  const carCO2Kg = annualCarMiles * 0.38 * carModifier; // 0.38kg CO2 per mile base

  // Public Transit: weekly hours * average speed 25mph * 52 weeks * 0.1kg CO2/mile
  const annualTransitMiles = i.transitHours * 25 * 52;
  const transitCO2Kg = annualTransitMiles * 0.08;

  // Flights: average flight takes 2.5 hours and produces ~0.35 Tons (350kg) per flight
  const flightCO2Kg = i.flightsYear * 350;

  const transportTons = (carCO2Kg + transitCO2Kg + flightCO2Kg) / 1000;

  // 2. ENERGY CALCULATION (Annual Tons CO2e per person)
  // Electricity: monthly spend * 12. Base factor 0.35kg per dollar.
  let energySourceModifier = 1.0;
  if (i.energySource === 'green-50') energySourceModifier = 0.5;
  if (i.energySource === 'green-100') energySourceModifier = 0.05;
  
  const annualElectricityCO2 = (i.electricityBill * 12 * 0.35 * energySourceModifier);

  // Natural Gas: monthly spend * 12. Factor 0.6kg per dollar.
  const annualGasCO2 = (i.gasBill * 12 * 0.6);

  // Divide total home emissions by household size
  const totalHomeCO2 = (annualElectricityCO2 + annualGasCO2);
  const energyTons = (totalHomeCO2 / i.householdSize) / 1000;

  // 3. DIET & LIFESTYLE CALCULATION (Annual Tons CO2e)
  // Diet base values
  let dietCO2 = 1.7; // default average
  if (i.diet === 'heavy-meat') dietCO2 = 2.9;
  if (i.diet === 'vegetarian') dietCO2 = 1.1;
  if (i.diet === 'vegan') dietCO2 = 0.65;

  // Waste values
  let wasteCO2 = 0.4; // default medium
  if (i.waste === 'high') wasteCO2 = 0.8;
  if (i.waste === 'low') wasteCO2 = 0.15;

  // Non-essential Shopping: annual spend * 0.15kg per dollar
  const shoppingCO2 = (i.shoppingSpend * 12 * 0.15) / 1000;

  const lifestyleTons = dietCO2 + wasteCO2 + shoppingCO2;

  // 4. TOTAL CO2 CALCULATED
  const totalCO2 = transportTons + energyTons + lifestyleTons;

  // Update UI Elements
  document.getElementById('lbl-total-co2').textContent = totalCO2.toFixed(1);
  
  // Update Breakdown Labels
  document.getElementById('lbl-breakdown-transit').textContent = `${transportTons.toFixed(1)} T`;
  document.getElementById('lbl-breakdown-energy').textContent = `${energyTons.toFixed(1)} T`;
  document.getElementById('lbl-breakdown-lifestyle').textContent = `${lifestyleTons.toFixed(1)} T`;

  // Update Breakdown Progress Bars
  const maxCategoryCap = Math.max(transportTons, energyTons, lifestyleTons, 4.0);
  document.getElementById('fill-breakdown-transit').style.width = `${(transportTons / maxCategoryCap) * 100}%`;
  document.getElementById('fill-breakdown-energy').style.width = `${(energyTons / maxCategoryCap) * 100}%`;
  document.getElementById('fill-breakdown-lifestyle').style.width = `${(lifestyleTons / maxCategoryCap) * 100}%`;

  // Equivalents Calculation
  // 1 tree absorbs ~22kg (0.022 tons) of CO2 per year
  const treesRequired = Math.ceil(totalCO2 / 0.022);
  // 1 gallon of gasoline produces ~8.88kg (0.00888 tons) of CO2
  const gasolineGallons = Math.ceil(totalCO2 / 0.00888);

  document.getElementById('lbl-eq-trees').textContent = treesRequired.toLocaleString();
  document.getElementById('lbl-eq-gasoline').textContent = gasolineGallons.toLocaleString();

  // Donut Gauge Arc length update
  // standard target average is around 8 Tons. Gauge maxes at 20 Tons.
  const percent = Math.min((totalCO2 / 20) * 100, 100);
  const gaugeElement = document.getElementById('gauge-progress');
  gaugeElement.strokeDasharray = `${percent}, 100`;

  // Set Rating Badge status
  const ratingBadge = document.getElementById('co2-rating');
  ratingBadge.className = 'rating-badge'; // reset
  if (totalCO2 < 4.0) {
    ratingBadge.textContent = 'Excellent (Low Impact)';
    ratingBadge.classList.add('rating-green');
  } else if (totalCO2 <= 10.0) {
    ratingBadge.textContent = 'Moderate (Eco-Conscious)';
    ratingBadge.classList.add('rating-yellow');
  } else {
    ratingBadge.textContent = 'High Carbon Footprint';
    ratingBadge.classList.add('rating-red');
  }

  // Save the state inputs
  saveState();
}

// ==========================================
// Event Listeners Configuration
// ==========================================
function setupEventListeners() {
  
  // Real-time Slider Value updates & calculations
  const sliders = [
    { id: 'input-drive-miles', valId: 'val-drive-miles', suffix: '', key: 'driveMiles' },
    { id: 'input-transit-hours', valId: 'val-transit-hours', suffix: '', key: 'transitHours' },
    { id: 'input-flights-year', valId: 'val-flights-year', suffix: '', key: 'flightsYear' },
    { id: 'input-electricity', valId: 'val-electricity', prefix: '$', key: 'electricityBill' },
    { id: 'input-gas', valId: 'val-gas', prefix: '$', key: 'gasBill' },
    { id: 'input-shopping', valId: 'val-shopping', prefix: '$', key: 'shoppingSpend' }
  ];

  sliders.forEach(slider => {
    const el = document.getElementById(slider.id);
    const label = document.getElementById(slider.valId);
    
    el.addEventListener('input', (e) => {
      let val = e.target.value;
      if (slider.prefix) val = slider.prefix + val;
      if (slider.suffix) val = val + slider.suffix;
      label.textContent = val;
      
      // Update state and recalculate
      state.inputs[slider.key] = parseFloat(e.target.value);
      calculateEmissions();
    });
  });

  // Select dropdown events
  const selects = [
    { id: 'select-car-type', key: 'carType' },
    { id: 'select-energy-source', key: 'energySource' },
    { id: 'select-home-size', key: 'householdSize' },
    { id: 'select-diet', key: 'diet' },
    { id: 'select-waste', key: 'waste' }
  ];

  selects.forEach(sel => {
    const el = document.getElementById(sel.id);
    el.addEventListener('change', (e) => {
      let val = e.target.value;
      if (sel.key === 'householdSize') val = parseInt(val);
      state.inputs[sel.key] = val;
      calculateEmissions();
    });
  });

  // Dashboard Tabs switcher
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      document.getElementById(target).classList.add('active');
    });
  });

  // Modal Open/Close Event Handlers
  const modal = document.getElementById('action-modal');
  const btnOpenModal = document.getElementById('btn-add-action-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const formAction = document.getElementById('action-form');
  const selectTemplate = document.getElementById('select-action-template');
  const customFields = document.getElementById('custom-action-fields');

  btnOpenModal.addEventListener('click', () => {
    // Set default date input to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('input-action-date').value = today;
    
    modal.classList.add('active');
  });

  btnCloseModal.addEventListener('click', () => {
    modal.classList.remove('active');
    formAction.reset();
    customFields.style.display = 'none';
  });

  // Toggle Custom fields in form when Custom template is chosen
  selectTemplate.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customFields.style.display = 'block';
      document.getElementById('input-custom-name').required = true;
    } else {
      customFields.style.display = 'none';
      document.getElementById('input-custom-name').required = false;
    }
  });

  // Submit Eco-Action form
  formAction.addEventListener('submit', (e) => {
    e.preventDefault();
    submitEcoAction();
  });
}

// ==========================================
// Action Checklist Logic
// ==========================================
function renderRecommendations() {
  const container = document.getElementById('action-list-container');
  container.innerHTML = '';

  RECOMMENDATIONS.forEach(rec => {
    const isChecked = state.committedActions.includes(rec.id);
    
    const card = document.createElement('div');
    card.className = `action-item ${isChecked ? 'selected' : ''}`;
    card.setAttribute('data-id', rec.id);
    
    card.innerHTML = `
      <div class="action-checkbox">
        <i class="fa-solid fa-check"></i>
      </div>
      <div class="action-info">
        <span class="action-title">${rec.title}</span>
        <span class="action-impact">-${rec.reduction.toFixed(2)} Tons CO₂e / yr</span>
      </div>
    `;

    card.addEventListener('click', () => {
      toggleActionCommitment(rec.id, card);
    });

    container.appendChild(card);
  });

  updatePotentialSaving();
}

function toggleActionCommitment(id, element) {
  const index = state.committedActions.indexOf(id);
  if (index === -1) {
    state.committedActions.push(id);
    element.classList.add('selected');
  } else {
    state.committedActions.splice(index, 1);
    element.classList.remove('selected');
  }
  
  saveState();
  updatePotentialSaving();
}

function updatePotentialSaving() {
  let totalSavings = 0;
  state.committedActions.forEach(actionId => {
    const rec = RECOMMENDATIONS.find(r => r.id === actionId);
    if (rec) totalSavings += rec.reduction;
  });
  
  document.getElementById('lbl-potential-saving').textContent = totalSavings.toFixed(2);
}

// ==========================================
// Daily Ledger Logic
// ==========================================
function submitEcoAction() {
  const selectTemplate = document.getElementById('select-action-template');
  const selectedOption = selectTemplate.options[selectTemplate.selectedIndex];
  const dateVal = document.getElementById('input-action-date').value;
  
  let description = '';
  let category = '';
  let pointsEarned = 0;
  let co2OffsetKg = 0;

  if (selectTemplate.value === 'custom') {
    description = document.getElementById('input-custom-name').value;
    category = 'lifestyle';
    pointsEarned = parseInt(document.getElementById('input-custom-points').value);
    co2OffsetKg = parseFloat(document.getElementById('input-custom-offset').value);
  } else {
    description = selectedOption.textContent;
    category = selectTemplate.value === 'commute' || selectTemplate.value === 'bike' ? 'transit' : 
               selectTemplate.value === 'energy' ? 'energy' : 'lifestyle';
    pointsEarned = parseInt(selectedOption.getAttribute('data-points'));
    co2OffsetKg = parseFloat(selectedOption.getAttribute('data-offset'));
  }

  // Create Ledger Item
  const entry = {
    id: Date.now().toString(),
    date: dateVal,
    description: description,
    category: category,
    offset: co2OffsetKg,
    points: pointsEarned
  };

  // Add item, add points
  state.ledger.push(entry);
  state.points += pointsEarned;
  
  // Calculate Streak
  updateStreak(dateVal);

  // Save and render
  saveState();
  renderLedger();
  
  // Close Modal
  document.getElementById('action-modal').classList.remove('active');
  document.getElementById('action-form').reset();
  document.getElementById('custom-action-fields').style.display = 'none';
}

function updateStreak(newActionDateStr) {
  // Simple streak tracker
  // If last logged date was yesterday, increment streak.
  // If it was today, keep it same. Otherwise, set streak to 1.
  if (!state.lastLoggedDate) {
    state.streak = 1;
  } else {
    const lastDate = new Date(state.lastLoggedDate);
    const newDate = new Date(newActionDateStr);
    
    // Clear time difference
    lastDate.setHours(0,0,0,0);
    newDate.setHours(0,0,0,0);
    
    const diffTime = Math.abs(newDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      state.streak += 1;
    } else if (diffDays > 1) {
      state.streak = 1;
    }
  }
  state.lastLoggedDate = newActionDateStr;
}

function renderLedger() {
  const ledgerBody = document.getElementById('ledger-body');
  const emptyState = document.getElementById('ledger-empty-state');
  
  // Clear non-template rows
  const rows = ledgerBody.querySelectorAll('tr:not(.empty-state-row)');
  rows.forEach(r => r.remove());

  if (state.ledger.length === 0) {
    emptyState.style.display = 'table-row';
    return;
  }

  emptyState.style.display = 'none';

  // Sort by date descending
  const sortedLedger = [...state.ledger].sort((a,b) => new Date(b.date) - new Date(a.date));

  sortedLedger.forEach(entry => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', entry.id);

    // Format category label
    let catBadgeClass = 'badge-lifestyle';
    if (entry.category === 'transit') catBadgeClass = 'badge-transit';
    if (entry.category === 'energy') catBadgeClass = 'badge-energy';

    // Format Date beautifully
    const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td><strong>${entry.description}</strong></td>
      <td><span class="badge-cat ${catBadgeClass}">${entry.category}</span></td>
      <td><span class="offset-value">-${entry.offset.toFixed(1)} kg</span></td>
      <td><span class="points-value">+${entry.points} pts</span></td>
      <td>
        <button class="btn-delete" title="Delete action logs"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    `;

    // Hook up delete listener
    tr.querySelector('.btn-delete').addEventListener('click', () => {
      deleteLedgerEntry(entry.id, entry.points);
    });

    ledgerBody.appendChild(tr);
  });
}

function deleteLedgerEntry(id, pointsDeduced) {
  const index = state.ledger.findIndex(e => e.id === id);
  if (index !== -1) {
    state.ledger.splice(index, 1);
    state.points = Math.max(0, state.points - pointsDeduced);
    saveState();
    renderLedger();
  }
}
