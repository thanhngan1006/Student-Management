import axios from "axios";
import { useState } from "react";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";

type Props = {
  role: string;
  students: any[];
  onDelete: (tdt_id: string) => void;
  classId: string;
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
};

const StudentList = ({ students, onDelete, classId, setStudents }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const userId = editingStudent._id;

      const updatePayload = {
        name: editingStudent.name,
        phone_number: editingStudent.phoneNumber || editingStudent.phone_number,
        parent_number:
          editingStudent.parentPhoneNumber || editingStudent.parent_number,
        address: editingStudent.address,
        date_of_birth:
          editingStudent.dateOfBirth instanceof Date
            ? editingStudent.dateOfBirth.toISOString()
            : editingStudent.dateOfBirth || editingStudent.date_of_birth,
        gender: editingStudent.gender,
      };

      const res = await axios.put(
        `http://localhost:4003/api/users/${userId}`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res);

      Swal.fire({
        icon: "success",
        title: "Cập nhật thành công!",
        timer: 1500,
        showConfirmButton: false,
      });

      setStudents((prev) =>
        prev.map((s) => (s._id === userId ? { ...s, ...updatePayload } : s))
      );

      setIsEditing(false);
    } catch (err: any) {
      console.error(
        "Lỗi khi cập nhật học sinh:",
        err.response?.data?.message || err.message
      );
      Swal.fire({
        icon: "error",
        title: "Cập nhật thất bại!",
        text: err.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      {isEditing && editingStudent && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-1/2">
            <h2 className="text-xl font-bold mb-4">
              Chỉnh sửa thông tin học sinh
            </h2>
            <form onSubmit={handleUpdate} className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Họ và tên</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Giới tính</label>
                <input
                  type="text"
                  value={editingStudent.gender}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      gender: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Ngày sinh</label>
                <input
                  type="date"
                  value={
                    editingStudent.date_of_birth
                      ? new Date(editingStudent.date_of_birth)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      date_of_birth: new Date(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Lớp</label>
                <input
                  type="text"
                  value={editingStudent.class_id || classId}
                  readOnly
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      class_id: e.target.value,
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
                  value={
                    editingStudent.phone_number?.startsWith("0")
                      ? editingStudent.phone_number
                      : "0" + editingStudent.phone_number
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitized = value.startsWith("0")
                      ? value.slice(1)
                      : value;
                    setEditingStudent({
                      ...editingStudent,
                      phone_number: sanitized,
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Số điện thoại phụ huynh
                </label>
                <input
                  type="text"
                  value={
                    editingStudent.parent_number
                      ? editingStudent.parent_number
                      : "Chưa có thông tin"
                  }
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      parent_number: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Địa chỉ</label>
                <input
                  type="text"
                  value={editingStudent.address}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
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
              Mã định danh
            </th>
            <th className="text-base border border-gray-300 p-2">Giới tính</th>
            <th className="text-base border border-gray-300 p-2">Ngày sinh</th>
            <th className="text-base border border-gray-300 p-2">Email</th>
            <th className="text-base border border-gray-300 p-2">
              Số điện thoại
            </th>
            <th className="text-base border border-gray-300 p-2">
              Số điện thoại phụ huynh
            </th>
            <th className="border text-base border-gray-300 p-2">Địa chỉ</th>
            <th className="border text-base border-gray-300 p-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.tdt_id || student._id}
              className="hover:bg-gray-100"
            >
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.name}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.tdt_id}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.gender == "female" ? "Nữ" : "Nam"}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.date_of_birth
                  ? new Date(student.date_of_birth).toLocaleDateString()
                  : "Chưa có thông tin"}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.email}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.phone_number?.startsWith("0")
                  ? student.phone_number
                  : "0" + student.phone_number}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.parent_number
                  ? student.parent_number
                  : "Chưa có thông tin"}
              </td>
              <td className="text-center border text-sm border-gray-300 p-4">
                {student.address}
              </td>
              <td className="border text-sm border-gray-300 text-center">
                <button
                  onClick={() => handleEdit(student)}
                  className="cursor-pointer mr-2 text-xl text-blue-500 hover:text-blue-700"
                >
                  <CiEdit />
                </button>

                <button
                  onClick={() => onDelete(student.tdt_id)}
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

export default StudentList;
