import { phone } from 'phone';

/**
 * Validate and format phone number
 */
export const validatePhoneNumber = (phoneNumber: string, countryCode: string = '+91') => {
  try {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const fullNumber = countryCode + cleanNumber;
    const result = phone(fullNumber);

    if (result.isValid) {
      return {
        isValid: true,
        formattedNumber: result.phoneNumber,
        countryCode: result.countryCode,
        phoneNumber: cleanNumber,
      };
    } else {
      return {
        isValid: false,
        error: 'Invalid phone number format',
      };
    }
  } catch {
    return {
      isValid: false,
      error: 'Error validating phone number',
    };
  }
};

/**
 * Extract country code from full phone number
 */
export const extractCountryCode = (fullPhoneNumber: string) => {
  try {
    const result = phone(fullPhoneNumber);

    if (result.isValid) {
      const formattedNumber = result.phoneNumber;
      const countryCode = result.countryCode;
      const phoneNumber = formattedNumber.replace(countryCode, '');

      return {
        isValid: true,
        countryCode,
        phoneNumber,
        formattedNumber,
      };
    } else {
      return {
        isValid: false,
        error: 'Invalid phone number format',
      };
    }
  } catch {
    return {
      isValid: false,
      error: 'Error extracting country code',
    };
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneForDisplay = (phoneNumber: string, countryCode: string = '+91') => {
  const validation = validatePhoneNumber(phoneNumber, countryCode);

  if (validation.isValid) {
    return validation.formattedNumber;
  }

  return countryCode + phoneNumber;
};

