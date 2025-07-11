
export function numberToWords(number: number): string {
  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ];

  const tens = [
    '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
  ];

  const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

  if (number === 0) return 'zero';

  let result = '';
  let scaleIndex = 0;

  // Handle decimal part
  const [integerPart, decimalPart] = number.toString().split('.');
  let num = parseInt(integerPart);

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      let chunkText = '';
      
      const hundreds = Math.floor(chunk / 100);
      if (hundreds > 0) {
        chunkText += ones[hundreds] + ' hundred ';
      }
      
      const remainder = chunk % 100;
      if (remainder < 20) {
        chunkText += ones[remainder];
      } else {
        const tensDigit = Math.floor(remainder / 10);
        const onesDigit = remainder % 10;
        chunkText += tens[tensDigit];
        if (onesDigit > 0) {
          chunkText += '-' + ones[onesDigit];
        }
      }
      
      if (scales[scaleIndex]) {
        chunkText += ' ' + scales[scaleIndex];
      }
      
      result = chunkText + ' ' + result;
    }
    
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  result = result.trim();

  // Handle decimal part
  if (decimalPart) {
    const cents = parseInt(decimalPart.padEnd(2, '0').substring(0, 2));
    if (cents > 0) {
      result += ' and ' + cents + '/100';
    }
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}
