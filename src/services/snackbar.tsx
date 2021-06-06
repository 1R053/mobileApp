export interface SnackbarConfig {
    text: string;
    duration?: number;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
}

export const snackbar = {
    showSnackBar: (p_config: SnackbarConfig) => { }
};
