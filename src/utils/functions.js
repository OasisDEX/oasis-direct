import  BigNumber from 'bignumber.js'

export const numberFormat = (value, precision=5) => {
  if(isNaN(value)) return;
  const asBigNumber = new BigNumber(value);
  return asBigNumber.toFormat(precision);
};