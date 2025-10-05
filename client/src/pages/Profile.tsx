import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UpdateUserData } from "../types/updateUser";

const Profile = () => {
  const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const tdt_id = user.tdt_id;
  const token = localStorage.getItem("token");
  const role = Array.isArray(user.role) ? user.role[0] : user.role;

  const [userDetail, setUserDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${USER_SERVICE_URL}/api/users/tdt/${tdt_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserDetail(res.data);
        setEditedUser(res.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
        navigate("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [tdt_id, token, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser({ ...editedUser, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editedUser || !tdt_id) {
        throw new Error("Thông tin người dùng không hợp lệ");
      }

      if (!editedUser.date_of_birth) {
        throw new Error("Vui lòng chọn ngày sinh");
      }

      if (!editedUser.phone_number?.trim()) {
        throw new Error("Vui lòng nhập số điện thoại");
      }

      if (!editedUser.gender?.trim()) {
        throw new Error("Vui lòng nhập giới tính");
      }

      const phoneNumber = editedUser.phone_number.startsWith("0")
        ? editedUser.phone_number.substring(1)
        : editedUser.phone_number;

      const updateData: UpdateUserData = {
        name: userDetail.name,
        date_of_birth: new Date(editedUser.date_of_birth).toISOString(),
        phone_number: phoneNumber,
        address: editedUser.address?.trim() || "",
        gender: editedUser.gender?.trim() || "",
      };

      if (!userDetail._id) {
        throw new Error("Không tìm thấy ID người dùng");
      }

      const confirmResult = await Swal.fire({
        title: "Xác nhận cập nhật",
        text: "Bạn có chắc chắn muốn lưu thay đổi?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
      });
      if (!confirmResult.isConfirmed) return;
      const response = await axios.put(
        `${USER_SERVICE_URL}/api/users/${userDetail._id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        const updatedUserData = {
          ...userDetail,
          ...updateData,
          phone_number: updateData.phone_number.startsWith("0")
            ? updateData.phone_number
            : "0" + updateData.phone_number,
        };
        setUserDetail(updatedUserData);

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...currentUser,
          name: updatedUserData.name,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setIsEditing(false);
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Cập nhật thông tin thành công!",
        });
      }
    } catch (error: any) {
      let errorMessage = "Có lỗi xảy ra khi cập nhật thông tin!";

      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
      });

      console.error("Lỗi cập nhật thông tin:", error);
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (!userDetail) return <div>Không tìm thấy thông tin người dùng</div>;

  // --- Học sinh---
  if (role === "student") {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-blue-950 mb-8">
            Thông tin cá nhân
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <p className="text-sm text-gray-500">Vai trò</p>
              <p className="font-medium">Học sinh</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Họ và tên</p>
              <p className="font-medium">{userDetail.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">TDTU ID</p>
              <p className="font-medium">{userDetail.tdt_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày sinh</p>
              <p className="font-medium">
                {new Date(userDetail.date_of_birth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userDetail.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SĐT cá nhân</p>
              <p className="font-medium">
                {userDetail.phone_number?.startsWith("0")
                  ? userDetail.phone_number
                  : "0" + userDetail.phone_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SĐT phụ huynh</p>
              <p className="font-medium">
                {userDetail.parent_number
                  ? userDetail.parent_number
                  : "Chưa có số điện thoại phụ huynh"}
              </p>
            </div>
            <div className="">
              <p className="text-sm text-gray-500">Địa chỉ</p>
              <p className="font-medium">{userDetail.address}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- giáo viên và admin ---
  if (role === "advisor" || role === "admin") {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-blue-950">
              Thông tin cá nhân
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                <FaEdit />
              </button>
            )}
          </div>

          {isEditing ? (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="text-sm text-gray-500">Ngày sinh</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={
                    editedUser.date_of_birth
                      ? new Date(editedUser.date_of_birth)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">Giới tính</label>
                <select
                  name="gender"
                  value={editedUser.gender}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, gender: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 mt-1"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-500">SĐT cá nhân</label>
                <input
                  type="text"
                  name="phone_number"
                  value={
                    editedUser.phone_number?.startsWith("0")
                      ? editedUser.phone_number
                      : "0" + editedUser.phone_number
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitized = value.startsWith("0")
                      ? value.slice(1)
                      : value;
                    setEditedUser({ ...editedUser, phone_number: sanitized });
                  }}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                />
              </div>
              <div className="">
                <label className="text-sm text-gray-500">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={editedUser.address}
                  onChange={handleInputChange}
                  className="w-full border rounded-md px-3 py-2 mt-1"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedUser(userDetail);
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <p className="text-sm text-gray-500">Vai trò</p>
                <p className="font-medium">{userDetail.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Giới tính</p>
                <p className="font-medium">{userDetail.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Họ và tên</p>
                <p className="font-medium">{userDetail.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">{userDetail.tdt_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày sinh</p>
                <p className="font-medium">
                  {new Date(userDetail.date_of_birth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userDetail.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SĐT cá nhân</p>
                <p className="font-medium">
                  {userDetail.phone_number?.startsWith("0")
                    ? userDetail.phone_number
                    : "0" + userDetail.phone_number}
                </p>
              </div>
              <div className="">
                <p className="text-sm text-gray-500">Địa chỉ</p>
                <p className="font-medium">{userDetail.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Role không hợp lệ</div>;
};

export default Profile;
