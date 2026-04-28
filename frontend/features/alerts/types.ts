export interface AlertsUI {
	modal: HTMLElement & {
		showModal: () => void;
		close: () => void;
		open: boolean;
	};
	chatIdInput: HTMLInputElement;
	labelInput: HTMLInputElement;
	previewEl: HTMLElement;
	itemsEl: HTMLElement;
	listEl: HTMLElement;
	cancelBtn: HTMLButtonElement;
	saveBtn: HTMLButtonElement;
}

export interface AlertsCallbacks {
	onChatIdChange: () => void;
	onSave: () => void;
	onCancel: () => void;
}

export interface AlertsState {
	isSaving: boolean;
	isLoadingAlerts: boolean;
}
