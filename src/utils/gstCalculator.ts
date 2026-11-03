export interface GstBreakdown {
  cgst: number
  sgst: number
  igst: number
  total: number
}

export const calculateGst = (amount: number, rate: number, isInterState: boolean): GstBreakdown => {
  const gstAmount = amount * (rate / 100);
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: amount + gstAmount
    };
  } else {
    const halfGst = gstAmount / 2;
    return {
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      total: amount + gstAmount
    };
  }
}
