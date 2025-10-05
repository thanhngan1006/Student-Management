import { useState } from "react";
import forgotpw from "../assets/forgotpw.jpg";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { init } from "@emailjs/browser";

init({
  publicKey: "5j21xEi95fEwoKMZ-",
  limitRate: {
    throttle: 2000,
  },
});

const ResetPassword = () => {
  const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error("Vui lòng nhập email của bạn.");
      }

      const response = await axios.post(
        `${USER_SERVICE_URL}/api/auth/send-reset-link`,
        {
          email: email.trim(),
        }
      );
      setMessage(
        response.data.message || "Email đặt lại mật khẩu đã được gửi."
      );
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error: any) {
      console.error("Lỗi gửi email:", error.response?.data || error.message);
      setError(
        error.response?.data?.message || error.message || "Vui lòng thử lại sau"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-blue-950">
      <div className="w-4/5 h-4/5 bg-white rounded-md shadow-2xl shadow-blue flex">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-blue-950 font-bold text-5xl">Quên mật khẩu</h1>
          <h2 className="text-blue-950">
            Nhập email của bạn để nhận mật khẩu tạm thời
          </h2>
          <img className="w-3/5" src={forgotpw} alt="reset password" />
        </div>

        <div className="flex-1 flex flex-col gap-4 items-center justify-center">
          <div className="flex flex-col gap-2 items-center">
            <img src={logo} className="w-14 h-14" alt="logo" />
            <span className="font-bold">Stdportal</span>
          </div>

          <form
            onSubmit={handleResetPassword}
            className="flex flex-col gap-4 w-3/5"
          >
            <div className="flex flex-col gap-1">
              <label className="text-blue-950 font-semibold">Email</label>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="border border-gray-300 rounded-md p-2"
                disabled={isLoading}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}

            <button
              type="submit"
              className={`bg-blue-950 hover:bg-blue-900 text-white rounded-md p-2 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? "Đang gửi..." : "Quên mật khẩu"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-blue-950 text-sm hover:underline"
              disabled={isLoading}
            >
              Quay lại đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
