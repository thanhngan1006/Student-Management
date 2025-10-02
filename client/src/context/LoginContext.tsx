import { createContext, useState, ReactNode, useCallback } from "react";

type LoginContextType = {
  userName: string;
  password: string;
  isShowPassword: boolean;
  handleChangeUserName: (userName: string) => void;
  handleChangePassword: (password: string) => void;
  handleShowPassword: () => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
};

export const LoginContext = createContext<LoginContextType | undefined>(
  undefined
);

type LoginProviderProps = {
  children: ReactNode;
};

export const LoginProvider = ({ children }: LoginProviderProps) => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isShowPassword, setIsShowPassword] = useState(false);

  const handleChangeUserName = useCallback((userName: string) => {
    setUserName(userName);
  }, []);

  const handleChangePassword = useCallback((password: string) => {
    setPassword(password);
  }, []);

  const handleShowPassword = useCallback(() => {
    setIsShowPassword((isShowPassword) => !isShowPassword);
  }, []);

  return (
    <LoginContext.Provider
      value={{
        userName,
        password,
        handleChangeUserName,
        handleChangePassword,
        errorMessage,
        setErrorMessage,
        isShowPassword,
        handleShowPassword,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};
