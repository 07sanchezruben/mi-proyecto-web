const zoneMatch = (driverZones = [], targetZones = []) => {
  const dZones = new Set((driverZones || []).map((z) => z.toLowerCase()));
  const tZones = new Set((targetZones || []).map((z) => z.toLowerCase()));
  let matches = 0;
  tZones.forEach((zone) => {
    if (dZones.has(zone)) matches += 1;
  });
  if (!tZones.size) return 100;
  return Math.round((matches / tZones.size) * 100);
};

const categoriesMatch = (driverCategories = [], companyCategories = []) => {
  const driver = new Set((driverCategories || []).map((c) => c.toLowerCase()));
  const company = new Set((companyCategories || []).map((c) => c.toLowerCase()));
  let matches = 0;
  company.forEach((category) => {
    if (driver.has(category)) matches += 1;
  });
  if (!company.size) return 100;
  return Math.round((matches / company.size) * 100);
};

export function calculateMatchScore(driver, company) {
  const kmFactor = Math.min(driver.kmPerMonth / Math.max(company.minKmPerMonth, 1), 2);
  const kmScore = Math.min(Math.round(kmFactor * 50), 100);
  const timeScore = driver.drivingSlot === company.targetSlot || company.targetSlot === 'any'
    ? 100
    : driver.drivingSlot === 'any'
      ? 80
      : 40;
  const placeScore = driver.circulationCity.toLowerCase() === company.circulationCity.toLowerCase()
    ? zoneMatch(driver.circulationZones, company.targetZones)
    : 10;
  const wrapScore = driver.wrapSize === company.wrapSize ? 100 : 40;
  const sectorScore = categoriesMatch(driver.categories, company.categories);

  const finalScore = Math.round(
    kmScore * 0.25 +
      timeScore * 0.2 +
      placeScore * 0.3 +
      wrapScore * 0.1 +
      sectorScore * 0.15
  );

  return {
    kmScore,
    timeScore,
    placeScore,
    wrapScore,
    sectorScore,
    matchScore: finalScore
  };
}

export function estimateCampaignAmounts(driver, company) {
  const basePrices = {
    small: 80,
    medium: 120,
    full: 180
  };
  const base = basePrices[company.wrapSize] || 100;
  const kmFactor = Math.min(Math.max(driver.kmPerMonth / Math.max(company.minKmPerMonth, 1), 1), 2);
  let grossMonthly = base * kmFactor;
  if (company.budgetPerMonth) {
    grossMonthly = Math.min(grossMonthly, company.budgetPerMonth);
  }
  const platformFee = +(grossMonthly * 0.2).toFixed(2);
  const driverNet = +(grossMonthly - platformFee).toFixed(2);
  return { grossMonthly: +grossMonthly.toFixed(2), platformFee, driverNet };
}
