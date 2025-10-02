import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import biểu tượng mắt
import axios from "axios";

const NewPassword = () => {
  const { userId } = useParams(); // token nằm ở đây
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isShowNewPassword, setIsShowNewPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        throw new Error("Vui lòng nhập đầy đủ thông tin.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Mật khẩu không khớp.");
      }

      if (newPassword.length < 6) {
        throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
      }

      const response = await axios.post("http://localhost:4003/api/auth/reset-password", {
        token: userId,
        newPassword,
      });

      setSuccess("Mật khẩu đã được cập nhật thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Reset Error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Lỗi không xác định. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Logo" className="w-20 h-20 mb-4" />
          <h1 className="text-2xl font-bold text-blue-950 text-center">
            Đặt lại mật khẩu mới
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Vui lòng nhập mật khẩu mới của bạn
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type={isShowNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập mật khẩu mới"
                disabled={isLoading}
              />
              <div
                className="absolute right-3 top-10 cursor-pointer text-gray-500"
                onClick={() => setIsShowNewPassword((prev) => !prev)}
              >
                {isShowNewPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                type={isShowConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập lại mật khẩu mới"
                disabled={isLoading}
              />
              <div
                className="absolute right-3 top-10 cursor-pointer text-gray-500"
                onClick={() => setIsShowConfirmPassword((prev) => !prev)}
              >
                {isShowConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-500 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            className={`w-full bg-blue-950 text-white py-3 rounded-lg font-medium hover:bg-blue-900 transition-colors
              ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
            `}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full text-blue-950 text-sm hover:underline mt-4"
            disabled={isLoading}
          >
            Quay lại đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPassword;
