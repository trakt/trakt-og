// The toasts on screen, newest first like OG's toastr. <Toaster /> in the root layout renders them.
// Call it from interactions only: this module is shared by every request on the server.
type ToastType = 'success' | 'error';

/** A button on the toast that closes it and runs: "Upgrade", or with an `icon`, an icon button whose tooltip is the label. */
export interface ToastAction {
  readonly label: string;
  readonly icon?: string;
  readonly run: () => void;
}

interface Toast {
  readonly id: number;
  readonly type: ToastType;
  readonly message: string;
  readonly action?: ToastAction;
}

let nextId = 0;
let list = $state<ReadonlyArray<Toast>>([]);

const show = (type: ToastType) => (message: string, action?: ToastAction) => {
  list = [{ id: nextId++, type, message, ...(action ? { action } : {}) }, ...list];
};

export const toast = {
  get list() {
    return list;
  },
  success: show('success'),
  error: show('error'),
  dismiss: (id: number) => {
    list = list.filter((item) => item.id !== id);
  },
};
