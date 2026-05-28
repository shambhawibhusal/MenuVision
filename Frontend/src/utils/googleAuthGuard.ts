let suppressProcessing = false;

export function setGoogleAuthProcessing(value: boolean) {
    suppressProcessing = value;
}

export function isGoogleAuthProcessing(): boolean {
    return suppressProcessing;
}
