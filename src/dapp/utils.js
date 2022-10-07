const getDomValuesWithStyle = (value, positiveValue, negativeValue) => {
  const text = value ? positiveValue : negativeValue;
  const color = value ? 'green' : '#d14343';
  return { text, color };
};

export { getDomValuesWithStyle };
