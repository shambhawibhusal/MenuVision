export const formatPrepTime = (prepTime: string | number | undefined): string => {
    if (prepTime === undefined || prepTime === null || prepTime === '') {
        return '';
    }

    const num = typeof prepTime === 'number' ? prepTime : parseInt(String(prepTime).replace(/\D/g, ''), 10);

    if (isNaN(num) || num <= 0) {
        return '';
    }

    if (num < 60) {
        return `${num}min`;
    }

    const hours = Math.floor(num / 60);
    const minutes = num % 60;

    if (minutes === 0) {
        return `${hours}hour`;
    }

    return `${hours}hour ${minutes}min`;
};
