import { createContext, useContext, useState } from "react";
import "./CustomAlert.css";

const CustomAlertContext = createContext(null);

export function CustomAlertProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "alert", // "alert" or "confirm"
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: "alert",
        message,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: null,
      });
    });
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: "confirm",
        message,
        onConfirm: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (dialogState.type === "alert") {
        dialogState.onConfirm();
      } else if (dialogState.onCancel) {
        dialogState.onCancel();
      }
    }
  };

  return (
    <CustomAlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialogState.isOpen && (
        <div className="ca-overlay animate-fade-in" onClick={handleBackdropClick}>
          <div className="ca-modal glass animate-scale-up">
            <div className="ca-icon-container">
              {dialogState.type === "alert" ? (
                <div className="ca-icon alert">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
              ) : (
                <div className="ca-icon confirm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                </div>
              )}
            </div>
            
            <p className="ca-message">{dialogState.message}</p>
            
            <div className="ca-actions">
              {dialogState.type === "confirm" ? (
                <>
                  <button className="ca-btn ca-btn-primary" onClick={dialogState.onConfirm}>
                    موافق
                  </button>
                  <button className="ca-btn ca-btn-secondary" onClick={dialogState.onCancel}>
                    إلغاء
                  </button>
                </>
              ) : (
                <button className="ca-btn ca-btn-primary" onClick={dialogState.onConfirm} style={{ width: "100%" }}>
                  موافق
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error("useCustomAlert must be used within a CustomAlertProvider");
  }
  return context;
}
