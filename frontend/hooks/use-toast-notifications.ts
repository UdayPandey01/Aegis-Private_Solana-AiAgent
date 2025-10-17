'use client';

import { toast } from 'sonner';

export const useToastNotifications = () => {
    const showSuccess = (message: string, description?: string) => {
        toast.success(message, {
            description,
            duration: 4000,
        });
    };

    const showError = (message: string, description?: string) => {
        toast.error(message, {
            description,
            duration: 6000,
        });
    };

    const showWarning = (message: string, description?: string) => {
        toast.warning(message, {
            description,
            duration: 5000,
        });
    };

    const showInfo = (message: string, description?: string) => {
        toast.info(message, {
            description,
            duration: 4000,
        });
    };

    const showLoading = (message: string) => {
        return toast.loading(message);
    };

    const dismiss = (toastId?: string | number) => {
        toast.dismiss(toastId);
    };

    return {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showLoading,
        dismiss,
    };
};
