const test = require('node:test');
const assert = require('node:assert');
const { 
  calculateTransportEmissions, 
  calculateEnergyEmissions, 
  calculateLifestyleEmissions, 
  calculateTotalEmissions,
  escapeHTML 
} = require('../public/app.js');

test('Carbon Footprint Calculator Engine', async (t) => {
  
  await t.test('calculateTransportEmissions maps calculations correctly', () => {
    // Standard medium-petrol car, 120 miles/wk, 4 transit hrs, 2 flights/yr
    const emissions = calculateTransportEmissions(120, 'medium-petrol', 4, 2);
    // 120 * 52 = 6240 miles/yr. carCO2 = 6240 * 0.38 * 1.0 = 2371.2 kg
    // 4 * 25 * 52 = 5200 transit miles/yr. transitCO2 = 5200 * 0.08 = 416 kg
    // 2 * 350 = 700 kg flightCO2
    // total = (2371.2 + 416 + 700) / 1000 = 3.4872 Tons
    assert.strictEqual(emissions.toFixed(4), '3.4872');

    // EV car modifier test (0.15 modifier)
    const evEmissions = calculateTransportEmissions(120, 'electric', 4, 2);
    assert.strictEqual(evEmissions.toFixed(4), '1.4717');
  });

  await t.test('calculateTransportEmissions handles negative and invalid inputs defensively', () => {
    // Negative values should be clamped to 0
    const emissionsNegative = calculateTransportEmissions(-100, 'medium-petrol', -10, -5);
    assert.strictEqual(emissionsNegative, 0);

    // Missing/NaN values should default to 0
    const emissionsNaN = calculateTransportEmissions(undefined, null, 'invalid-string', {});
    assert.strictEqual(emissionsNaN, 0);
  });

  await t.test('calculateEnergyEmissions splits energy cost by household size', () => {
    // 80 electricity, standard energy grid, 50 gas, 2 people
    const emissions = calculateEnergyEmissions(80, 'standard', 50, 2);
    // electricityCO2 = 80 * 12 * 0.35 * 1.0 = 336 kg
    // gasCO2 = 50 * 12 * 0.6 = 360 kg
    // total = 696 kg. Per person = 348 kg = 0.348 Tons
    assert.strictEqual(emissions.toFixed(3), '0.348');

    // 100% green energy grid modifier test (0.05 modifier)
    const greenEmissions = calculateEnergyEmissions(80, 'green-100', 50, 2);
    assert.strictEqual(greenEmissions.toFixed(4), '0.1884');
  });

  await t.test('calculateEnergyEmissions handles invalid inputs and zero size defensively', () => {
    // Household size of 0 should clamp to minimum of 1 to prevent Division by Zero
    const emissionsZeroSize = calculateEnergyEmissions(100, 'standard', 50, 0);
    // electricity = 100 * 12 * 0.35 = 420 kg
    // gas = 50 * 12 * 0.6 = 360 kg
    // size = 0 clamped to 1. total = (420 + 360) / 1 / 1000 = 0.78 Tons
    assert.strictEqual(emissionsZeroSize.toFixed(2), '0.78');

    // Negative inputs should clamp to 0
    const emissionsNegative = calculateEnergyEmissions(-80, 'standard', -50, -2);
    // bills clamp to 0. size clamps to 1. total = 0 Tons
    assert.strictEqual(emissionsNegative, 0);

    // Null/undefined checks
    const emissionsNull = calculateEnergyEmissions(null, null, undefined, null);
    assert.strictEqual(emissionsNull, 0);
  });

  await t.test('calculateLifestyleEmissions computes diet and waste impacts', () => {
    // Vegetarian, Low waste, 150 spend
    const emissions = calculateLifestyleEmissions('vegetarian', 'low', 150);
    // diet = 1.1, waste = 0.15
    // shopping = 150 * 12 * 0.15 / 1000 = 0.27 Tons
    // total = 1.1 + 0.15 + 0.27 = 1.52 Tons
    assert.strictEqual(emissions.toFixed(2), '1.52');
  });

  await t.test('calculateLifestyleEmissions handles invalid/negative shopping spends', () => {
    const emissionsNegative = calculateLifestyleEmissions('vegan', 'low', -500);
    // diet = 0.65, waste = 0.15, shopping clamps to 0
    // total = 0.65 + 0.15 + 0 = 0.80 Tons
    assert.strictEqual(emissionsNegative.toFixed(2), '0.80');
  });

  await t.test('calculateTotalEmissions aggregates correctly', () => {
    const inputs = {
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
    };
    const result = calculateTotalEmissions(inputs);
    assert.strictEqual(result.transport.toFixed(4), '3.4872');
    assert.strictEqual(result.energy.toFixed(3), '0.348');
    assert.strictEqual(result.lifestyle.toFixed(2), '2.37'); // 1.7 + 0.4 + 0.27 = 2.37
    assert.strictEqual(result.total.toFixed(4), '6.2052');
  });

  await t.test('calculateTotalEmissions handles null/undefined input state object', () => {
    const result = calculateTotalEmissions(null);
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.transport, 0);
  });

  await t.test('escapeHTML prevents script injections', () => {
    const malicious = '<script>alert("XSS")</script>';
    const safe = escapeHTML(malicious);
    assert.strictEqual(safe, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

});
