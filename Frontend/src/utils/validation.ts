export interface PasswordRule {
    label: string;
    test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
    { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { label: 'One uppercase letter (A-Z)', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter (a-z)', test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'One number (0-9)', test: (pw: string) => /[0-9]/.test(pw) },
    { label: 'One special character (!@#$%^&*)', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

export const allRulesPass = (pw: string) => PASSWORD_RULES.every(r => r.test(pw));
