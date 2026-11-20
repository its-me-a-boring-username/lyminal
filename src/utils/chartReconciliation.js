function timestampValue(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function canonicalize(value) {
  if (value instanceof Set) return [...value].sort();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

function chartContent(chart) {
  return canonicalize({
    spheres: chart?.spheres || [],
    connections: chart?.connections || {},
    activeGoals: chart?.activeGoals || [],
    checkedItems: chart?.checkedItems || {},
    completedGoals: chart?.completedGoals || [],
  });
}

export function chartFingerprint(chart) {
  const input = JSON.stringify(chartContent(chart));
  let hash = 14695981039346656037n;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function chartsAreEquivalent(left, right) {
  if (!left || !right) return false;
  return chartFingerprint(left) === chartFingerprint(right);
}

export function shouldPreferLocalChart(localChart, cloudChart) {
  if (!localChart?.spheres?.length) return false;
  if (!cloudChart) return true;

  return timestampValue(localChart.updatedAt) > timestampValue(cloudChart.updatedAt);
}
