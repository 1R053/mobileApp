export interface ActionSheetConfig {
    options: string[];
    callback: (p_optionIndex: number) => void
}

export const actionSheet = {
    showActionSheet: (p_config: ActionSheetConfig) => { }
};
