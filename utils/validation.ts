// utils/validation.ts - Input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email.trim()) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone number validation
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone.trim()) {
    errors.push('Phone number is required');
  } else {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      errors.push('Phone number must be at least 10 digits');
    } else if (digitsOnly.length > 15) {
      errors.push('Phone number cannot exceed 15 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('Name is required');
  } else {
    if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }
    
    // Check for potentially harmful characters
    const dangerousChars = /<script|javascript:|data:|vbscript:/i;
    if (dangerousChars.test(name)) {
      errors.push('Name contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date validation
export const validateDate = (date: string, fieldName: string = 'Date'): ValidationResult => {
  const errors: string[] = [];
  
  if (!date.trim()) {
    errors.push(`${fieldName} is required`);
  } else {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      errors.push(`Invalid ${fieldName.toLowerCase()} format`);
    } else {
      // Check if date is not too far in the past or future
      const currentYear = new Date().getFullYear();
      const dateYear = dateObj.getFullYear();
      
      if (dateYear < 1900 || dateYear > currentYear + 100) {
        errors.push(`${fieldName} year must be between 1900 and ${currentYear + 100}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Text field validation (for notes, addresses, etc.)
export const validateText = (text: string, fieldName: string, maxLength: number = 1000, required: boolean = false): ValidationResult => {
  const errors: string[] = [];
  
  if (required && !text.trim()) {
    errors.push(`${fieldName} is required`);
  } else if (text.trim().length > maxLength) {
    errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
  }
  
  // Check for potentially harmful content
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      errors.push(`${fieldName} contains invalid content`);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Validate patient data
export const validatePatientData = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  // Validate required fields
  const nameValidation = validateName(data.name || '');
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }
  
  const phoneValidation = validatePhone(data.contact_phone || '');
  if (!phoneValidation.isValid) {
    errors.push(...phoneValidation.errors);
  }
  
  // Validate optional email
  if (data.contact_email && data.contact_email.trim()) {
    const emailValidation = validateEmail(data.contact_email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }
  }
  
  // Validate optional date of birth
  if (data.dob && data.dob.trim()) {
    const dobValidation = validateDate(data.dob, 'Date of birth');
    if (!dobValidation.isValid) {
      errors.push(...dobValidation.errors);
    }
  }
  
  // Validate optional text fields
  if (data.address) {
    const addressValidation = validateText(data.address, 'Address', 500);
    if (!addressValidation.isValid) {
      errors.push(...addressValidation.errors);
    }
  }
  
  if (data.emergency_contact_name) {
    const emergencyNameValidation = validateName(data.emergency_contact_name);
    if (!emergencyNameValidation.isValid) {
      errors.push(...emergencyNameValidation.errors.map(err => `Emergency contact ${err.toLowerCase()}`));
    }
  }
  
  if (data.emergency_contact_phone) {
    const emergencyPhoneValidation = validatePhone(data.emergency_contact_phone);
    if (!emergencyPhoneValidation.isValid) {
      errors.push(...emergencyPhoneValidation.errors.map(err => `Emergency contact ${err.toLowerCase()}`));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate medical history data
export const validateMedicalHistoryData = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  const conditionValidation = validateText(data.condition_name || '', 'Condition name', 200, true);
  if (!conditionValidation.isValid) {
    errors.push(...conditionValidation.errors);
  }
  
  const dateValidation = validateDate(data.diagnosis_date || '', 'Diagnosis date');
  if (!dateValidation.isValid) {
    errors.push(...dateValidation.errors);
  }
  
  if (data.notes) {
    const notesValidation = validateText(data.notes, 'Notes', 1000);
    if (!notesValidation.isValid) {
      errors.push(...notesValidation.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting helper
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    return true; // Request allowed
  };
};

// HIPAA compliance helpers
export const isHIPAACompliant = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  // Check for minimum required security measures
  if (typeof data !== 'object' || data === null) {
    errors.push('Invalid data format');
    return { isValid: false, errors };
  }
  
  // Ensure no sensitive data is logged or exposed
  const sensitiveFields = ['ssn', 'social_security', 'credit_card', 'password'];
  
  for (const field of sensitiveFields) {
    if (data[field]) {
      errors.push(`Sensitive field '${field}' should not be included in patient data`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};