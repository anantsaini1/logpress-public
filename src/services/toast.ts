import Toast from 'react-native-toast-message';

export const useToastService = () => {
  const showToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string,
    duration: number = 3000
  ) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: duration,
      position: 'top',
    });
  };

  const showSuccess = (title: string, message?: string) => {
    showToast('success', title, message);
  };

  const showError = (title: string, message?: string) => {
    showToast('error', title, message);
  };

  const showInfo = (title: string, message?: string) => {
    showToast('info', title, message);
  };

  const hideToast = () => {
    Toast.hide();
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    hideToast,
  };
}; 