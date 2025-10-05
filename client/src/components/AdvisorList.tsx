import axios from "axios";
import { useState, useEffect } from "react";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
type Props = {
  advisors: any[];
  onRefresh: () => void;
};

const AdvisorList = ({ advisors, onRefresh }: Props) => {
  const API_URL = process.env.REACT_APP_API_GATEWAY_URL;
  const [isEditing, setIsEditing] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<any>(null);
  const [departmentNames, setDepartmentNames] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const fetchDepartments = async () => {
      const token = localStorage.getItem("token");
      const newMap: { [key: string]: string } = {};

      await Promise.all(
        advisors.map(async (advisor) => {
          try {
            const res = await axios.get(
              `${API_URL}/api/departments/of-user/${advisor._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            newMap[advisor._id] = res.data.departmentName;
          } catch (err) {
            newMap[advisor._id] = "Chưa có tổ";
          }
        })
      );

      setDepartmentNames(newMap);
    };

    if (advisors.length > 0) {
      fetchDepartments();
    }
  }, [advisors]);

  const handleDelete = async (_id: string) => {
    try {
      const confirm = await Swal.fire({
        title: "Bạn có chắc muốn xoá?",
        text: "Thao tác này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Xoá",
        cancelButtonText: "Huỷ",
      });

      if (confirm.isConfirmed) {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/api/users/${_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        await Swal.fire(
          "Đã xoá!",
          "giáo viên đã được xoá thành công.",
          "success"
        );
        onRefresh();
      }
    } catch (err) {
      console.error("Lỗi khi xoá giáo viên:", err);
      Swal.fire("Lỗi!", "Đã xảy ra lỗi khi xoá giáo viên.", "error");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/users/${editingAdvisor._id}`,
        editingAdvisor,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
      onRefresh();
      Swal.fire("Thành công!", "Thông tin đã được cập nhật", "success");
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
    }
  };

  return (
    <div className="overflow-x-auto">
      {isEditing && editingAdvisor && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-1/2">
            <h2 className="text-xl font-bold mb-4">
              Chỉnh sửa thông tin giáo viên
            </h2>
            <form onSubmit={handleUpdate} className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Giới tính</label>
                <input
                  type="text"
                  value={editingAdvisor.gender}
                  onChange={(e) =>
                    setEditingAdvisor({
                      ...editingAdvisor,
                      gender: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium">Lớp</label>
                <input
                  type="text"
                  value={editingAdvisor.class_id}
                  onChange={(e) =>
                    setEditingAdvisor({
                      ...editingAdvisor,
                      class_id: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div> */}
              <div>
                <label className="block text-sm font-medium">Ngày sinh</label>
                <input
                  type="date"
                  value={
                    editingAdvisor.date_of_birth
                      ? new Date(editingAdvisor.date_of_birth)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditingAdvisor({
                      ...editingAdvisor,
                      date_of_birth: new Date(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editingAdvisor.phone_number}
                  onChange={(e) =>
                    setEditingAdvisor({
                      ...editingAdvisor,
                      phone_number: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Địa chỉ</label>
                <input
                  type="text"
                  value={editingAdvisor.address}
                  onChange={(e) =>
                    setEditingAdvisor({
                      ...editingAdvisor,
                      address: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="text-base border border-gray-300 p-2">Họ và tên</th>
            <th className="text-base border border-gray-300 p-2">
              Mã số giáo viên
            </th>
            <th className="text-base border border-gray-300 p-2">Tổ</th>
            <th className="text-base border border-gray-300 p-2">Lớp</th>
            <th className="text-base border border-gray-300 p-2">Ngày sinh</th>
            <th className="text-base border border-gray-300 p-2">Email</th>
            <th className="text-base border border-gray-300 p-2">
              Số điện thoại
            </th>
            <th className="border text-base border-gray-300 p-2">Địa chỉ</th>
            <th className="border text-base border-gray-300 p-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {advisors.map((advisor) => (
            <tr key={advisor.tdt_id} className="hover:bg-gray-100">
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.name}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.tdt_id}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {departmentNames[advisor._id] || "Đang tải..."}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.class_id ? advisor.class_id : "Chưa có lớp"}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.date_of_birth
                  ? new Date(advisor.date_of_birth).toLocaleDateString()
                  : "Chưa có ngày sinh"}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.email}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.phone_number}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {advisor.address}
              </td>
              <td className="border text-sm border-gray-300 text-center">
                <button
                  onClick={() => {
                    setEditingAdvisor(advisor);
                    setIsEditing(true);
                  }}
                  className="cursor-pointer mr-2 text-xl text-blue-500 hover:text-blue-700"
                >
                  <CiEdit />
                </button>
                <button
                  onClick={() => handleDelete(advisor._id)}
                  className="cursor-pointer text-red-500 text-xl hover:text-red-700"
                >
                  <MdDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdvisorList;
